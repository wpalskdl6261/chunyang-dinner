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
  seafood: ["고등어", "오징어", "새우", "꽃게", "참치", "멸치", "조개", "연어"],
  sweet: ["케이크", "초코", "푸딩", "요거트", "아이스", "젤리", "주스"],
  veggie: ["나물", "샐러드", "채소", "묵", "오이", "브로콜리", "양배추", "버섯", "시금치"],
  soup: ["국", "탕", "찌개", "스프"],
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
    reason: "익힌 채소와 국물이 중심이라 가족끼리 천천히 먹기 좋아요.",
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
  return `chunyang-dinner-usage:v3:${todayIso()}`;
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
  elements.quotaCount.textContent = `${remaining}회`;
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
  if (flags.meat) tags.push({ text: "든든한 메인", tone: "warm" });
  if (flags.seafood) tags.push({ text: "해산물", tone: "cool" });
  if (flags.spicy) tags.push({ text: "매콤한 양념", tone: "accent" });
  if (flags.fried) tags.push({ text: "바삭한 메뉴", tone: "warm" });
  if (flags.sweet) tags.push({ text: "달콤한 마무리", tone: "accent" });
  if (flags.veggie) tags.push({ text: "채소 반찬", tone: "" });
  if (!tags.length) tags.push({ text: "오늘의 메뉴", tone: "" });

  let title = "편안한 흐름의 점심이에요";
  if (flags.soup && flags.meat) title = "따뜻하고 든든한 점심이에요";
  else if (flags.spicy) title = "매콤한 포인트가 있는 점심이에요";
  else if (flags.seafood) title = "바다 재료가 들어간 점심이에요";
  else if (flags.sweet) title = "달콤한 마무리가 있는 점심이에요";
  else if (flags.veggie) title = "산뜻한 반찬이 보이는 점심이에요";

  return {
    flags,
    tags,
    title,
    copy: `${meal.items.length}개 메뉴가 확인됐어요. 저녁은 선택한 취향에 맞춰 자연스럽게 이어볼게요.`,
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
  elements.balanceTitle.textContent = "메뉴를 기다리는 중";
  elements.balanceCopy.textContent = "점심 메뉴가 들어오면 저녁 추천을 준비할게요.";
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
  setStatus("급식을 불러오는 중");
  elements.loadButton.disabled = true;
  updateQuota();

  try {
    const response = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?${params}`);
    if (!response.ok) throw new Error("network");
    const data = await response.json();
    const row = data.mealServiceDietInfo?.[1]?.row?.[0];

    if (!row) {
      setStatus("등록된 중식 정보가 없어요.", true);
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
    setStatus(`${SCHOOL.name} ${row.MMEAL_SC_NM} ${meal.items.length}개 메뉴`);
    renderMeal(meal);
    renderNote(state.note);
  } catch (error) {
    setStatus("급식 정보를 불러오지 못했어요.", true);
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
