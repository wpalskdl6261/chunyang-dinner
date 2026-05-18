const SCHOOL = {
  name: "춘양초등학교",
  officeCode: "R10",
  schoolCode: "8961038",
};

const DAILY_LIMIT = 2;
const state = {
  meal: null,
  note: null,
  preference: "balanced",
};

const elements = {
  date: document.querySelector("#mealDate"),
  todayButton: document.querySelector("#todayButton"),
  loadButton: document.querySelector("#loadButton"),
  mealStatus: document.querySelector("#mealStatus"),
  mealList: document.querySelector("#mealList"),
  calories: document.querySelector("#calories"),
  protein: document.querySelector("#protein"),
  fat: document.querySelector("#fat"),
  balanceTitle: document.querySelector("#balanceTitle"),
  balanceCopy: document.querySelector("#balanceCopy"),
  analysisTags: document.querySelector("#analysisTags"),
  recommendButton: document.querySelector("#recommendButton"),
  recommendations: document.querySelector("#recommendations"),
  quotaCount: document.querySelector("#quotaCount"),
  lockMessage: document.querySelector("#lockMessage"),
  prefButtons: document.querySelectorAll(".pref-button"),
};

const keywordSets = {
  fried: ["튀김", "돈까스", "치킨", "탕수", "강정", "프라이", "군만두"],
  spicy: ["매운", "고추", "마라", "짬뽕", "떡볶", "불닭", "닭갈비", "주꾸미", "제육"],
  meat: ["닭", "돼지", "돈육", "소고기", "쇠고기", "베이컨", "삼계탕", "갈비", "햄", "소시지"],
  chicken: ["닭", "치킨", "삼계탕"],
  pork: ["돼지", "돈육", "베이컨", "햄", "소시지"],
  beef: ["소고기", "쇠고기", "한우", "불고기"],
  seafood: ["고등어", "오징어", "새우", "꽃게", "참치", "멸치", "조개", "연어", "생선"],
  sweet: ["케이크", "초코", "푸딩", "요거트", "아이스", "젤리", "주스", "과일", "사과", "배"],
  veggie: ["나물", "샐러드", "채소", "묵", "오이", "브로콜리", "양배추", "버섯", "시금치", "김치"],
  soup: ["국", "탕", "찌개", "스프", "수제비"],
};

const dinnerPool = [
  {
    title: "두부버섯덮밥 + 오이무침",
    tags: ["담백", "부드러운 식감", "한 그릇"],
    avoids: [],
    prefs: ["balanced", "light", "veggie"],
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
    avoids: [],
    prefs: ["light", "balanced"],
    reason: "간단하고 부드러운 맛이라 편안한 저녁을 만들기 좋아요.",
  },
  {
    title: "버섯콩나물밥 + 양념장 조금",
    tags: ["향긋함", "채소", "가벼운 한 그릇"],
    avoids: [],
    prefs: ["veggie", "light", "balanced"],
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
    avoids: [],
    prefs: ["veggie", "hearty", "balanced"],
    reason: "익힌 채소와 국물이 중심이라 천천히 먹기 좋아요.",
  },
  {
    title: "참치김치볶음밥 + 달걀후라이",
    tags: ["빠른 준비", "집밥", "고소함"],
    avoids: ["seafood"],
    prefs: ["hearty"],
    reason: "준비가 빠르고 맛의 방향이 또렷해서 바쁜 저녁에 잘 맞아요.",
  },
  {
    title: "들깨수제비 + 부추겉절이",
    tags: ["고소함", "따뜻함", "포근함"],
    avoids: [],
    prefs: ["hearty"],
    reason: "들깨 국물이 포근해서 날씨가 선선하거나 따뜻한 메뉴가 끌릴 때 좋아요.",
  },
  {
    title: "비빔밥 + 고추장 적게",
    tags: ["색감", "한 그릇", "깔끔함"],
    avoids: [],
    prefs: ["veggie", "balanced"],
    reason: "여러 재료를 한 그릇에 담아 보기 좋고, 양념을 부드럽게 맞추기 쉬워요.",
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

function usageKey() {
  return `chunyang-dinner-usage:v4:${todayIso()}`;
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
  elements.quotaCount.textContent = `${remaining}번`;
  elements.recommendButton.disabled = remaining <= 0 || !state.meal;
  elements.lockMessage.hidden = remaining > 0;
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
    benefitText = "영양 선생님이 골고루 챙겨주신 멋진 식단이라 쑥쑥 자라는 데 최고랍니다!";
  }

  const copy = `${benefitText} 정말 훌륭하죠? 겹치지 않게 맛있는 저녁을 골라줄게요!`;

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
}

async function loadMeal() {
  const dateValue = elements.date.value || todayIso();
  const params = new URLSearchParams({
    Type: "json",
    pIndex: "1",
    pSize: "10",
    ATPT_OFCDC_SC_CODE: SCHOOL.officeCode,
    SD_SCHUL_CODE: SCHOOL.schoolCode,
    MLSV_YMD: dateToYmd(dateValue),
    MMEAL_SC_CODE: "2",
  });

  state.meal = null;
  state.note = null;
  resetMealUi();
  setStatus("영양 선생님의 식단을 가져오는 중이에요! 🏃‍♂️");
  elements.loadButton.disabled = true;
  updateQuota();

  try {
    const response = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?${params}`);
    if (!response.ok) throw new Error("network");
    const data = await response.json();
    const row = data.mealServiceDietInfo?.[1]?.row?.[0];

    if (!row) {
      setStatus("앗! 이 날은 점심 정보가 없어요 😢", true);
      return;
    }

    const meal = {
      date: dateValue,
      items: cleanDishText(row.DDISH_NM),
      calories: row.CAL_INFO || "",
      nutrition: parseNutrition(row.NTR_INFO),
      raw: row,
    };

    state.meal = meal;
    state.note = describeMeal(meal);
    setStatus(`${SCHOOL.name} ${row.MMEAL_SC_NM} 완성! ✨`);
    renderMeal(meal);
    renderNote(state.note);
  } catch (error) {
    setStatus("인터넷 연결이 조금 불안한가 봐요 😭", true);
  } finally {
    elements.loadButton.disabled = false;
    updateQuota();
    if (window.lucide) window.lucide.createIcons();
  }
}

function recommendationRank(item, note) {
  let rank = item.prefs.includes(state.preference) ? 16 : 0;
  const calories = Number.parseFloat(state.meal.calories);

  if (state.preference === "balanced" && item.prefs.includes("balanced")) rank += 6;
  if ((note.flags.fried || note.flags.sweet || calories >= 700) && item.prefs.includes("light")) rank += 8;
  if (note.flags.spicy && item.prefs.includes("light")) rank += 5;
  if (note.flags.chicken && item.avoids.includes("chicken")) rank -= 24;
  if (note.flags.pork && item.avoids.includes("pork")) rank -= 24;
  if (note.flags.beef && item.avoids.includes("beef")) rank -= 24;
  if (note.flags.seafood && item.avoids.includes("seafood")) rank -= 18;

  return rank + item.title.length / 100;
}

function buildRecommendations() {
  if (!state.meal || !state.note) return [];
  return [...dinnerPool]
    .sort((a, b) => recommendationRank(b, state.note) - recommendationRank(a, state.note))
    .slice(0, 3);
}

function renderRecommendations(items) {
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

    card.append(title, reason, tags);
    fragment.append(card);
  });

  elements.recommendations.replaceChildren(fragment);
}

function recommendDinner() {
  if (!state.meal) return;
  const used = getUsage();
  if (used >= DAILY_LIMIT) {
    updateQuota();
    return;
  }

  renderRecommendations(buildRecommendations());
  setUsage(used + 1);
}

function bindEvents() {
  elements.todayButton.addEventListener("click", () => {
    elements.date.value = todayIso();
    loadMeal();
  });
  elements.loadButton.addEventListener("click", loadMeal);
  elements.recommendButton.addEventListener("click", recommendDinner);
  elements.prefButtons.forEach((button) => {
    button.addEventListener("click", () => {
      elements.prefButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.preference = button.dataset.pref;
      if (elements.recommendations.children.length) {
        renderRecommendations(buildRecommendations());
      }
    });
  });
}

function init() {
  elements.date.value = todayIso();
  bindEvents();
  updateQuota();
  loadMeal();
  if (window.lucide) window.lucide.createIcons();
}

init();