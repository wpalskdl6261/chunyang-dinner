const SCHOOL = {
  name: "춘양초등학교",
  officeCode: "R10",
  schoolCode: "8961038",
};

const DAILY_LIMIT = 2;
const state = {
  meal: null,
  analysis: null,
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
  balanceScore: document.querySelector("#balanceScore"),
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
    tags: ["담백", "식물성 단백질", "속 편함"],
    avoids: [],
    prefs: ["balanced", "light", "veggie"],
    reason: "점심이 든든한 날에도 부담이 적고, 버섯과 두부로 단백질과 식감을 같이 채울 수 있어요.",
  },
  {
    title: "고등어구이 + 잡곡밥 + 시금치나물",
    tags: ["오메가3", "채소 보충", "한식"],
    avoids: ["seafood"],
    prefs: ["balanced", "hearty"],
    reason: "육류 위주의 점심 뒤에 생선과 나물로 방향을 바꾸면 영양 균형이 좋아져요.",
  },
  {
    title: "계란찜 + 애호박볶음 + 맑은 미역국",
    tags: ["부드러움", "가볍게", "저자극"],
    avoids: [],
    prefs: ["light", "balanced"],
    reason: "간이 세거나 후식이 있는 점심 뒤에 무난하게 먹기 좋은 조합이에요.",
  },
  {
    title: "버섯콩나물밥 + 양념장 조금",
    tags: ["채소", "향긋함", "과식 방지"],
    avoids: [],
    prefs: ["veggie", "light", "balanced"],
    reason: "밥은 챙기되 콩나물과 버섯 비중을 높여 저녁이 무겁지 않게 잡혀요.",
  },
  {
    title: "소고기무국 + 잡곡밥 + 김구이",
    tags: ["든든함", "맑은 국", "한식"],
    avoids: ["beef"],
    prefs: ["hearty", "balanced"],
    reason: "활동량이 많은 날에 좋고, 매운 양념 없이 따뜻하게 마무리하기 좋아요.",
  },
  {
    title: "채소 샤브샤브 + 칼국수 조금",
    tags: ["채소 듬뿍", "따뜻함", "조절 쉬움"],
    avoids: [],
    prefs: ["veggie", "hearty", "balanced"],
    reason: "점심에 부족했던 채소를 크게 보충하면서 양을 조절하기 쉬운 메뉴예요.",
  },
  {
    title: "참치김치볶음밥 + 달걀후라이",
    tags: ["간단", "단백질", "집밥"],
    avoids: ["seafood"],
    prefs: ["hearty"],
    reason: "저녁 준비 시간이 짧을 때 좋고, 달걀을 더하면 포만감이 안정적으로 올라가요.",
  },
  {
    title: "들깨수제비 + 부추겉절이",
    tags: ["고소함", "따뜻함", "든든함"],
    avoids: [],
    prefs: ["hearty"],
    reason: "몸이 허한 날에 좋지만, 점심 열량이 높았다면 수제비 양을 조금 줄이면 좋아요.",
  },
  {
    title: "비빔밥 + 고추장 적게",
    tags: ["채소", "색감", "균형"],
    avoids: [],
    prefs: ["veggie", "balanced"],
    reason: "여러 채소를 한 번에 먹기 좋고, 양념만 조절하면 깔끔한 저녁이 돼요.",
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
  return `chunyang-dinner-usage:v1:${todayIso()}`;
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

function analyzeMeal(meal) {
  const joined = meal.items.join(" ");
  const calories = Number.parseFloat(meal.calories);
  const flags = Object.fromEntries(
    Object.entries(keywordSets).map(([key, words]) => [key, hasAny(joined, words)]),
  );

  let score = 82;
  if (calories >= 700) score -= 9;
  if (flags.fried) score -= 11;
  if (flags.sweet) score -= 6;
  if (flags.veggie) score += 6;
  if (flags.seafood) score += 3;
  if (flags.meat) score += 2;
  score = Math.max(56, Math.min(96, score));

  const tags = [];
  if (calories >= 700) tags.push({ text: "든든한 열량", tone: "warn" });
  if (flags.meat) tags.push({ text: "단백질 충분", tone: "cool" });
  if (flags.soup) tags.push({ text: "국물 메뉴", tone: "cool" });
  if (flags.sweet) tags.push({ text: "달콤한 후식", tone: "warn" });
  if (flags.veggie) tags.push({ text: "채소 요소 있음", tone: "" });
  if (flags.fried) tags.push({ text: "기름진 메뉴", tone: "warn" });
  if (!tags.length) tags.push({ text: "무난한 구성", tone: "" });

  const title = score >= 84 ? "균형 좋은 점심" : score >= 72 ? "저녁으로 균형 맞추기" : "저녁은 가볍게";
  const copy = makeBalanceCopy(flags, calories);

  return { flags, score, tags, title, copy };
}

function makeBalanceCopy(flags, calories) {
  if (calories >= 700 && flags.meat) {
    return "점심이 보양식처럼 든든해서 저녁은 채소와 담백한 단백질 쪽이 잘 맞아요.";
  }
  if (flags.fried || flags.sweet) {
    return "기름기나 단맛이 있는 날이라 저녁은 맑은 국, 두부, 생선, 나물 쪽이 좋아요.";
  }
  if (flags.spicy) {
    return "양념이 강한 편이라 저녁은 덜 맵고 속 편한 메뉴로 잡으면 좋아요.";
  }
  if (flags.veggie) {
    return "채소가 어느 정도 있어서 저녁은 단백질만 깔끔하게 보강해도 좋아요.";
  }
  return "특별히 치우친 점심은 아니라 취향에 맞춰 무겁지 않게 고르면 좋아요.";
}

function renderMeal(meal) {
  elements.mealList.innerHTML = meal.items.map((item) => `<li>${item}</li>`).join("");
  elements.calories.textContent = meal.calories || "-";
  elements.protein.textContent = meal.nutrition["단백질(g)"] || "-";
  elements.fat.textContent = meal.nutrition["지방(g)"] || "-";
}

function renderAnalysis(analysis) {
  elements.balanceScore.textContent = analysis.score;
  elements.balanceTitle.textContent = analysis.title;
  elements.balanceCopy.textContent = analysis.copy;
  elements.analysisTags.innerHTML = analysis.tags
    .map((tag) => `<span class="tag ${tag.tone}">${tag.text}</span>`)
    .join("");
}

function resetMealUi() {
  elements.mealList.innerHTML = "";
  elements.calories.textContent = "-";
  elements.protein.textContent = "-";
  elements.fat.textContent = "-";
  elements.balanceScore.textContent = "-";
  elements.balanceTitle.textContent = "메뉴를 기다리는 중";
  elements.balanceCopy.textContent = "점심 메뉴가 들어오면 저녁 방향을 잡아줘요.";
  elements.analysisTags.innerHTML = "";
  elements.recommendations.innerHTML = "";
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
  state.analysis = null;
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
    state.analysis = analyzeMeal(meal);
    setStatus(`${SCHOOL.name} ${row.MMEAL_SC_NM} ${meal.items.length}개 메뉴`);
    renderMeal(meal);
    renderAnalysis(state.analysis);
  } catch (error) {
    setStatus("급식 정보를 불러오지 못했어요.", true);
  } finally {
    elements.loadButton.disabled = false;
    updateQuota();
    if (window.lucide) window.lucide.createIcons();
  }
}

function recommendationRank(item, analysis) {
  let score = item.prefs.includes(state.preference) ? 16 : 0;
  if (state.preference === "balanced" && item.prefs.includes("balanced")) score += 6;
  if (analysis.flags.fried || analysis.flags.sweet || Number.parseFloat(state.meal.calories) >= 700) {
    if (item.prefs.includes("light") || item.prefs.includes("veggie")) score += 10;
  }
  if (analysis.flags.chicken && item.avoids.includes("chicken")) score -= 24;
  if (analysis.flags.pork && item.avoids.includes("pork")) score -= 24;
  if (analysis.flags.beef && item.avoids.includes("beef")) score -= 24;
  if (analysis.flags.seafood && item.avoids.includes("seafood")) score -= 18;
  return score + item.title.length / 100;
}

function buildRecommendations() {
  if (!state.meal || !state.analysis) return [];
  return [...dinnerPool]
    .sort((a, b) => recommendationRank(b, state.analysis) - recommendationRank(a, state.analysis))
    .slice(0, 3);
}

function renderRecommendations(items) {
  elements.recommendations.innerHTML = items
    .map(
      (item) => `
        <article class="recommendation">
          <h3>${item.title}</h3>
          <p>${item.reason}</p>
          <div class="mini-tags">
            ${item.tags.map((tag) => `<span>${tag}</span>`).join("")}
          </div>
        </article>
      `,
    )
    .join("");
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
