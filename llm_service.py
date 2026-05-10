import os
import requests

from dotenv import load_dotenv

load_dotenv()


class LLMService:

    def __init__(self):

        self.api_key = os.getenv("CEREBRAS_API_KEY")

        self.base_url = os.getenv(
            "CEREBRAS_BASE_URL",
            "https://api.cerebras.ai/v1"
        )

        self.model = os.getenv(
            "CEREBRAS_MODEL",
            "llama-3.3-70b"
        )

    # ━━━━━━━━━━━━━━━━━━━━━━━━
    # CHAT COMPLETION
    # ━━━━━━━━━━━━━━━━━━━━━━━━
    def chat(
        self,
        messages,
        tools=None,
        tool_choice="auto"
    ):

        body = {

            "model": self.model,

            "messages": messages,

            "temperature": 0.3,

            "max_completion_tokens": 2000,

            "stream": False
        }

        # Tool calling support
        if tools:
            body["tools"] = tools
            body["tool_choice"] = tool_choice

        response = requests.post(

            f"{self.base_url}/chat/completions",

            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },

            json=body,

            timeout=30
        )

        if response.status_code != 200:
            raise Exception(
                f"API Error: {response.status_code} {response.text[:200]}"
            )

        data = response.json()

        return data["choices"][0]["message"]


# Singleton
llm_service = LLMService()