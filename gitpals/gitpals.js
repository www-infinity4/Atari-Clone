"use strict";

// ── Pal registry ─────────────────────────────────────────────────────────────
// Each pal knows its name, greeting, GitHub repo, and a set of contextual skills.
// Each pal entry includes a solid `accentColor` so UI elements can use it
// directly without parsing the CSS gradient string.
const PALS = {
  gitpal: {
    name:  "Gitpal",
    emoji: "GP",
    color: "linear-gradient(135deg,#6c47ff,#a78bfa)",
    accentColor: "#6c47ff",
    repo:  "https://github.com/www-infinity4/Gitpal",
    greeting: "👋 Hey! I'm Gitpal — your session companion. I follow your GitHub workflow and surface insights. What are you working on?",
    skills: [
      "Scanning your open PRs… 3 are awaiting review.",
      "Looks like you have a stale branch from 14 days ago. Want me to flag it?",
      "I noticed a trending fork on one of your repos. Check it out?",
      "Tip: add a pinned issue to guide first-time contributors.",
      "I can hand you off to Gitpin to prioritise your issues — want me to route you there?",
      "Your README could use an updated badge. Ask Gitpro to style it.",
      "I'm tracking your session. You've visited 7 repos in the last hour.",
      "Got it! I'll keep an eye on that for you.",
    ],
    handoffs: { pin: "gitpin", pub: "gitpub", pro: "gitpro", flow: "gitflow" },
  },
  gitpub: {
    name:  "Gitpub",
    emoji: "📡",
    color: "linear-gradient(135deg,#0ea5e9,#7dd3fc)",
    accentColor: "#0ea5e9",
    repo:  "https://github.com/www-infinity4/Gitpub",
    greeting: "📡 Gitpub online! I broadcast your repos and make sure everything is published and live. Which repo should I check?",
    skills: [
      "Scanning repos… 2 are unpublished. Want me to deploy them?",
      "All GitHub Pages sites are live ✅",
      "Emitting file signals on your latest push…",
      "Deployment health: 11/13 repos green. 2 need attention.",
      "Want me to ask Gitpro to style the landing page before we deploy?",
      "Signal broadcast complete. Repo index updated.",
      "I can route you to Gitflow to check branch readiness before deploy.",
      "Build queued. Estimated completion: 45 seconds.",
    ],
    handoffs: { pro: "gitpro", flow: "gitflow" },
  },
  gitpro: {
    name:  "Gitpro",
    emoji: "🛸",
    color: "linear-gradient(135deg,#f59e0b,#fde68a)",
    accentColor: "#f59e0b",
    repo:  "https://github.com/www-infinity4/Gitpro",
    greeting: "🛸 Gitpro activated! I'm your quantum mechanic — top-level page edits, styling, and cross-repo architecture. What needs upgrading?",
    skills: [
      "Detected 3 design inconsistencies in your README. Rewriting…",
      "New hero banner generated with colour-matched badges.",
      "Architecture review complete. Suggested: move utils to a shared package.",
      "Style suggestion: your Gitpin page needs contrast improvements.",
      "Assimilation in progress — merging design tokens across 4 repos.",
      "I can hand off to Gitpub once styling is done — ready to deploy?",
      "Quantum mechanic mode: refactoring `index.html` structure.",
      "✨ Page refresh complete. Clean, consistent, and mobile-ready.",
    ],
    handoffs: { pub: "gitpub", pin: "gitpin" },
  },
  gitpin: {
    name:  "Gitpin",
    emoji: "∆",
    color: "linear-gradient(135deg,#10b981,#6ee7b7)",
    accentColor: "#10b981",
    repo:  "https://github.com/www-infinity4/Gitpin",
    greeting: "∆ Gitpin triangulating! I rank and pin your best issues, PRs, and repos. What would you like me to prioritise?",
    skills: [
      "Vectorizing 47 open issues… top 3 ranked by signal strength.",
      "📌 Pinned: #12 \"Fit to Android mobile breakpoint.\" Vector locked.",
      "Cross-repo signal detected — linking related issues in 3 repos.",
      "Priority queue updated. Top issue: performance regression in branch `dev`.",
      "I can ask Gitpal to track this pin in your session — want me to route it?",
      "Vector map updated. 5 new content clusters identified.",
      "Triangulation complete. 2 PRs promoted to top of your review queue.",
      "Signal-based pin added. You'll get a pulse when it moves.",
    ],
    handoffs: { pal: "gitpal", pro: "gitpro" },
  },
  gitflow: {
    name:  "Gitflow",
    emoji: "🌊",
    color: "linear-gradient(135deg,#3b82f6,#93c5fd)",
    accentColor: "#3b82f6",
    repo:  "https://github.com/www-infinity4/Gitflow",
    greeting: "🌊 Gitflow online! I manage your branching strategy and keep your workflow clean. What branch are we working on?",
    skills: [
      "3 branches are stale and diverging from main.",
      "Merge conflict early-warning: `feature/android-layout` is 48 commits behind.",
      "Branch strategy suggestion: create a `release/1.1` branch for your next deploy.",
      "✅ Merged `feature/android-layout` into main. Conflict-free.",
      "I can signal Gitpub to deploy once the merge is complete.",
      "Hotfix branch created: `hotfix/manifest-url`. Ready to patch.",
      "Flow audit: your repo follows a clean feature-branch model. ✅",
      "Linking this branch to Gitpin's priority queue — issues will track the flow.",
    ],
    handoffs: { pub: "gitpub", pal: "gitpal" },
  },
};

// ── Active pal tracking ──────────────────────────────────────────────────────
let currentPalId    = "gitpal";
let responseIndex   = 0;
const activePals    = new Set();

// ── Pal activate buttons ─────────────────────────────────────────────────────
document.querySelectorAll(".pal-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const palId = btn.dataset.pal;
    const card  = btn.closest(".pal-card");
    activatePal(palId, card, btn);
  });
});

function activatePal(palId, card, btn) {
  const pal = PALS[palId];
  if (!pal) return;

  activePals.add(palId);

  // Visual feedback on the card button
  if (btn) {
    btn.textContent  = "✓ Active";
    btn.disabled     = true;
    btn.style.opacity = ".7";
  }

  // Add activation badge to card
  if (card && !card.querySelector(".activated-badge")) {
    const badge = document.createElement("div");
    badge.className = "activated-badge";
    badge.textContent = "● Active";
    const actions = card.querySelector(".pal-actions");
    if (actions) actions.insertBefore(badge, actions.firstChild);
    else card.appendChild(badge);
  }

  // Switch floating orb to this pal and open panel with greeting
  switchOrbToPal(palId);
  openOrbPanel(pal.greeting);

  // Highlight switchboard node
  const sbNode = document.querySelector(`.sb-node[data-pal="${palId}"]`);
  if (sbNode) sbNode.classList.add("active");

  // Log in switchboard
  logSwitchboard(`${pal.emoji} ${pal.name} activated — <a href="${pal.repo}" target="_blank" rel="noopener noreferrer">open repo ↗</a>`);
}

// ── Switchboard nodes ────────────────────────────────────────────────────────
document.querySelectorAll(".sb-node").forEach(node => {
  node.addEventListener("click", () => {
    const palId = node.dataset.pal;
    activatePal(palId, null, null);
    node.classList.add("active");
  });
});

function logSwitchboard(html) {
  const log = document.getElementById("sbLog");
  if (!log) return;
  const entry = document.createElement("div");
  entry.className = "sb-entry";
  entry.innerHTML = html;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

// ── Floating Orb ─────────────────────────────────────────────────────────────
const floatingOrb  = document.getElementById("floatingOrb");
const orbPanel     = document.getElementById("orbPanel");
const orbClose     = document.getElementById("orbClose");
const orbInput     = document.getElementById("orbInput");
const orbSend      = document.getElementById("orbSend");
const orbMessages  = document.getElementById("orbMessages");
const orbPanelHdr  = document.querySelector(".orb-panel-header");
const orbPanelTitle = document.getElementById("orbPanelTitle");
const orbSendBtn   = document.getElementById("orbSend");

floatingOrb?.addEventListener("click", toggleOrbPanel);
floatingOrb?.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") toggleOrbPanel();
});
orbClose?.addEventListener("click", () => orbPanel?.classList.remove("open"));
orbSend?.addEventListener("click", sendOrbMessage);
orbInput?.addEventListener("keydown", e => {
  if (e.key === "Enter") sendOrbMessage();
});

function toggleOrbPanel() {
  orbPanel?.classList.toggle("open");
  if (orbPanel?.classList.contains("open")) orbInput?.focus();
}

function openOrbPanel(msg) {
  orbPanel?.classList.add("open");
  addOrbMessage(msg, "bot");
  orbInput?.focus();
}

function addOrbMessage(text, type) {
  if (!orbMessages) return;
  const bubble = document.createElement("div");
  bubble.className = `demo-bubble ${type}`;
  // Allow simple HTML in bot messages (links)
  if (type === "bot") {
    bubble.innerHTML = text;
  } else {
    bubble.textContent = text;
  }
  orbMessages.appendChild(bubble);
  orbMessages.scrollTop = orbMessages.scrollHeight;
}

// Switch the floating orb's appearance to a specific pal
function switchOrbToPal(palId) {
  const pal = PALS[palId];
  if (!pal) return;
  currentPalId = palId;
  responseIndex = 0;
  if (floatingOrb)   floatingOrb.textContent = pal.emoji;
  if (orbPanelTitle) orbPanelTitle.textContent = pal.emoji + " " + pal.name;
  if (orbPanelHdr)   orbPanelHdr.style.background = pal.color;
  if (floatingOrb)   floatingOrb.style.background = pal.color;
  if (orbSendBtn)    orbSendBtn.style.background   = pal.accentColor;
  // Update input focus ring colour
  if (orbInput)      orbInput.style.setProperty("--focus-color", pal.color);
}

// ── Orb responses – per pal + handoff detection ───────────────────────────────
function sendOrbMessage() {
  const text = orbInput?.value.trim();
  if (!text) return;
  addOrbMessage(text, "user");
  if (orbInput) orbInput.value = "";

  const pal = PALS[currentPalId];
  if (!pal) return;

  // Check if message hints at a handoff keyword
  const lower = text.toLowerCase();
  let handoffId = null;
  for (const [keyword, targetId] of Object.entries(pal.handoffs || {})) {
    if (lower.includes(keyword)) {
      handoffId = targetId;
      break;
    }
  }

  setTimeout(() => {
    if (handoffId && PALS[handoffId]) {
      const target = PALS[handoffId];
      addOrbMessage(
        `📞 Routing you to ${target.name}… <a href="${target.repo}" target="_blank" rel="noopener noreferrer">open ${target.name} repo ↗</a>`,
        "bot"
      );
      logSwitchboard(`${pal.emoji} ${pal.name} → ${target.emoji} ${target.name} (handoff)`);
      setTimeout(() => switchOrbToPal(handoffId), 500);
    } else {
      const skills = pal.skills;
      const response = skills[responseIndex % skills.length];
      responseIndex++;
      addOrbMessage(response, "bot");

      // Occasionally suggest a repo link
      if (responseIndex % 3 === 0) {
        setTimeout(() => {
          addOrbMessage(
            `💡 Explore more: <a href="${pal.repo}" target="_blank" rel="noopener noreferrer">${pal.repo}</a>`,
            "bot"
          );
        }, 400);
      }
    }
  }, 600);
}
