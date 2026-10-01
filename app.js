const SCHOOL = {
  name: "춘양초등학교",
  officeCode: "R10",
  schoolCode: "8961038",
};

// 제미나이 추천 서버(Cloudflare Worker) 주소. 비워 두면 앱에 들어 있는 기본 메뉴로 추천해요.
// 예: "https://chunyang-dinner.<계정이름>.workers.dev"
const AI_ENDPOINT = "";

// 직접 입력 추천은 한 사람이 하루 2번까지
const DAILY_LIMIT = 2;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const state = {
  meal: null,
  note: null,
  preference: "balanced",
  selectedDate: null,
  weekStart: null,
  // 주 시작일(YYYY-MM-DD) → { "YYYYMMDD": NEIS row }
  weekCache: new Map(),
  // 그날 제미나이가 미리 만든 취향별 추천 { date, prefs }
  ai: null,
  // 취향별로 「다른 메뉴 보기」를 몇 번 눌렀는지
  pages: {},
};

const PAGE_SIZE = 3;
const CANDIDATE_COUNT = 6;

const elements = {
  date: document.querySelector("#mealDate"),
  todayButton: document.querySelector("#todayButton"),
  prevWeek: document.querySelector("#prevWeek"),
  nextWeek: document.querySelector("#nextWeek"),
  weekLabel: document.querySelector("#weekLabel"),
  dayList: document.querySelector("#dayList"),
  lunchTitle: document.querySelector("#lunch-title"),
  teacherPhoto: document.querySelector("#teacherPhoto"),
  mealStatus: document.querySelector("#mealStatus"),
  mealList: document.querySelector("#mealList"),
  calories: document.querySelector("#calories"),
  protein: document.querySelector("#protein"),
  fat: document.querySelector("#fat"),
  balanceTitle: document.querySelector("#balanceTitle"),
  balanceCopy: document.querySelector("#balanceCopy"),
  analysisTags: document.querySelector("#analysisTags"),
  recommendations: document.querySelector("#recommendations"),
  quotaCount: document.querySelector("#quotaCount"),
  lockMessage: document.querySelector("#lockMessage"),
  aiNotice: document.querySelector("#aiNotice"),
  shuffleButton: document.querySelector("#shuffleButton"),
  shufflePage: document.querySelector("#shufflePage"),
  prefButtons: document.querySelectorAll(".pref-button"),
  customForm: document.querySelector("#customForm"),
  customInput: document.querySelector("#customInput"),
  customButton: document.querySelector("#customButton"),
  customMessage: document.querySelector("#customMessage"),
  customResults: document.querySelector("#customResults"),
};

const keywordSets = {
  fried: ["튀김", "돈까스", "치킨", "탕수", "강정", "프라이", "군만두"],
  spicy: ["매운", "고추", "마라", "짬뽕", "떡볶", "불닭", "닭갈비", "주꾸미", "제육"],
  meat: ["닭", "돼지", "돈육", "소고기", "쇠고기", "베이컨", "삼계탕", "갈비", "햄", "소시지", "소세지", "설렁탕", "곰탕"],
  chicken: ["닭", "치킨", "삼계탕"],
  pork: ["돼지", "돈육", "베이컨", "햄", "소시지"],
  beef: ["소고기", "쇠고기", "한우", "불고기", "설렁탕"],
  seafood: ["고등어", "오징어", "새우", "꽃게", "참치", "멸치", "조개", "연어", "생선"],
  sweet: ["케이크", "초코", "푸딩", "요거트", "아이스", "젤리", "주스", "과일", "사과", "배"],
  veggie: ["나물", "샐러드", "채소", "묵", "오이", "브로콜리", "양배추", "버섯", "시금치", "김치"],
  soup: ["국", "탕", "찌개", "스프", "수제비"],
  egg: ["계란", "달걀", "에그", "오믈렛"],
  noodle: ["면", "국수", "우동", "스파게티", "파스타", "칼국수", "짜장"],
};

const dinnerPool = [
  {
    title: "두부버섯덮밥 + 오이무침",
    tags: ["담백", "부드러운 식감", "한 그릇"],
    avoids: [],
    prefs: ["balanced", "light", "veggie", "bowl", "quick"],
    reason: "버섯 향과 두부의 부드러움이 저녁을 차분하게 정리해줘요.",
  },
  {
    title: "고등어구이 + 잡곡밥 + 시금치나물",
    tags: ["한식", "고소함", "따뜻한 밥상"],
    avoids: ["seafood"],
    prefs: ["balanced", "hearty"],
    reason: "구운 생선과 나물 조합은 집밥 느낌이 선명해서 하루 끝에 잘 어울려요.",
  },
  {
    title: "계란찜 + 애호박볶음 + 맑은 미역국",
    tags: ["부드러움", "편안함", "맑은 국"],
    avoids: ["egg"],
    prefs: ["light", "balanced", "quick"],
    reason: "간단하고 부드러운 맛이라 편안한 저녁을 만들기 좋아요.",
  },
  {
    title: "버섯콩나물밥 + 양념장 조금",
    tags: ["향긋함", "채소", "가벼운 한 그릇"],
    avoids: [],
    prefs: ["veggie", "light", "balanced", "bowl"],
    reason: "콩나물 식감과 버섯 향이 살아 있어서 부담 없이 먹기 좋은 한 그릇이에요.",
  },
  {
    title: "소고기무국 + 잡곡밥 + 김구이",
    tags: ["든든함", "맑은 국", "한식"],
    avoids: ["beef"],
    prefs: ["hearty", "balanced"],
    reason: "따뜻한 국물과 밥이 중심이라 활동 많은 날에도 안정감 있게 마무리돼요.",
  },
  {
    title: "채소 샤브샤브 + 칼국수 조금",
    tags: ["따뜻함", "선택 쉬움", "채소"],
    avoids: ["noodle"],
    prefs: ["veggie", "hearty", "balanced", "noodle"],
    reason: "익힌 채소와 국물이 중심이라 천천히 먹기 좋아요.",
  },
  {
    title: "참치김치볶음밥 + 달걀후라이",
    tags: ["빠른 준비", "집밥", "고소함"],
    avoids: ["seafood", "egg"],
    prefs: ["hearty", "bowl", "quick", "spicy"],
    reason: "준비가 빠르고 맛의 방향이 또렷해서 바쁜 저녁에 잘 맞아요.",
  },
  {
    title: "들깨수제비 + 부추겉절이",
    tags: ["고소함", "따뜻함", "포근함"],
    avoids: ["noodle"],
    prefs: ["hearty", "noodle"],
    reason: "들깨 국물이 포근해서 날씨가 선선하거나 따뜻한 메뉴가 끌릴 때 좋아요.",
  },
  {
    title: "비빔밥 + 고추장 적게",
    tags: ["색감", "한 그릇", "깔끔함"],
    avoids: [],
    prefs: ["veggie", "balanced", "bowl", "spicy"],
    reason: "여러 재료를 한 그릇에 담아 보기 좋고, 양념을 부드럽게 맞추기 쉬워요.",
  },
  {
    title: "잔치국수 + 달걀지단",
    tags: ["면 요리", "맑은 국물", "금방 완성"],
    avoids: ["noodle", "egg"],
    prefs: ["noodle", "light", "quick"],
    reason: "멸치 국물에 소면을 말면 금방 차릴 수 있고, 속도 편안해요.",
  },
  {
    title: "순한 닭갈비 볶음밥",
    tags: ["매콤달콤", "한 그릇", "든든함"],
    avoids: ["chicken"],
    prefs: ["spicy", "hearty", "bowl"],
    reason: "고추장을 조금만 넣어 살짝 매콤하게 볶으면 맛있게 한 그릇 뚝딱이에요.",
  },
  {
    title: "토마토달걀볶음 + 쌀밥",
    tags: ["10분 요리", "새콤달콤", "채소"],
    avoids: ["egg"],
    prefs: ["quick", "light", "veggie"],
    reason: "토마토와 달걀만 있으면 10분 안에 뚝딱, 새콤달콤해서 입맛이 살아나요.",
  },
  {
    title: "채소 듬뿍 카레라이스",
    tags: ["한 그릇", "향긋함", "든든함"],
    avoids: [],
    prefs: ["bowl", "hearty", "balanced", "veggie"],
    reason: "감자·당근·양파가 듬뿍 들어가서 한 그릇만 먹어도 든든해요.",
  },
  {
    title: "꼬마김밥 + 어묵국",
    tags: ["분식", "한입 쏙", "따뜻한 국"],
    avoids: [],
    prefs: ["light", "balanced"],
    reason: "한입에 쏙 들어가는 꼬마김밥이라 먹기 편하고, 어묵국이 속을 데워 줘요.",
  },
  {
    title: "짜장덮밥 + 단무지",
    tags: ["중식", "달콤짭짤", "한 그릇"],
    avoids: ["pork", "noodle"],
    prefs: ["bowl", "hearty"],
    reason: "달콤짭짤한 짜장 소스에 밥을 쓱쓱 비비면 금방 한 그릇을 비워요.",
  },
  {
    title: "따끈한 어묵우동",
    tags: ["면 요리", "맑은 국물", "포근함"],
    avoids: ["noodle"],
    prefs: ["noodle", "light", "quick"],
    reason: "통통한 우동 면과 맑은 국물이 부드러워서 저녁에 편하게 먹기 좋아요.",
  },
  {
    title: "비빔국수 + 삶은 달걀",
    tags: ["새콤달콤", "면 요리", "시원함"],
    avoids: ["noodle", "egg"],
    prefs: ["noodle", "spicy"],
    reason: "새콤달콤 살짝 매콤한 양념이 입맛을 확 살려 줘요.",
  },
  {
    title: "토마토 스파게티 + 브로콜리",
    tags: ["양식", "새콤달콤", "면 요리"],
    avoids: ["noodle"],
    prefs: ["noodle", "balanced"],
    reason: "토마토 소스에 채소를 듬뿍 넣으면 맛도 영양도 모두 챙길 수 있어요.",
  },
  {
    title: "닭가슴살 샐러드 + 구운 고구마",
    tags: ["가벼움", "채소", "달콤함"],
    avoids: ["chicken"],
    prefs: ["light", "veggie"],
    reason: "아삭한 채소와 달콤한 고구마로 가볍지만 배는 든든해요.",
  },
  {
    title: "돼지고기 김치찌개 + 밥",
    tags: ["한식", "얼큰함", "든든함"],
    avoids: ["pork"],
    prefs: ["spicy", "hearty", "balanced"],
    reason: "푹 익은 김치와 고기가 어우러져서 밥 한 공기가 뚝딱이에요.",
  },
  {
    title: "새우볶음밥 + 맑은 달걀국",
    tags: ["볶음밥", "고소함", "금방 완성"],
    avoids: ["seafood", "egg"],
    prefs: ["bowl", "quick"],
    reason: "냉동 새우와 채소만 있으면 금방 만들 수 있는 고소한 볶음밥이에요.",
  },
  {
    title: "불고기 + 쌈채소 + 잡곡밥",
    tags: ["달콤짭짤", "쌈 싸 먹기", "채소"],
    avoids: ["beef"],
    prefs: ["hearty", "veggie", "balanced"],
    reason: "달콤한 불고기를 상추에 싸 먹으면 채소도 저절로 많이 먹게 돼요.",
  },
  {
    title: "알록달록 월남쌈",
    tags: ["채소 듬뿍", "직접 싸 먹기", "상큼함"],
    avoids: [],
    prefs: ["veggie", "light"],
    reason: "좋아하는 채소를 골라 직접 싸 먹는 재미가 있는 저녁이에요.",
  },
  {
    title: "콩나물국밥",
    tags: ["시원한 국물", "한 그릇", "담백함"],
    avoids: [],
    prefs: ["bowl", "light"],
    reason: "시원한 콩나물 국물에 밥을 말아 먹으면 속이 편안해져요.",
  },
  {
    title: "치즈 달걀토스트 + 우유",
    tags: ["5분 요리", "고소함", "간단"],
    avoids: ["egg"],
    prefs: ["quick", "light"],
    reason: "식빵에 달걀과 치즈만 올려 구우면 5분 만에 완성이에요.",
  },
  {
    title: "떡국 + 김치",
    tags: ["쫄깃함", "따뜻함", "한식"],
    avoids: [],
    prefs: ["hearty", "quick", "balanced"],
    reason: "쫄깃한 떡과 따뜻한 국물이 든든하고, 만들기도 어렵지 않아요.",
  },
];

function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function dateToYmd(dateValue) {
  return dateValue.replaceAll("-", "");
}

function parseIso(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function addDays(iso, days) {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

// 그 주의 월요일 (주말이면 다음 주 월요일)
function schoolWeekStart(iso) {
  const day = parseIso(iso).getDay();
  if (day === 0) return addDays(iso, 1);
  if (day === 6) return addDays(iso, 2);
  return addDays(iso, 1 - day);
}

function dayLabel(iso) {
  const date = parseIso(iso);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
}

function usageKey() {
  return `chunyang-dinner-custom:v1:${todayIso()}`;
}

function getUsage() {
  const saved = Number(localStorage.getItem(usageKey()));
  return Number.isFinite(saved) ? saved : 0;
}

function setUsage(nextValue) {
  localStorage.setItem(usageKey(), String(nextValue));
  updateQuota();
}

function updateQuota() {
  const remaining = Math.max(DAILY_LIMIT - getUsage(), 0);
  elements.quotaCount.textContent = AI_ENDPOINT ? `${remaining}번` : "준비 중";
  elements.customButton.disabled = !AI_ENDPOINT || remaining <= 0;
  elements.customInput.disabled = !AI_ENDPOINT || remaining <= 0;
  elements.lockMessage.hidden = !AI_ENDPOINT || remaining > 0;
}

function setStatus(message, isError = false) {
  elements.mealStatus.textContent = message;
  elements.mealStatus.classList.toggle("error", isError);
}

function cleanDishText(text) {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .split("\n")
    .map((item) =>
      item
        .replace(/\([^)]*\)/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

function parseNutrition(nutritionText = "") {
  const result = {};
  nutritionText
    .replace(/<br\s*\/?>/gi, "\n")
    .split("\n")
    .forEach((line) => {
      const [label, value] = line.split(":").map((part) => part?.trim());
      if (label && value) result[label] = value;
    });
  return result;
}

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
}

function describeMeal(meal) {
  const joined = meal.items.join(" ");
  const flags = Object.fromEntries(
    Object.entries(keywordSets).map(([key, words]) => [key, hasAny(joined, words)]),
  );

  const tags = [];
  if (flags.soup) tags.push({ text: "따뜻한 국물", tone: "cool" });
  if (flags.meat) tags.push({ text: "든든한 고기", tone: "warm" });
  if (flags.seafood) tags.push({ text: "바다 영양", tone: "cool" });
  if (flags.spicy) tags.push({ text: "매콤달콤", tone: "accent" });
  if (flags.fried) tags.push({ text: "바삭바삭", tone: "warm" });
  if (flags.sweet) tags.push({ text: "달콤한 후식", tone: "accent" });
  if (flags.veggie) tags.push({ text: "싱싱 채소", tone: "green" });
  if (!tags.length) tags.push({ text: "맛있는 점심", tone: "" });

  let title = "우와! 맛있고 건강한 점심이에요 😋";
  if (flags.soup && flags.meat) title = "따뜻하고 든든한 최고 점심이에요!";
  else if (flags.spicy) title = "매콤달콤 입맛을 확 살려주는 점심이에요!";
  else if (flags.seafood) title = "바다의 영양소가 듬뿍 담긴 점심이에요!";
  else if (flags.sweet) title = "달콤한 후식이 기다리는 행복한 점심이에요!";
  else if (flags.veggie) title = "비타민이 가득! 몸이 튼튼해지는 점심이에요!";

  // 메뉴의 장점 설명 생성
  const benefits = [];
  if (flags.meat || flags.chicken || flags.pork || flags.beef) {
    benefits.push("고기 반찬은 쑥쑥 크는 우리 친구들에게 든든한 호랑이 기운을 줘요 🐯");
  }
  if (flags.veggie) {
    benefits.push("싱싱한 채소에는 비타민이 가득해서 나쁜 감기균도 으쌰으쌰 이겨낼 수 있어요 🥦");
  }
  if (flags.soup) {
    benefits.push("따뜻한 국물은 뱃속을 부드럽게 쓰다듬어 주어 소화가 아주 잘 되게 도와준답니다 🥣");
  }
  if (flags.seafood) {
    benefits.push("해산물에는 머리를 똑똑하게 해주는 마법의 영양소가 듬뿍 들어있어요 🐟");
  }
  if (flags.sweet) {
    benefits.push("달콤한 후식 덕분에 기분이 날아갈 듯 좋아져서 오후 수업도 즐거울 거예요 🍎");
  }
  if (flags.fried) {
    benefits.push("바삭바삭 씹는 재미가 있어서 밥투정하는 날에도 밥 한 그릇을 뚝딱 비우게 해줘요 🍤");
  }
  if (flags.spicy) {
    benefits.push("살짝 매콤달콤한 맛이 학교 생활의 스트레스를 휙 날려버려 줄 거예요 🌶️");
  }

  let benefitText = "";
  if (benefits.length > 0) {
    // 너무 길어지지 않게 최대 2개 장점만 연결
    benefitText = benefits.slice(0, 2).join(" 그리고 ");
  } else {
    benefitText = "선생님이 골고루 챙겨 준 식단이라 쑥쑥 자라는 데 최고랍니다!";
  }

  const copy = `${benefitText} 저녁은 점심이랑 겹치지 않게 골라 볼까요?`;

  return {
    flags,
    tags,
    title,
    copy,
  };
}

function renderMeal(meal) {
  const fragment = document.createDocumentFragment();
  meal.items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    fragment.append(li);
  });

  elements.mealList.replaceChildren(fragment);
  elements.calories.textContent = meal.calories || "-";
  elements.protein.textContent = meal.nutrition["단백질(g)"] || "-";
  elements.fat.textContent = meal.nutrition["지방(g)"] || "-";
}

function renderNote(note) {
  elements.balanceTitle.textContent = note.title;
  elements.balanceCopy.textContent = note.copy;

  const fragment = document.createDocumentFragment();
  note.tags.forEach((tag) => {
    const badge = document.createElement("span");
    badge.className = `tag ${tag.tone}`.trim();
    badge.textContent = tag.text;
    fragment.append(badge);
  });
  elements.analysisTags.replaceChildren(fragment);
}

function resetMealUi() {
  elements.mealList.replaceChildren();
  elements.calories.textContent = "-";
  elements.protein.textContent = "-";
  elements.fat.textContent = "-";
  elements.balanceTitle.textContent = "어떤 반찬이 나올까요? 🧐";
  elements.balanceCopy.textContent = "날짜를 고르면 맛있는 점심 메뉴와 추천 저녁을 보여줄게요!";
  elements.analysisTags.replaceChildren();
  elements.recommendations.replaceChildren();
  elements.aiNotice.hidden = true;
  elements.shuffleButton.hidden = true;
  elements.customResults.replaceChildren();
  elements.customMessage.hidden = true;
}

// 월~금 급식을 한 번에 받아서 주 단위로 저장
async function fetchWeek(weekStart) {
  if (state.weekCache.has(weekStart)) return state.weekCache.get(weekStart);

  const params = new URLSearchParams({
    Type: "json",
    pIndex: "1",
    pSize: "10",
    ATPT_OFCDC_SC_CODE: SCHOOL.officeCode,
    SD_SCHUL_CODE: SCHOOL.schoolCode,
    MLSV_FROM_YMD: dateToYmd(weekStart),
    MLSV_TO_YMD: dateToYmd(addDays(weekStart, 4)),
    MMEAL_SC_CODE: "2",
  });

  const response = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?${params}`);
  if (!response.ok) throw new Error("network");
  const data = await response.json();
  const rows = data.mealServiceDietInfo?.[1]?.row || [];

  const week = {};
  rows.forEach((row) => {
    week[row.MLSV_YMD] = row;
  });
  state.weekCache.set(weekStart, week);
  return week;
}

function renderWeek() {
  const week = state.weekCache.get(state.weekStart);
  const today = todayIso();
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < 5; i += 1) {
    const iso = addDays(state.weekStart, i);
    const date = parseIso(iso);
    const hasMeal = Boolean(week?.[dateToYmd(iso)]);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-button";
    button.classList.toggle("active", iso === state.selectedDate);
    button.classList.toggle("today", iso === today);
    button.classList.toggle("empty", Boolean(week) && !hasMeal);
    button.dataset.date = iso;
    button.innerHTML = `<span class="day-name">${WEEKDAYS[date.getDay()]}</span><strong>${date.getDate()}</strong><span class="day-dot">${
      week ? (hasMeal ? "🍚" : "쉼") : "…"
    }</span>`;
    button.setAttribute("aria-label", `${dayLabel(iso)}${hasMeal ? "" : " 급식 없음"}`);
    button.addEventListener("click", () => selectDate(iso));
    fragment.append(button);
  }

  const start = parseIso(state.weekStart);
  elements.weekLabel.textContent =
    state.weekStart === schoolWeekStart(today) ? "이번 주" : `${start.getMonth() + 1}월 ${start.getDate()}일 주`;
  elements.dayList.replaceChildren(fragment);
}

async function selectDate(iso) {
  const weekStart = schoolWeekStart(iso);
  // 주말을 고르면 다음 주 월요일로 넘어가요
  const day = parseIso(iso).getDay();
  const target = day === 0 || day === 6 ? weekStart : iso;

  state.selectedDate = target;
  state.weekStart = weekStart;
  state.meal = null;
  state.note = null;
  state.ai = null;
  state.pages = {};
  elements.date.value = target;
  elements.lunchTitle.textContent = target === todayIso() ? "오늘 점심" : `${dayLabel(target)} 점심`;
  resetMealUi();
  renderWeek();
  updateQuota();

  if (!state.weekCache.has(weekStart)) {
    setStatus("영양 선생님의 식단을 가져오는 중이에요! 🏃‍♂️");
  }

  let week;
  try {
    week = await fetchWeek(weekStart);
  } catch (error) {
    setStatus("인터넷 연결이 조금 불안한가 봐요 😭", true);
    return;
  }

  // 기다리는 사이 다른 날짜를 눌렀으면 무시
  if (state.selectedDate !== target) return;
  renderWeek();

  const row = week[dateToYmd(target)];
  if (!row) {
    setStatus(
      target !== iso ? "주말이라 다음 주 월요일로 왔는데, 아직 식단이 안 올라왔어요 😢" : "앗! 이 날은 점심 정보가 없어요 😢",
      true,
    );
    return;
  }

  const meal = {
    date: target,
    items: cleanDishText(row.DDISH_NM),
    calories: row.CAL_INFO || "",
    nutrition: parseNutrition(row.NTR_INFO),
    raw: row,
  };

  state.meal = meal;
  state.note = describeMeal(meal);
  setStatus(
    target !== iso
      ? `주말이라 다음 주 월요일 점심을 보여줄게요! ✨`
      : `${SCHOOL.name} ${row.MMEAL_SC_NM} 완성! ✨`,
  );
  renderMeal(meal);
  renderNote(state.note);
  updateQuota();
  // 점심이 나오면 저녁 추천도 바로 보여 주고, 제미나이 추천이 오면 바꿔 끼워요
  recommendDinner();
  loadAiDaily(target);
}

// ---------------- 제미나이 추천 ----------------
async function loadAiDaily(date, attempt = 0) {
  if (!AI_ENDPOINT) return;
  try {
    const response = await fetch(`${AI_ENDPOINT}/daily?date=${date}`);
    if (!response.ok) throw new Error("ai");
    const data = await response.json();
    if (state.selectedDate !== date) return;

    // 다른 친구가 막 만드는 중이면 잠시 뒤 다시 받아요
    if (data.pending && attempt < 6) {
      setTimeout(() => loadAiDaily(date, attempt + 1), 4000);
      return;
    }
    if (!data.prefs) return;

    state.ai = { date, prefs: data.prefs };
    if (state.meal) recommendDinner();
  } catch (error) {
    // 서버가 안 되면 기본 메뉴로 추천해요
  }
}

function aiItemsFor(preference) {
  if (!state.ai || state.ai.date !== state.selectedDate) return null;
  const items = state.ai.prefs?.[preference];
  return items?.length ? items : null;
}

function recommendationRank(item, note) {
  let rank = item.prefs.includes(state.preference) ? 16 : 0;
  const calories = Number.parseFloat(state.meal.calories);

  if ((note.flags.fried || note.flags.sweet || calories >= 700) && item.prefs.includes("light")) rank += 8;
  if (note.flags.spicy && item.prefs.includes("light")) rank += 5;
  if (note.flags.chicken && item.avoids.includes("chicken")) rank -= 24;
  if (note.flags.pork && item.avoids.includes("pork")) rank -= 24;
  if (note.flags.beef && item.avoids.includes("beef")) rank -= 24;
  if (note.flags.seafood && item.avoids.includes("seafood")) rank -= 18;
  if (note.flags.egg && item.avoids.includes("egg")) rank -= 14;
  if (note.flags.noodle && item.avoids.includes("noodle")) rank -= 14;

  // 날짜마다 다르게 섞되, 같은 날에는 누구에게나 같은 순서
  return rank + seededRandom(`${state.selectedDate}:${state.preference}:${item.title}`) * 16;
}

// 글자를 넣으면 늘 같은 0~1 사이 값이 나와요
function seededRandom(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

// 그 취향의 후보 전체 (제미나이 6개, 없으면 기본 메뉴 중 잘 맞는 6개)
function buildCandidates() {
  if (!state.meal || !state.note) return [];
  const aiItems = aiItemsFor(state.preference);
  if (aiItems) return aiItems.map((item) => ({ ...item, ai: true }));
  return dinnerPool
    .filter((item) => item.prefs.includes(state.preference))
    .sort((a, b) => recommendationRank(b, state.note) - recommendationRank(a, state.note))
    .slice(0, CANDIDATE_COUNT);
}

function renderRecommendations(items, target = elements.recommendations) {
  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "recommendation";

    const title = document.createElement("h3");
    title.textContent = item.title;

    const reason = document.createElement("p");
    reason.textContent = item.reason;

    const tags = document.createElement("div");
    tags.className = "mini-tags";
    item.tags.forEach((tag) => {
      const badge = document.createElement("span");
      badge.textContent = tag;
      tags.append(badge);
    });

    if (item.ai) {
      const source = document.createElement("span");
      source.className = "ai-badge";
      source.textContent = "✨ 제미나이";
      card.append(source);
    }

    card.append(title, reason, tags);
    fragment.append(card);
  });

  target.replaceChildren(fragment);
}

function recommendDinner() {
  if (!state.meal) return;
  const candidates = buildCandidates();
  const pageCount = Math.max(Math.ceil(candidates.length / PAGE_SIZE), 1);
  const page = (state.pages[state.preference] || 0) % pageCount;
  const items = candidates.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  renderRecommendations(items);
  elements.aiNotice.hidden = false;
  elements.aiNotice.textContent = items[0]?.ai
    ? "✨ 오늘 점심을 보고 제미나이가 미리 골라 둔 메뉴예요."
    : "🍽️ 앱에 들어 있는 기본 메뉴 중에서 골랐어요.";
  elements.shuffleButton.hidden = pageCount < 2;
  elements.shufflePage.textContent = `${page + 1}/${pageCount}`;
}

function showNextPage() {
  state.pages[state.preference] = (state.pages[state.preference] || 0) + 1;
  recommendDinner();
}

function showCustomMessage(message, isError = false) {
  elements.customMessage.hidden = !message;
  elements.customMessage.textContent = message;
  elements.customMessage.classList.toggle("error", isError);
}

async function askCustom(event) {
  event.preventDefault();
  const text = elements.customInput.value.trim();
  const used = getUsage();
  if (!AI_ENDPOINT || !text || used >= DAILY_LIMIT) return;

  const date = state.selectedDate || todayIso();
  elements.customButton.disabled = true;
  elements.customResults.replaceChildren();
  showCustomMessage("제미나이가 열심히 고르는 중이에요… 🍳");

  try {
    const response = await fetch(`${AI_ENDPOINT}/custom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, text }),
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      // 잘못 쓴 글이나 서버 문제는 횟수를 깎지 않아요
      showCustomMessage(data.message || "다시 한번 적어 줄래요?", true);
      return;
    }

    setUsage(used + 1);
    showCustomMessage(data.message);
    renderRecommendations(
      data.items.map((item) => ({ ...item, ai: true })),
      elements.customResults,
    );
    elements.customInput.value = "";
  } catch (error) {
    showCustomMessage("인터넷 연결이 조금 불안한가 봐요 😭", true);
  } finally {
    updateQuota();
  }
}

function bindEvents() {
  elements.todayButton.addEventListener("click", () => selectDate(todayIso()));
  elements.prevWeek.addEventListener("click", () => selectDate(addDays(state.weekStart, -7)));
  elements.nextWeek.addEventListener("click", () => selectDate(addDays(state.weekStart, 7)));
  elements.date.addEventListener("change", () => {
    if (elements.date.value) selectDate(elements.date.value);
  });
  elements.customForm.addEventListener("submit", askCustom);
  elements.shuffleButton.addEventListener("click", showNextPage);
  elements.prefButtons.forEach((button) => {
    button.addEventListener("click", () => {
      elements.prefButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.preference = button.dataset.pref;
      recommendDinner();
    });
  });
  // 선생님 사진이 없으면 이모지로 대신 보여줘요
  elements.teacherPhoto.addEventListener("error", () => {
    elements.teacherPhoto.closest(".teacher-photo").classList.add("no-photo");
  });
  if (elements.teacherPhoto.complete && !elements.teacherPhoto.naturalWidth) {
    elements.teacherPhoto.closest(".teacher-photo").classList.add("no-photo");
  }
}

function init() {
  bindEvents();
  updateQuota();
  selectDate(todayIso());
  if (window.lucide) window.lucide.createIcons();
}

init();
