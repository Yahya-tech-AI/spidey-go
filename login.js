"use strict";

const form = document.querySelector("#authForm");
const loginMode = document.querySelector("#loginMode");
const registerMode = document.querySelector("#registerMode");
const nameInput = document.querySelector("#displayName");
const nameLabel = document.querySelector("#nameLabel");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const title = document.querySelector("#formTitle");
const subtitle = document.querySelector("#formSubtitle");
const status = document.querySelector("#authStatus");
const submitButton = document.querySelector("#submitButton");

let mode = "login";

function setMode(nextMode) {
  mode = nextMode;
  const registering = mode === "register";

  loginMode.classList.toggle("active", !registering);
  registerMode.classList.toggle("active", registering);

  nameInput.hidden = !registering;
  nameLabel.hidden = !registering;
  nameInput.required = registering;

  passwordInput.autocomplete = registering
    ? "new-password"
    : "current-password";

  title.textContent = registering ? "Join the system." : "Welcome back.";
  subtitle.textContent = registering
    ? "Create an account for your AI sidekick and saved chats."
    : "Sign in to access your AI sidekick and saved conversations.";

  submitButton.innerHTML = registering
    ? "Create account <span>↗</span>"
    : "Sign in securely <span>↗</span>";

  status.textContent = "";
}

loginMode.addEventListener("click", () => setMode("login"));
registerMode.addEventListener("click", () => setMode("register"));

async function checkExistingSession() {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "same-origin",
    });

    if (response.ok) {
      window.location.replace("./index.html");
    }
  } catch {
    // The user can still use the form if the session check fails.
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "";
  submitButton.disabled = true;

  const payload = {
    email: emailInput.value.trim().toLowerCase(),
    password: passwordInput.value,
  };

  if (mode === "register") {
    payload.displayName = nameInput.value.trim();
  }

  try {
    const response = await fetch(
      mode === "register"
        ? "/api/auth/register"
        : "/api/auth/login",
      {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Authentication failed.");
    }

    window.location.replace("./index.html");
  } catch (error) {
    status.textContent =
      error.message || "Could not reach the authentication server.";
  } finally {
    submitButton.disabled = false;
  }
});
function initializeSplashScreen() {
  const splash = document.getElementById("splash-screen");
  const status = document.getElementById("splash-status");

  if (!splash) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (status) {
    status.textContent = "SYSTEMS ONLINE";
  }

  window.setTimeout(
    () => {
      splash.classList.add("splash-hidden");

      window.setTimeout(
        () => {
          splash.remove();
        },
        reducedMotion ? 0 : 750,
      );
    },
    reducedMotion ? 250 : 2200,
  );
}
initializeSplashScreen();
checkExistingSession();