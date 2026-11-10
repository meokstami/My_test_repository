import os

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, session
from openai import OpenAI

load_dotenv(r"C:\env\.env")

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "web-chatbot-local-secret")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = {
    "role": "system",
    "content": "You are a helpful assistant. Reply in the same language the user writes in.",
}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    user_message = str(data.get("message", "")).strip()
    if not user_message:
        return jsonify({"error": "메시지를 입력해 주세요."}), 400

    if not os.getenv("OPENAI_API_KEY"):
        return jsonify({"error": "OPENAI_API_KEY를 찾을 수 없습니다."}), 500

    history = session.get("history", [])
    history.append({"role": "user", "content": user_message})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[SYSTEM_PROMPT, *history],
        )
        bot_message = response.choices[0].message.content or ""
        history.append({"role": "assistant", "content": bot_message})
        session["history"] = history[-20:]
        session.modified = True
        return jsonify({"reply": bot_message})
    except Exception as exc:
        history.pop()
        session["history"] = history
        session.modified = True
        return jsonify({"error": f"응답을 가져오지 못했습니다. {exc}"}), 500


if __name__ == "__main__":
    app.run(debug=True)
