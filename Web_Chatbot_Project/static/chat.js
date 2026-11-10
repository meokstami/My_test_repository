const chatWindow = document.getElementById("chat-window");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

let lastRole = null;

function formatTime(date) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours < 12 ? "오전" : "오후";
  const hour12 = hours % 12 || 12;
  return `${period} ${hour12}:${minutes}`;
}

function appendDateDivider() {
  const chip = document.createElement("div");
  chip.className = "date-chip";
  chip.textContent = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
  chatWindow.appendChild(chip);
}

function appendMessage(role, text) {
  const continued = lastRole === role;
  lastRole = role;
  const time = formatTime(new Date());

  const row = document.createElement("div");
  row.className = `row ${role}${continued ? " continued" : ""}`;

  const bubble = document.createElement("div");
  bubble.className = `bubble ${role}`;
  bubble.textContent = text;

  const meta = document.createElement("div");
  meta.className = "meta";

  const clock = document.createElement("time");
  clock.textContent = time;

  if (role === "user") {
    const who = document.createElement("span");
    who.textContent = "You:";
    meta.append(who);
  }
  meta.append(clock);

  const line = document.createElement("div");
  line.className = "line";

  if (role === "user") {
    line.append(meta, bubble);
    row.append(line);
  } else {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.2" fill="currentColor"/><path d="M5.5 18.5c1.3-2.8 3.6-4.2 6.5-4.2s5.2 1.4 6.5 4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = "Bot:";

    line.append(bubble, meta);

    const stack = document.createElement("div");
    stack.className = "stack";
    stack.append(name, line);
    row.append(avatar, stack);
  }

  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function updateSendState() {
  sendButton.classList.toggle("ready", messageInput.value.trim().length > 0);
}

appendDateDivider();
messageInput.addEventListener("input", updateSendState);

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = messageInput.value.trim();
  if (!message) {
    return;
  }

  appendMessage("user", message);
  messageInput.value = "";
  updateSendState();
  messageInput.focus();
  sendButton.disabled = true;

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await response.json();

    if (!response.ok) {
      appendMessage("bot", data.error || "오류가 발생했습니다.");
      return;
    }

    appendMessage("bot", data.reply);
  } catch (error) {
    appendMessage("bot", "서버와 통신하지 못했습니다.");
  } finally {
    sendButton.disabled = false;
    updateSendState();
    messageInput.focus();
  }
});
