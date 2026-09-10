import os
import json

from dotenv import load_dotenv
from google import genai
from http.server import BaseHTTPRequestHandler


load_dotenv()



class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # ① 요청 본문의 길이 확인
            content_length = int(self.headers.get("Content-Length", 0))

            # ② 요청 본문 읽기
            body = self.rfile.read(content_length)

            # ③ JSON 문자열을 Python 데이터로 변환
            data = json.loads(body)

            # ④ 프론트엔드에서 보낸 input 값 가져오기
            user_input = data.get("input", "").strip()

            # 입력값이 없는 경우
            if user_input == "":
                response_data = {
                    "message": "추천받을 조건을 입력해주세요."
                }
                self.send_json_response(400, response_data)
                return

            # ⑤ 환경변수에서 Gemini API Key 가져오기
            api_key = os.getenv("GEMINI_API_KEY")

            print("GEMINI_API_KEY 확인:", bool(api_key))

            if not api_key:
                response_data = {
                    "message": "GEMINI_API_KEY가 설정되지 않았습니다."
                }
                self.send_json_response(500, response_data)
                return

            # ⑥ Gemini와 통신할 client 생성
            client = genai.Client(api_key=api_key)

            # ⑦ Gemini에게 전달할 프롬프트 작성
            prompt = f"""
            사용자의 현재 상황과 관심사에 가장 잘 어울리는 책 한 권을 추천해주세요.

            사용자 입력:
            {user_input}

            반드시 아래 형식으로만 답변해주세요.

            형식:
            {{
                "title": "책 제목",
                "author": "저자 이름",
                "reason": "추천 이유"
            }}

            규칙:
            - 책은 반드시 한 권만 추천해주세요.
            - 실제 출간된 책만 추천해주세요.
            - 전체 답변은 간결하게 작성해주세요.
            - 마크다운 기호(**, #, ---, *)는 사용하지 마세요.
            - 이모지는 사용하지 마세요.
            - 위 형식 외의 인사말이나 추가 설명은 작성하지 마세요.
            """

            # ⑧ Gemini API 호출
            response = client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt
            )

            # Gemini가 생성한 텍스트 가져오기
            ai_text = response.text
            
            ai_data = json.loads(ai_text)

            # ⑨ 프론트엔드로 보낼 JSON 데이터
            response_data = {
                "title": ai_data["title"],
                "author": ai_data["author"],
                "reason": ai_data["reason"]
            }

            self.send_json_response(200, response_data)

        except json.JSONDecodeError:
            response_data = {
                "message": "잘못된 JSON 형식입니다."
            }
            self.send_json_response(400, response_data)

        except Exception as error:
            print("API 오류 종류:", type(error).__name__)
            print("API 오류 내용:", repr(error))

            response_data = {
                "message": "서버에서 오류가 발생했습니다."
            }
            self.send_json_response(500, response_data)

            response_data = {
                "message": "서버에서 오류가 발생했습니다."
            }
            self.send_json_response(500, response_data)

    def send_json_response(self, status_code, response_data):
        # Python 데이터를 JSON 바이트 데이터로 변환
        response_json = json.dumps(
            response_data,
            ensure_ascii=False
        ).encode("utf-8")

        # HTTP 상태 코드 전달
        self.send_response(status_code)

        # 응답 형식이 JSON이라는 것을 전달
        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )

        # 응답 데이터 크기 전달
        self.send_header(
            "Content-Length",
            str(len(response_json))
        )

        self.end_headers()

        # 실제 JSON 응답 전송
        self.wfile.write(response_json)