let persona = "🧠 Detecting your profile";
let chatHistory = JSON.parse(sessionStorage.getItem("et_concierge_history")) || [];

const chatArea = document.getElementById("chatArea");
const input = document.getElementById("userInput");
const personaPill = document.getElementById("personaPill");
const languageSelect = document.getElementById("language");

const uiText = {
  English: {
    getStarted: "Get Started",
    startJourney: "Start Your Journey",
    explore: "Explore Services",
    heroSubtitle: "Discover personalized financial insights, premium content, and exclusive services tailored to your goals.",
    servicesTitle: "Explore ET Services",
    chatTitle: "AI Concierge Assistant",
    reset: "Reset Chat",
    inputPlaceholder: "Ask about ET services, finance, goals, or your next step...",
    welcome: `Welcome to **ET Concierge** 👋

To guide you properly, are you joining as a **Student**, **Professional**, or **Entrepreneur**?`
  },
  Hindi: {
    getStarted: "शुरू करें",
    startJourney: "अपनी यात्रा शुरू करें",
    explore: "सेवाएँ देखें",
    heroSubtitle: "अपने लक्ष्यों के अनुसार व्यक्तिगत वित्तीय जानकारी, प्रीमियम कंटेंट और विशेष सेवाएँ खोजें।",
    servicesTitle: "ET सेवाएँ देखें",
    chatTitle: "AI Concierge सहायक",
    reset: "चैट रीसेट करें",
    inputPlaceholder: "ET सेवाओं, वित्त, लक्ष्यों या अगले कदम के बारे में पूछें...",
    welcome: `**ET Concierge** में आपका स्वागत है 👋

आपको सही मार्गदर्शन देने के लिए, क्या आप **Student**, **Professional**, या **Entrepreneur** के रूप में आए हैं?`
  }
};

function applyTheme() {
  const saved = localStorage.getItem("et_theme");
  if (saved === "dark") document.body.classList.add("dark");
}

function toggleDark() {
  document.body.classList.toggle("dark");
  localStorage.setItem("et_theme", document.body.classList.contains("dark") ? "dark" : "light");
}

function applyLanguageUI() {
  const lang = languageSelect.value;
  const t = uiText[lang];

  document.getElementById("getStartedBtn").textContent = t.getStarted;
  document.getElementById("startJourneyBtn").textContent = t.startJourney;
  document.getElementById("exploreBtn").textContent = t.explore;
  document.getElementById("heroSubtitle").textContent = t.heroSubtitle;
  document.getElementById("servicesTitle").textContent = t.servicesTitle;
  document.getElementById("chatTitle").textContent = t.chatTitle;
  document.getElementById("resetBtn").textContent = t.reset;
  document.getElementById("userInput").placeholder = t.inputPlaceholder;

  localStorage.setItem("et_lang", lang);
}

function restoreLanguage() {
  const savedLang = localStorage.getItem("et_lang");
  if (savedLang) languageSelect.value = savedLang;
  applyLanguageUI();
}

function openChat() {
  document.getElementById("chatSection").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => input.focus(), 500);

  if (!chatHistory.length && chatArea.innerHTML.trim() === "") {
    addBotMessage(uiText[languageSelect.value].welcome);
  }
}

function detectPersona(text) {
  const t = text.toLowerCase();
  if (t.includes("student") || t.includes("स्टूडेंट")) return "student";
  if (t.includes("job") || t.includes("salary") || t.includes("working") || t.includes("professional") || t.includes("नौकरी")) return "professional";
  if (t.includes("business") || t.includes("startup") || t.includes("entrepreneur") || t.includes("founder") || t.includes("बिज़नेस")) return "entrepreneur";
  return "default";
}

function updatePersona(text) {
  const type = detectPersona(text);

  if (type === "student") persona = "👨‍🎓 Student";
  else if (type === "professional") persona = "💼 Professional";
  else if (type === "entrepreneur") persona = "🚀 Entrepreneur";
  else persona = "🧠 Detecting your profile";

  personaPill.textContent = persona;
  return type;
}

function addMessage(text, sender = "bot", save = true) {
  const wrap = document.createElement("div");
  wrap.className = `message-wrap ${sender}`;

  const label = document.createElement("div");
  label.className = "mini-label";
  label.textContent = sender === "user" ? "You" : "ET Concierge";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = marked.parse(text);

  wrap.appendChild(label);
  wrap.appendChild(bubble);
  chatArea.appendChild(wrap);
  chatArea.scrollTop = chatArea.scrollHeight;

  if (save) {
    chatHistory.push({ role: sender, text });
    sessionStorage.setItem("et_concierge_history", JSON.stringify(chatHistory));
  }

  return wrap;
}

function addBotMessage(text) {
  updatePersona(text);
  return addMessage(text, "bot");
}

function showSavedHistory() {
  if (!chatHistory.length) return;
  chatArea.innerHTML = "";
  chatHistory.forEach(msg => {
    addMessage(msg.text, msg.role, false);
  });
}

function resetChat() {
  chatHistory = [];
  sessionStorage.removeItem("et_concierge_history");
  chatArea.innerHTML = "";
  persona = "🧠 Detecting your profile";
  personaPill.textContent = persona;
  addBotMessage(uiText[languageSelect.value].welcome);
}

async function sendMessage(customText = null) {
  const text = customText || input.value.trim();
  if (!text) return;

  updatePersona(text);
  addMessage(text, "user");
  input.value = "";

  const typingWrap = document.createElement("div");
  typingWrap.className = "message-wrap bot";
  typingWrap.innerHTML = `
    <div class="mini-label">ET Concierge</div>
    <div class="bubble typing">Analyzing your profile and goals...</div>
  `;
  chatArea.appendChild(typingWrap);
  chatArea.scrollTop = chatArea.scrollHeight;

  const lang = languageSelect.value;

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        language: lang,
        history: chatHistory
      })
    });

    const data = await response.json();
    typingWrap.remove();

    if (data.reply) {
      addBotMessage(data.reply);
    } else {
      addBotMessage("⚠️ Sorry, I could not generate a response.");
    }

  } catch (error) {
    typingWrap.remove();
    console.error("Frontend Error:", error);
    addBotMessage("⚠️ Unable to connect to backend server. Please make sure your backend is running.");
  }
}

document.getElementById("themeBtn").addEventListener("click", toggleDark);
document.getElementById("language").addEventListener("change", () => {
  applyLanguageUI();
  resetChat();
});
document.getElementById("getStartedBtn").addEventListener("click", openChat);
document.getElementById("startJourneyBtn").addEventListener("click", openChat);
document.getElementById("exploreBtn").addEventListener("click", () => {
  document.getElementById("services").scrollIntoView({ behavior: "smooth" });
});
document.getElementById("resetBtn").addEventListener("click", resetChat);
document.getElementById("sendBtn").addEventListener("click", () => sendMessage());
input.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

document.querySelectorAll(".quick-chip").forEach(chip => {
  chip.addEventListener("click", () => sendMessage(chip.textContent));
});

document.querySelectorAll(".service-card").forEach(card => {
  card.addEventListener("click", () => sendMessage(card.dataset.prompt));
});

applyTheme();
restoreLanguage();
showSavedHistory();
if (!chatHistory.length) {
  addBotMessage(uiText[languageSelect.value].welcome);
}