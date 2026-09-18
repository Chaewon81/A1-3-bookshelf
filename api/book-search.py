import json
import os
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlencode, urlparse, parse_qs
from urllib.request import urlopen

from dotenv import load_dotenv

load_dotenv()


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        title = params.get("title", [""])[0].strip()
        author = params.get("author", [""])[0].strip()
        api_key = os.getenv("GOOGLE_BOOKS_API_KEY")

        if not title or not author:
            self.send_json(400, {"message": "책 제목과 작가가 필요합니다."})
            return
        if not api_key:
            self.send_json(500, {"message": "Google Books API 키가 설정되지 않았습니다."})
            return

        try:
            query = urlencode({
                "q": f"intitle:{title} inauthor:{author}",
                "maxResults": 1,
                "printType": "books",
                "key": api_key,
            })
            with urlopen(f"https://www.googleapis.com/books/v1/volumes?{query}", timeout=8) as response:
                data = json.loads(response.read().decode("utf-8"))

            item = (data.get("items") or [{}])[0]
            info = item.get("volumeInfo") or {}
            image_links = info.get("imageLinks") or {}
            cover_url = image_links.get("thumbnail") or image_links.get("smallThumbnail") or ""
            identifiers = info.get("industryIdentifiers") or []
            isbn = next((item.get("identifier", "") for item in identifiers if item.get("type") in ("ISBN_13", "ISBN_10")), "")

            self.send_json(200, {
                "coverUrl": cover_url.replace("http:", "https:", 1),
                "isbn": isbn,
            })
        except Exception as error:
            print("Book search error:", type(error).__name__)
            self.send_json(502, {"message": "표지 검색에 실패했습니다."})

    def send_json(self, status_code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
