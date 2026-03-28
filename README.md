# Atari-Clone

Clone of [www-infinity4/Atari](https://github.com/www-infinity4/Atari) with all non-working parts wired up and fixed.

## Projects

### 📱 Fit to Android — Microsoft Office Add-in

A taskpane add-in for Microsoft Word, Excel, and PowerPoint that adds a **"Fit to Android"** button alongside the existing *Fit to Desktop* workflow.

**Features**
- Device presets: Phone, Phone XL, Tablet, Tablet XL, Foldable, Custom
- Adjusts page margins, font sizes, and inline image widths for Android dp resolution
- Landscape / portrait toggle
- "Fit to Desktop" restore and "Reset to Original" actions
- Live mini device preview in the taskpane
- **⬇️ Download manifest.xml** button on landing page and inside taskpane for one-click Microsoft Office sideloading

**Sideload**
1. Click the **⬇️ Download for Microsoft Office** button on the home page  
2. In Word / Excel / PowerPoint: *Insert → Add-ins → Upload My Add-in* → select `FitToAndroid-manifest.xml`

---

### 🛸 Gitpals — GitHub AI Companion Switchboard

Five floating AI orb companions wired to their real GitHub repos, with **switchboard** routing so each pal can hand off to another.

| Orb | Symbol | Role | Repo |
|-----|--------|------|------|
| **Gitpal**  | GP  | Session companion | [Gitpal](https://github.com/www-infinity4/Gitpal) |
| **Gitpub**  | 📡  | Publisher | [Gitpub](https://github.com/www-infinity4/Gitpub) |
| **Gitpro**  | 🛸  | Quantum mechanic | [Gitpro](https://github.com/www-infinity4/Gitpro) |
| **Gitpin**  | ∆   | Vector triangulator | [Gitpin](https://github.com/www-infinity4/Gitpin) |
| **Gitflow** | 🌊  | Branch manager | [Gitflow](https://github.com/www-infinity4/Gitflow) |

**Fixes applied**
- Activate buttons now open the real GitHub repo for each pal
- Floating orb switches identity when a different pal is activated
- Switchboard panel lets pals hand off tasks to each other
- Per-pal skill responses with contextual handoff detection

---

## Files

```
index.html                        ← Landing page (download button for Office Add-in)
fit-to-android/
  manifest.xml                    ← Office Add-in manifest (Atari-Clone URLs)
  taskpane.html                   ← Taskpane UI (+ download manifest button)
  taskpane.css                    ← Styles
  taskpane.js                     ← Logic (fixed preset data-id, orientation toggle)
  commands.html                   ← Ribbon command placeholder
  assets/icon-16.png
  assets/icon-32.png
  assets/icon-80.png
gitpals/
  index.html                      ← Gitpals page (Activate → real repos, switchboard)
  gitpals.css                     ← Styles (Gitflow pal + switchboard styles added)
  gitpals.js                      ← Switchboard, per-pal skills, handoff routing
```