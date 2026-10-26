import json
import os
from http.server import BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-4o-mini"
MAX_BODY_SIZE = 20_000
MAX_MESSAGE_LENGTH = 2_000


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # 1. Read server-side configuration
        api_key = os.environ.get("OPENROUTER_API_KEY")
        model = os.environ.get("OPENROUTER_MODEL", DEFAULT_MODEL).strip()

        if not api_key:
            return self.send_json(500, {
                "error": "AI service is not configured. Please contact the site owner."
            })

        if not model:
            return self.send_json(500, {
                "error": "No AI model is configured."
            })

        # 2. Validate request size
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return self.send_json(400, {
                "error": "Invalid Content-Length header."
            })

        if length <= 0 or length > MAX_BODY_SIZE:
            return self.send_json(400, {
                "error": "Invalid request size."
            })

        # 3. Parse and validate JSON
        try:
            raw_body = self.rfile.read(length)
            data = json.loads(raw_body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return self.send_json(400, {
                "error": "Request body must contain valid JSON."
            })

        if not isinstance(data, dict):
            return self.send_json(400, {
                "error": "Expected a JSON object."
            })

        message = data.get("message")

        if not isinstance(message, str) or not message.strip():
            return self.send_json(400, {
                "error": "Please enter a message."
            })

        message = message.strip()

        if len(message) > MAX_MESSAGE_LENGTH:
            return self.send_json(400, {
                "error": "Message is too long. Maximum 2,000 characters."
            })

        # 4. Prepare the OpenRouter request
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are SPIDEY-GO, a friendly, clever AI sidekick. "
                        "Help with coding, gaming, science, technology, and "
                        "everyday questions. Be clear, useful, and concise. "
                        "Never claim to have performed actions you did not perform."
                    )
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            "max_tokens": 500
        }

        request_data = json.dumps(payload).encode("utf-8")

        request = Request(
            OPENROUTER_URL,
            data=request_data,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-Title": "SPIDEY-GO"
            },
            method="POST"
        )

        # 5. Call OpenRouter
        try:
            with urlopen(request, timeout=35) as response:
                result = json.loads(
                    response.read().decode("utf-8")
                )

        except HTTPError as error:
            # Log the status without exposing secrets to the visitor.
            print(f"SPIDEY-GO: OpenRouter returned HTTP {error.code}")

            if error.code == 429:
                return self.send_json(429, {
                    "error": "AI rate limit reached. Please try again shortly."
                })

            return self.send_json(502, {
                "error": (
                    "The AI provider rejected the request. "
                    "Check your OpenRouter account, model, and API configuration."
                )
            })

        except (URLError, TimeoutError, OSError):
            return self.send_json(502, {
                "error": "Could not connect to the AI service. Please try again."
            })

        except (json.JSONDecodeError, UnicodeDecodeError):
            return self.send_json(502, {
                "error": "The AI provider returned an invalid response."
            })

        # 6. Extract the AI response
        try:
            choices = result["choices"]
            reply = choices[0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            return self.send_json(502, {
                "error": "The AI provider returned an unexpected response."
            })

        if not isinstance(reply, str) or not reply.strip():
            return self.send_json(502, {
                "error": "The AI returned an empty response. Please try again."
            })

        # 7. Return the format expected by script.js
        return self.send_json(200, {
            "reply": reply.strip()
        })

    def do_GET(self):
        return self.send_json(405, {
            "error": "Use POST to send a chat message."
        })

    def send_json(self, status, data):
        body = json.dumps(data).encode("utf-8")

        self.send_response(status)
        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
