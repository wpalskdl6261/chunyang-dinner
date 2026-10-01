# 제미나이 추천 서버 설정 (Cloudflare Workers)

API 키를 앱(`app.js`)에 넣으면 누구나 볼 수 있어서, 키는 이 서버에만 넣어요.
모두 웹 화면에서 할 수 있고 무료 요금제로 충분해요.

## 어떻게 동작하나요

| 경로 | 하는 일 | 제미나이 호출 |
| --- | --- | --- |
| `GET /daily?date=YYYY-MM-DD` | 그날 점심에 맞춘 취향 8가지 추천(각 6개) + 지은쌤의 한마디 | **날짜당 1번** (KV에 저장 후 재사용) |
| `POST /custom` | 학생이 직접 쓴 내용으로 추천 | 입력마다 1번, 같은 날 같은 입력은 재사용, 학교 전체 하루 150번까지 |
| cron (평일 06:00) | 그날 추천을 미리 만들어 둠 | 하루 1번 |

## 1. 제미나이 API 키 만들기

1. <https://aistudio.google.com/apikey> 에서 **Create API key**
2. 키는 다음 단계에서 Cloudflare에만 붙여 넣어요 (채팅·코드에 붙여 넣지 마세요)

## 2. Worker 만들기

1. <https://dash.cloudflare.com> 가입·로그인
2. **Workers & Pages → Create → Create Worker**
3. 이름을 `chunyang-dinner` 로 정하고 **Deploy**
4. **Edit code** 를 눌러 기본 코드를 모두 지우고 `worker/worker.js` 내용을 붙여 넣은 뒤 **Deploy**

## 3. 저장소(KV) 연결

1. **Storage & Databases → KV → Create** 에서 이름 `chunyang-dinner-cache` 로 만들기
2. Worker 화면 **Settings → Bindings → Add → KV namespace**
   - Variable name: `CACHE`  (꼭 이 이름)
   - KV namespace: `chunyang-dinner-cache`

## 4. API 키 넣기

Worker 화면 **Settings → Variables and Secrets → Add**

- Type: **Secret**
- Name: `GEMINI_API_KEY`
- Value: 1단계에서 만든 키

선택 설정 (Type: Text)

- `GEMINI_MODEL` — 기본값 `gemini-3.5-flash-lite`
- `CUSTOM_DAILY_LIMIT` — 직접 입력 학교 전체 하루 한도, 기본값 `150`
- `ALLOWED_ORIGINS` — 앱 주소가 바뀌면 쉼표로 구분해 적기

## 5. 아침 미리 만들기 (cron)

Worker 화면 **Settings → Trigger Events → Add → Cron Triggers**

- `0 21 * * SUN-THU`  (UTC 기준 → 한국 시간 월~금 오전 6시)

## 6. 앱에 주소 넣기

Worker 주소(예: `https://chunyang-dinner.<계정이름>.workers.dev`)를
`app.js` 맨 위 `AI_ENDPOINT` 에 넣고 GitHub에 올리면 끝이에요.

확인: 브라우저에서 `<Worker 주소>/daily` 를 열었을 때 `prefs` 가 보이면 성공이에요.
