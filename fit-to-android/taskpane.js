/* global Office */

"use strict";

// ── Android device profiles (logical density-independent pixels) ─────────────
const ANDROID_PRESETS = {
  phone:    { width: 360,  height: 800,  dpi: 420, label: "Phone"      },
  phoneXL:  { width: 412,  height: 915,  dpi: 480, label: "Phone XL"   },
  tablet:   { width: 600,  height: 1024, dpi: 240, label: "Tablet"     },
  tabletXL: { width: 800,  height: 1280, dpi: 160, label: "Tablet XL"  },
  foldable: { width: 1080, height: 2400, dpi: 393, label: "Foldable"   },
};

// Typical desktop page size in mm (A4 portrait) / Word default (8.5 × 11 in)
const DESKTOP_DEFAULTS = {
  pageWidthMm:   215.9,  // 8.5 in
  pageHeightMm:  279.4,  // 11 in
  marginTopPt:   72,
  marginBottomPt:72,
  marginLeftPt:  72,
  marginRightPt: 72,
  bodyFontSizePt:12,
};

// Conversion helpers
const mmToPt  = mm  => mm * 2.8346;
const dpToPt  = (dp, dpi) => (dp / dpi) * 72;

// ── State ────────────────────────────────────────────────────────────────────
let selectedPreset   = ANDROID_PRESETS.phone;
let isOfficeReady    = false;
let originalSettings = null;   // snapshot for reset

// ── Office.js bootstrap ──────────────────────────────────────────────────────
// Guard: Office.js may not be available when running outside of an Office host
if (typeof Office !== "undefined" && Office.onReady) {
  Office.onReady(info => {
    isOfficeReady = true;
    console.log("Office.js ready – host:", info.host);
    bindUI();
  });
} else {
  // Fallback for standalone browser preview
  document.addEventListener("DOMContentLoaded", bindUI);
}

// ── UI Bindings ──────────────────────────────────────────────────────────────
function bindUI() {
  // Preset buttons
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const id = btn.dataset.id;
      const customSection = document.getElementById("customSection");

      if (id === "custom") {
        customSection.style.display = "block";
        selectedPreset = {
          width:  parseInt(document.getElementById("customWidth").value,  10) || 360,
          height: parseInt(document.getElementById("customHeight").value, 10) || 800,
          dpi:    160,
          label:  "Custom",
        };
      } else {
        customSection.style.display = "none";
        // Use named preset from ANDROID_PRESETS if available, else read data attributes
        selectedPreset = ANDROID_PRESETS[id] || {
          width:  parseInt(btn.dataset.width,  10),
          height: parseInt(btn.dataset.height, 10),
          dpi:    parseInt(btn.dataset.dpi,    10) || 420,
          label:  btn.querySelector(".preset-label").textContent.trim().split("\n")[0],
        };
      }

      updatePreviewDevice();
    });
  });

  // Custom dimension inputs – live update
  ["customWidth", "customHeight"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", () => {
      if (document.querySelector(".preset-btn[data-id='custom']")?.classList.contains("active")) {
        selectedPreset.width  = parseInt(document.getElementById("customWidth").value,  10) || 360;
        selectedPreset.height = parseInt(document.getElementById("customHeight").value, 10) || 800;
        updatePreviewDevice();
      }
    });
  });

  // Action buttons
  document.getElementById("btnFitAndroid")?.addEventListener("click", fitToAndroid);
  document.getElementById("btnFitDesktop")?.addEventListener("click", fitToDesktop);
  document.getElementById("btnReset")?.addEventListener("click", resetToOriginal);

  // Orientation toggle – update preview when changed
  document.getElementById("optOrientation")?.addEventListener("change", updatePreviewDevice);

  // Initial preview render
  updatePreviewDevice();
}

// ── Core: Fit to Android ─────────────────────────────────────────────────────
async function fitToAndroid() {
  const opts = getOptions();
  setStatus("Applying Android formatting…", "info");

  try {
    if (isOfficeReady && Office.context?.document) {
      await applyToDocument(selectedPreset, opts);
    } else {
      // Browser-only demo mode
      await simulateApply(selectedPreset, opts);
    }
    setStatus(`✅ Formatted for Android – ${selectedPreset.label} (${selectedPreset.width}×${selectedPreset.height} dp)`, "success");
    updatePreviewScreen(true);
  } catch (err) {
    console.error(err);
    setStatus("❌ Error: " + err.message, "error");
  }
}

// ── Core: Fit to Desktop ─────────────────────────────────────────────────────
async function fitToDesktop() {
  setStatus("Restoring desktop layout…", "info");
  try {
    if (isOfficeReady && Office.context?.document) {
      await applyDesktopDefaults();
    } else {
      await simulateDelay(400);
    }
    setStatus("🖥️ Document formatted for Desktop", "success");
    updatePreviewScreen(false);
  } catch (err) {
    console.error(err);
    setStatus("❌ Error: " + err.message, "error");
  }
}

// ── Core: Reset ───────────────────────────────────────────────────────────────
async function resetToOriginal() {
  if (!originalSettings) {
    setStatus("No previous settings saved to restore.", "info");
    return;
  }
  setStatus("Resetting to original…", "info");
  try {
    if (isOfficeReady && Office.context?.document) {
      await applySettings(originalSettings);
    } else {
      await simulateDelay(300);
    }
    setStatus("↩ Document reset to original settings", "success");
    updatePreviewScreen(null);
    originalSettings = null;
  } catch (err) {
    console.error(err);
    setStatus("❌ Error: " + err.message, "error");
  }
}

// ── Office Document API ───────────────────────────────────────────────────────
async function applyToDocument(preset, opts) {
  await Word.run(async context => {
    const body = context.document.body;
    const sections = context.document.sections;
    sections.load("items");
    await context.sync();

    // Save original settings before first modification
    if (!originalSettings) {
      const firstSection = sections.items[0];
      firstSection.load("pageSetup");
      await context.sync();
      originalSettings = {
        pageWidth:    firstSection.pageSetup.pageWidth,
        pageHeight:   firstSection.pageSetup.pageHeight,
        topMargin:    firstSection.pageSetup.topMargin,
        bottomMargin: firstSection.pageSetup.bottomMargin,
        leftMargin:   firstSection.pageSetup.leftMargin,
        rightMargin:  firstSection.pageSetup.rightMargin,
      };
    }

    // DP → pts conversion using device DPI
    const pageWidthPt  = dpToPt(preset.width,  preset.dpi);
    const pageHeightPt = dpToPt(preset.height, preset.dpi);

    sections.items.forEach(section => {
      const ps = section.pageSetup;

      // Page dimensions
      ps.pageWidth  = pageWidthPt;
      ps.pageHeight = pageHeightPt;

      // Orientation
      if (opts.orientation) {
        ps.orientation = Word.PageOrientation.landscape;
      } else {
        ps.orientation = Word.PageOrientation.portrait;
      }

      // Margins (tighter for mobile)
      if (opts.adjustMargins) {
        const marginPt = dpToPt(8, preset.dpi);   // 8 dp margin
        ps.topMargin    = marginPt;
        ps.bottomMargin = marginPt;
        ps.leftMargin   = marginPt;
        ps.rightMargin  = marginPt;
      }
    });

    // Font scaling: clamp between 8pt (minimum readable) and 11pt (comfortable
    // mobile body text), derived from 4dp base relative to the device's DPI.
    if (opts.scaleFonts) {
      const baseFontPt = Math.max(8, Math.min(11, dpToPt(4, preset.dpi)));
      body.paragraphs.load("items");
      await context.sync();
      body.paragraphs.items.forEach(para => {
        para.font.size = baseFontPt;
      });
    }

    // Inline images: leave 16dp of horizontal padding (8dp each side) so images
    // do not bleed to the edge of the screen.
    if (opts.resizeImages) {
      body.inlinePictures.load("items");
      await context.sync();
      const HORIZONTAL_PADDING_DP = 16;
      const maxWidthPt = dpToPt(preset.width - HORIZONTAL_PADDING_DP, preset.dpi);
      body.inlinePictures.items.forEach(pic => {
        if (pic.width > maxWidthPt) {
          const scale = maxWidthPt / pic.width;
          pic.width  = maxWidthPt;
          pic.height = pic.height * scale;
        }
      });
    }

    await context.sync();
  });
}

async function applyDesktopDefaults() {
  await Word.run(async context => {
    const sections = context.document.sections;
    sections.load("items");
    await context.sync();

    sections.items.forEach(section => {
      const ps = section.pageSetup;
      ps.pageWidth    = mmToPt(DESKTOP_DEFAULTS.pageWidthMm);
      ps.pageHeight   = mmToPt(DESKTOP_DEFAULTS.pageHeightMm);
      ps.topMargin    = DESKTOP_DEFAULTS.marginTopPt;
      ps.bottomMargin = DESKTOP_DEFAULTS.marginBottomPt;
      ps.leftMargin   = DESKTOP_DEFAULTS.marginLeftPt;
      ps.rightMargin  = DESKTOP_DEFAULTS.marginRightPt;
    });

    const body = context.document.body;
    body.paragraphs.load("items");
    await context.sync();
    body.paragraphs.items.forEach(para => {
      para.font.size = DESKTOP_DEFAULTS.bodyFontSizePt;
    });

    await context.sync();
  });
}

async function applySettings(settings) {
  await Word.run(async context => {
    const sections = context.document.sections;
    sections.load("items");
    await context.sync();
    sections.items.forEach(section => {
      const ps = section.pageSetup;
      ps.pageWidth    = settings.pageWidth;
      ps.pageHeight   = settings.pageHeight;
      ps.topMargin    = settings.topMargin;
      ps.bottomMargin = settings.bottomMargin;
      ps.leftMargin   = settings.leftMargin;
      ps.rightMargin  = settings.rightMargin;
    });
    await context.sync();
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getOptions() {
  return {
    adjustMargins: document.getElementById("optMargins")?.checked     ?? true,
    scaleFonts:    document.getElementById("optFontScale")?.checked   ?? true,
    resizeImages:  document.getElementById("optImages")?.checked      ?? true,
    simplifyTables:document.getElementById("optTables")?.checked      ?? false,
    orientation:   document.getElementById("optOrientation")?.checked ?? false,
  };
}

function setStatus(msg, type = "") {
  const el = document.getElementById("statusMsg");
  if (!el) return;
  el.textContent = msg;
  el.className = "status " + type;
}

function updatePreviewDevice() {
  const device = document.getElementById("previewDevice");
  if (!device) return;
  const isLandscape = document.getElementById("optOrientation")?.checked;
  const ratio = selectedPreset.height / selectedPreset.width;
  const baseW = isLandscape ? 140 : 90;
  const baseH = isLandscape ? Math.round(baseW / ratio) : Math.round(baseW * ratio);
  device.style.width  = Math.min(baseW, 160) + "px";
  device.style.height = Math.min(baseH, 220) + "px";
}

function updatePreviewScreen(isAndroid) {
  const screen = document.getElementById("previewScreen");
  if (!screen) return;
  if (isAndroid === true) {
    screen.innerHTML = `<div style="font-size:9px;color:#073042;text-align:center;line-height:1.5;">
      <div style="font-size:14px;">📱</div>
      <strong>${selectedPreset.label}</strong><br/>
      ${selectedPreset.width}×${selectedPreset.height}<br/>
      <span style="color:#3ddc84">✓ Applied</span>
    </div>`;
  } else if (isAndroid === false) {
    screen.innerHTML = `<div style="font-size:9px;color:#073042;text-align:center;line-height:1.5;">
      <div style="font-size:14px;">🖥️</div>
      <strong>Desktop</strong><br/>
      <span style="color:#4285f4">✓ Applied</span>
    </div>`;
  } else {
    screen.innerHTML = '<p class="preview-hint">Apply formatting to see a preview</p>';
  }
}

function simulateDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateApply(preset, opts) {
  await simulateDelay(600);
  console.log("Simulated apply:", { preset, opts });
}
