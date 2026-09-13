# 📚 책장 (BOOKSHELF) 서비스 기획서

## 1. 서비스 목적

읽고 싶은 책을 잊지 않고 관리하고, 읽은 뒤의 생각을 기록하며, 다음에 읽을 책을 고르기 어려울 때 AI의 도움을 받을 수 있는 개인 독서 웹서비스를 만든다.

## 2. 타겟 사용자

책을 꾸준히 읽고 싶지만 독서 목록과 감상을 체계적으로 관리하기 어려운 사람, 그리고 자신의 현재 상황이나 관심사에 맞는 다음 책을 추천받고 싶은 사람을 대상으로 한다.

## 3. 페이지/섹션 구성

### 01 나의 책
- 책 제목 추가
- 읽고 싶은 책 / 읽는 중 / 읽은 책 상태 관리
- 책 삭제
- 브라우저 `localStorage` 저장

### 02 AI 책 추천
- 현재 기분, 관심 분야, 원하는 책의 느낌 등을 자유롭게 입력
- Gemini API가 실제 출간 도서 한 권 추천
- 책 제목, 저자, 추천 이유를 카드 형태로 출력

### 03 독서 기록
- 책 제목
- 별점
- 한줄평
- 기억하고 싶은 문장
- 나에게 남은 것
- 기록 저장 및 삭제
- 브라우저 `localStorage` 저장

## 4. 핵심 기능

1. 책 추가 및 중복 입력 방지
2. 독서 상태 변경 및 삭제
3. 독서 기록 저장 및 삭제
4. Gemini API를 활용한 개인 맞춤 책 추천
5. localStorage를 이용한 데이터 유지
6. 모바일 반응형 화면

## 5. AI 기능 설계

### 입력
사용자가 현재 기분, 관심 분야, 원하는 책의 분위기 등 책 추천에 필요한 조건을 자유롭게 입력한다.

예시:
> 요즘 진로를 고민하고 있어요. 너무 무겁지 않으면서 생각할 거리를 주는 한국 소설을 읽고 싶어요.

### 처리
JavaScript가 `fetch('/api/recommend')`로 입력값을 Python Vercel Serverless Function에 전달한다. 서버리스 함수는 환경변수의 `GEMINI_API_KEY`를 이용해 Gemini API를 호출한다.

### 출력
AI는 다음 구조의 JSON을 반환한다.

```json
{
  "title": "책 제목",
  "author": "저자",
  "reason": "추천 이유"
}
```

프론트엔드는 이 값을 추천 카드로 표시한다.

## 6. AI 실패 처리

- **빈 입력**: “추천받을 조건을 입력해주세요.”
- **응답 대기**: “책을 찾고 있어요. 잠시만 기다려주세요.”를 표시하고 버튼을 비활성화
- **HTTP/API 오류**: “추천을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.”
- 서버에서는 잘못된 요청은 400, API/서버 오류는 500 상태 코드로 반환한다.

## 7. 기술 구조

```text
사용자
  ↓
HTML / CSS / JavaScript
  ↓ fetch('/api/recommend')
Vercel Serverless Function (Python)
  ↓
Gemini API
  ↓ JSON
JavaScript
  ↓
추천 결과 화면 출력
```

API Key는 프론트엔드 코드에 넣지 않고 서버의 환경변수로 관리한다.

## 8. 기술 스택

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Python, Vercel Serverless Functions
- AI: Google Gemini API (`google-genai`)
- Storage: browser localStorage
- Version Control: Git / GitHub
- Deployment: Vercel

## 9. 프로젝트 구조

```text
bookshelf/
├── api/recommend.py
├── css/style.css
├── images/
├── js/app.js
├── index.html
├── requirements.txt
├── README.md
└── .gitignore
```
