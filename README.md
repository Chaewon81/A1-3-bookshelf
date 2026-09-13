# 📚 책장 (BOOKSHELF)

읽고 싶은 책을 관리하고, 독서 기록을 남기며, 현재의 기분과 관심사에 맞는 책을 AI에게 추천받는 개인 독서 웹서비스입니다.

## 주요 기능

- **나의 책**: 책 추가, 읽기 상태(읽고 싶은 책 / 읽는 중 / 읽은 책) 변경, 삭제
- **AI 책 추천**: 자유로운 사용자 입력을 Gemini API에 전달해 실제 출간 도서 한 권과 추천 이유 출력
- **독서 기록**: 별점, 한줄평, 기억하고 싶은 문장, 나에게 남은 것을 저장·삭제
- **로컬 저장**: 책과 독서 기록은 브라우저 `localStorage`에 저장
- **반응형 UI**: 데스크톱과 모바일 화면 대응
- **실패 처리**: 빈 입력, 로딩 상태, HTTP/API 오류 메시지 처리

## 기술 스택

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Web Storage API (`localStorage`)

### Backend / AI
- Python
- Vercel Serverless Functions (`api/recommend.py`)
- Google Gemini API (`google-genai`)

### Deployment
- GitHub
- Vercel

## 프로젝트 구조

```text
bookshelf/
├── api/
│   └── recommend.py
├── css/
│   └── style.css
├── images/
├── js/
│   └── app.js
├── index.html
├── requirements.txt
├── concept.MD
├── README.md
└── .gitignore
```

## 동작 흐름

```text
사용자 입력
   ↓
JavaScript fetch('/api/recommend')
   ↓
Vercel Python Serverless Function
   ↓
Gemini API
   ↓
JSON { title, author, reason }
   ↓
JavaScript가 추천 카드로 화면에 출력
```

API Key를 브라우저 JavaScript에 넣지 않고 Python 서버리스 함수에서 환경변수로 읽도록 구성했습니다.

## 로컬 실행

### 1. 저장소 준비

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <PROJECT_FOLDER>
```

### 2. Python 의존성 설치

```bash
pip install -r requirements.txt
```

### 3. 환경변수 설정

프로젝트 루트에 `.env` 파일을 만들고 다음 값을 설정합니다.

```text
GEMINI_API_KEY=your_api_key_here
```

> `.env`, `.env.local`은 `.gitignore`에 포함되어 있으며 GitHub에 업로드하지 않습니다. 실제 API Key는 README나 스크린샷에도 노출하지 않습니다.

### 4. Vercel CLI로 로컬 실행

```bash
vercel dev
```

터미널에 표시되는 로컬 주소(기본 `http://localhost:3000`)에서 확인합니다. Live Server는 정적 프론트엔드만 실행하므로 Python `/api` 테스트에는 `vercel dev`를 사용합니다.

## Vercel 배포

1. Vercel 프로젝트에 GitHub 저장소를 연결하거나 Vercel CLI로 프로젝트를 배포합니다.
2. Vercel Project Settings의 Environment Variables에 `GEMINI_API_KEY`를 등록합니다.
3. Production 배포 후 데스크톱/모바일 화면과 AI 추천 기능을 다시 테스트합니다.

### 배포 URL

`<VERCEL_PRODUCTION_URL>`

> 최종 제출 전에 실제 Production URL로 위 값을 교체합니다.

## AI 입력 / 출력 / 실패 처리

**입력**: 사용자가 현재 기분, 관심 분야, 원하는 책의 분위기 등을 자유롭게 작성합니다.

**출력**: Gemini가 실제 출간 도서 한 권을 `title`, `author`, `reason` JSON 형식으로 반환하고 프론트엔드가 카드 형태로 표시합니다.

**실패 처리**:
- 빈 입력 → 입력 안내 메시지
- 요청 중 → 로딩 메시지 + 추천 버튼 비활성화
- HTTP/API 오류 → “추천을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.” 표시

## Troubleshooting / 개발 중 해결한 문제

### Live Server와 Python API
Live Server에서는 정적 HTML/CSS/JS는 확인할 수 있지만 Vercel Python Serverless Function은 실행되지 않았습니다. 전체 기능 테스트는 `vercel dev`로 전환했습니다.

### Gemini 503 High Demand
개발 중 `gemini-3.7-flash` 호출에서 `503 UNAVAILABLE` / high demand 오류를 경험했습니다. 외부 AI API는 일시적인 과부하나 가용성 문제가 생길 수 있음을 확인했고, 사용자에게 재시도 메시지를 제공하도록 오류 처리를 추가했습니다. 개발 과정에서는 더 가벼운 모델로 변경해 테스트를 이어갔습니다.

### Vercel Python 의존성 / uv 환경
새 PC에서 Vercel Python builder가 사용하는 의존성과 `uv`/PATH 문제를 확인하고 환경을 정리해 `vercel dev` 실행을 복구했습니다. Python 패키지는 `requirements.txt`로 명시해 재현 가능하도록 했습니다.

## 데이터 저장 범위

책 목록과 독서 기록은 `localStorage`를 사용하므로 현재 브라우저/기기에 저장됩니다. 로그인이나 클라우드 동기화는 현재 버전에 포함하지 않았습니다.

## 향후 개선

- 도서 검색 API와 표지/저자 정보 연동
- 사용자 계정 및 클라우드 저장
- 독서 통계와 월별 리포트
- AI 추천 결과를 바로 ‘읽고 싶은 책’에 추가하는 기능
