/* =====================================================
   SPIDEY-GO | SYSTEM CORE
   By Yahya-tech-AI
   Frontend interactions + AI chat
===================================================== */

"use strict";

/* ---------- 1. INITIALIZATION ---------- */

document.addEventListener("DOMContentLoaded", () => {
  initializeSplashScreen();
  initializeScrollProgress();
  initializeAIChat();
  initializeFooterYear();
  initializeNavigation();
});


/* ---------- 2. CINEMATIC SPLASH SCREEN ---------- */

function initializeSplashScreen() {
  const splash = document.getElementById("splash-screen");
  const status = document.getElementById("splash-status");

  if (!splash) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (status) {
    status.textContent = "SYSTEMS ONLINE";
  }

  window.setTimeout(() => {
    splash.classList.add("splash-hidden");

    window.setTimeout(() => {
      splash.remove();
    }, reducedMotion ? 0 : 750);
  }, reducedMotion ? 250 : 2200);
}


/* ---------- 3. SCROLL PROGRESSION ---------- */

function initializeScrollProgress() {
  const progressBar = document.getElementById("scroll-progress-bar");

  if (!progressBar) return;

  let scheduled = false;

  function updateProgress() {
    const root = document.documentElement;

    const scrollableHeight =
      root.scrollHeight - window.innerHeight;

    const progress = scrollableHeight > 0
      ? (window.scrollY / scrollableHeight) * 100
      : 0;

    progressBar.style.width =
      `${Math.min(100, Math.max(0, progress))}%`;

    scheduled = false;
  }

  function requestUpdate() {
    if (scheduled) return;

    scheduled = true;
    window.requestAnimationFrame(updateProgress);
  }

  window.addEventListener("scroll", requestUpdate, {
    passive: true
  });

  window.addEventListener("resize", requestUpdate);

  window.addEventListener("load", requestUpdate);

  updateProgress();
}


/* ---------- 4. AI CHAT ---------- */

function initializeAIChat() {
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const messages = document.getElementById("chatMessages");
  const sendButton = document.getElementById("sendButton");
  const suggestionButtons = document.querySelectorAll("[data-prompt]");

  if (!form || !input || !messages || !sendButton) return;

  let isSending = false;
  let activeController = null;

  /* Create chat messages safely using textContent. */
  function addMessage(text, sender) {
    const row = document.createElement("div");
    row.className = sender === "user"
      ? "message user-message"
      : "message assistant-message";

    const avatar = document.createElement("span");
    avatar.className = "message-avatar";
    avatar.textContent = sender === "user" ? "Y" : "S";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = text;

    row.append(avatar, bubble);
    messages.appendChild(row);

    messages.scrollTop = messages.scrollHeight;

    return row;
  }

  function setSending(sending) {
    isSending = sending;
    sendButton.disabled = sending;
    input.disabled = sending;

    sendButton.setAttribute(
      "aria-label",
      sending ? "Waiting for AI response" : "Send message"
    );

    sendButton.innerHTML = sending ? "<span>…</span>" : "<span>➤</span>";
  }

  async function sendMessage(message) {
    const cleanMessage = message.trim();

    if (!cleanMessage || isSending) return;

    if (cleanMessage.length > 2000) {
      addMessage(
        "That message is too long. Please keep it under 2,000 characters.",
        "assistant"
      );
      return;
    }

    addMessage(cleanMessage, "user");
    input.value = "";
    setSending(true);

    const waitingMessage = addMessage(
      "Connecting to the AI sidekick...",
      "assistant"
    );

    activeController = new AbortController();

    const timeoutId = window.setTimeout(() => {
      activeController?.abort();
    }, 45000);

    try {
      /*
       * The Flask backend should expose POST /api/chat
       * and return JSON in this shape:
       *
       * { "reply": "Your AI response" }
       *
       * Never put your Gemini API key in this file.
       */

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: cleanMessage
        }),
        signal: activeController.signal
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || `AI server returned HTTP ${response.status}.`
        );
      }

      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("The AI server returned an empty response.");
      }

      waitingMessage.querySelector(".message-bubble").textContent =
        data.reply.trim();

    } catch (error) {
      const bubble = waitingMessage.querySelector(".message-bubble");

      if (error.name === "AbortError") {
        bubble.textContent =
          "The request timed out. Check your connection and try again.";
      } else if (error instanceof TypeError) {
        bubble.textContent =
          "I couldn't reach the AI server. Make sure the backend is running and try again.";
      } else {
        bubble.textContent =
          error.message || "Something went wrong. Please try again.";
      }

      console.error("[SPIDEY-GO AI]", error);

    } finally {
      window.clearTimeout(timeoutId);
      activeController = null;
      setSending(false);
      input.focus();
      messages.scrollTop = messages.scrollHeight;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    await sendMessage(input.value);
  });

  suggestionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const prompt = button.dataset.prompt;

      if (!prompt || isSending) return;

      input.value = prompt;
      input.focus();

      sendMessage(prompt);
    });
  });
}


/* ---------- 5. FOOTER YEAR ---------- */

function initializeFooterYear() {
  const yearElement = document.getElementById("year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}


/* ---------- 6. NAVIGATION ---------- */

function initializeNavigation() {
  const internalLinks = document.querySelectorAll(
    'a[href^="#"]'
  );

  internalLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches ? "auto" : "smooth",
        block: "start"
      });

      if (history.replaceState) {
        history.replaceState(null, "", targetId);
      }
    });
  });
}
