import json
import os
from http.server import BaseHTTPRequestHandler

from dotenv import load_dotenv
from google import genai

load_dotenv()


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body or b"{}")
            user_input = str(data.get("input", "")).strip()

            if not user_input:
                self.send_json_response(400, {"message": "추천받을 조건을 입력해주세요."})
                return

            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                self.send_json_response(500, {"message": "AI 서비스 설정을 확인해주세요."})
                return

            client = genai.Client(api_key=api_key)
            prompt = f"""
사용자의 현재 상황과 관심사에 가장 잘 어울리는 실제 출간 도서 한 권을 추천해주세요.

사용자 입력:
{user_input}

반드시 JSON 객체 하나만 답변하세요.
{{
  "title": "책 제목",
  "author": "저자 이름",
  "reason": "추천 이유 3~4문장"
}}

규칙:
- 한 권만 추천합니다.
- 실제 출간된 책만 추천합니다.
- JSON 이외의 인사말, 마크다운, 코드블록은 작성하지 않습니다.
"""
            response = client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt
            )
            ai_text = (response.text or "").strip()
            if ai_text.startswith("```"):
                ai_text = ai_text.replace("```json", "", 1).replace("```", "").strip()
            ai_data = json.loads(ai_text)

            self.send_json_response(200, {
                "title": str(ai_data.get("title", "")).strip(),
                "author": str(ai_data.get("author", "")).strip(),
                "reason": str(ai_data.get("reason", "")).strip()
            })

        except json.JSONDecodeError:
            self.send_json_response(400, {"message": "요청 또는 AI 응답의 JSON 형식을 처리하지 못했습니다."})
        except Exception as error:
            print("API 오류:", type(error).__name__, repr(error))
            self.send_json_response(500, {"message": "추천을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."})

    def send_json_response(self, status_code, response_data):
        response_json = json.dumps(response_data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_json)))
        self.end_headers()
        self.wfile.write(response_json)
