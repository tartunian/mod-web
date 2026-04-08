(() => {
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  const hudEl = document.getElementById("hud");
  const audio = document.getElementById("audio");
  const bgVideo = document.getElementById("bgVideo");
  const videoFileEl = document.getElementById("videoFile");
  const clearVideoBtn = document.getElementById("clearVideoBtn");
  const globalTintColorEl = document.getElementById("globalTintColor");
  const globalTintOpacityEl = document.getElementById("globalTintOpacity");
  const masterTintEnableEl = document.getElementById("masterTintEnable");
  const videoShiftEl = document.getElementById("videoShift");
  const videoShiftSweepEnableEl = document.getElementById("videoShiftSweepEnable");
  const videoShiftSweepDivEl = document.getElementById("videoShiftSweepDiv");
  const playBtn = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const togglePanelBtn = document.getElementById("togglePanelBtn");
  const prevTrackBtn = document.getElementById("prevTrackBtn");
  const nextTrackBtn = document.getElementById("nextTrackBtn");
  const trackSelectEl = document.getElementById("trackSelect");
  const trackBarEl = document.getElementById("trackBar");
  const statusEl = document.getElementById("status");
  const buildInfoEl = document.getElementById("buildInfo");
  const metersEl = document.getElementById("meters");
  const intensityEl = document.getElementById("intensity");
  const wordEl = document.getElementById("word");
  const textColorEl = document.getElementById("textColor");
  const textFontEl = document.getElementById("textFont");
  const textSizeEl = document.getElementById("textSize");
  const textXEl = document.getElementById("textX");
  const textYEl = document.getElementById("textY");
  const toggleGlowBtn = document.getElementById("toggleGlowBtn");
  const outlineEnableEl = document.getElementById("outlineEnable");
  const outlineColorEl = document.getElementById("outlineColor");
  const outlineThicknessEl = document.getElementById("outlineThickness");
  const leftSignalEl = document.getElementById("leftSignal");
  const leftGainEl = document.getElementById("leftGain");
  const midSignalEl = document.getElementById("midSignal");
  const midGainEl = document.getElementById("midGain");
  const rightSignalEl = document.getElementById("rightSignal");
  const rightGainEl = document.getElementById("rightGain");
  const bandSpreadEl = document.getElementById("bandSpread");
  const ghostSizeEl = document.getElementById("ghostSize");
  const ghostColorEl = document.getElementById("ghostColor");
  const ghostDecayEl = document.getElementById("ghostDecay");
  const ghostOpacityEl = document.getElementById("ghostOpacity");
  const glowOpacityEl = document.getElementById("glowOpacity");
  const ghostFillEl = document.getElementById("ghostFill");
  const borderWidthEl = document.getElementById("borderWidth");
  const borderGainEl = document.getElementById("borderGain");
  const borderOpacityEl = document.getElementById("borderOpacity");
  const borderTintEl = document.getElementById("borderTint");
  const borderSignalEl = document.getElementById("borderSignal");
  const borderFreqDivEl = document.getElementById("borderFreqDiv");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const loadSettingsBtn = document.getElementById("loadSettingsBtn");
  const exportSettingsBtn = document.getElementById("exportSettingsBtn");
  const importSettingsBtn = document.getElementById("importSettingsBtn");
  const importSettingsFile = document.getElementById("importSettingsFile");
  const chips = Array.from(document.querySelectorAll(".chip"));
  const flowOverlayEnableEl = document.getElementById("flowOverlayEnable");
  const flowOverlayOpacityEl = document.getElementById("flowOverlayOpacity");
  const flowEffectEl = document.getElementById("flowEffect");
  const flowEffectIntensityEl = document.getElementById("flowEffectIntensity");
  const flowShapeEl = document.getElementById("flowShape");

  const SETTINGS_KEY = "signal-design-lab-settings-v1";
  const DEFAULT_SETTINGS_URL = "signal-settings-default.json?v=20260408b";
  const BUILD_VERSION = "2026-04-08c";
  const FONT_FAMILIES = {
    bebas: '"Bebas Neue", "Arial Narrow", sans-serif',
    monoton: '"Monoton", "Trebuchet MS", sans-serif',
    rubikglitch: '"Rubik Glitch", "Trebuchet MS", sans-serif',
    bungueshade: '"Bungee Shade", "Trebuchet MS", sans-serif',
    chicle: '"Chicle", "Trebuchet MS", sans-serif',
  };

  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  addEventListener("resize", () => {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
  });

  let mode = "letters";
  let bgVideoUrl = null;
  let panelCollapsed = true;
  let glowEnabled = true;
  let defaultSettingsLoadPromise = null;

  function setBuildInfo() {
    if (!buildInfoEl) return;
    buildInfoEl.textContent = `build: ${BUILD_VERSION}`;
  }

  setBuildInfo();

  function updateGlowButtonLabel() {
    if (!toggleGlowBtn) return;
    toggleGlowBtn.textContent = glowEnabled ? "Glow On" : "Glow Off";
  }

  function applyPanelCollapsedState() {
    if (!hudEl) return;
    hudEl.classList.toggle("collapsed", panelCollapsed);
    if (togglePanelBtn) togglePanelBtn.textContent = panelCollapsed ? "Expand" : "Collapse";

    const rows = Array.from(hudEl.querySelectorAll(".row"));
    for (const row of rows) {
      if (row.classList.contains("top")) continue;
      row.style.display = panelCollapsed ? "none" : "flex";
    }
    if (metersEl) metersEl.style.display = panelCollapsed ? "none" : "block";
  }

  applyPanelCollapsedState();

  function setMode(nextMode) {
    mode = nextMode;
    chips.forEach((c) => c.classList.toggle("active", c.dataset.mode === mode));
  }

  function collectSettings() {
    const base = state.masterTintBase || {
      ghostColor: (ghostColorEl && ghostColorEl.value) || "#66d5ff",
      borderTint: (borderTintEl && borderTintEl.value) || "#51b8ff",
      globalTintColor: (globalTintColorEl && globalTintColorEl.value) || "#0b2442",
    };
    return {
      mode,
      panelCollapsed,
      flowOverlayEnable: flowOverlayEnableEl && flowOverlayEnableEl.checked,
      flowOverlayOpacity: flowOverlayOpacityEl && flowOverlayOpacityEl.value,
      flowEffect: flowEffectEl && flowEffectEl.value,
      flowEffectIntensity: flowEffectIntensityEl && flowEffectIntensityEl.value,
      flowShape: flowShapeEl && flowShapeEl.value,
      intensity: intensityEl && intensityEl.value,
      word: wordEl && wordEl.value,
      textColor: textColorEl && textColorEl.value,
      textFont: textFontEl && textFontEl.value,
      textSize: textSizeEl && textSizeEl.value,
      textX: textXEl && textXEl.value,
      textY: textYEl && textYEl.value,
      glowEnabled,
      outlineEnable: outlineEnableEl && outlineEnableEl.checked,
      outlineColor: outlineColorEl && outlineColorEl.value,
      outlineThickness: outlineThicknessEl && outlineThicknessEl.value,
      leftSignal: leftSignalEl && leftSignalEl.value,
      leftGain: leftGainEl && leftGainEl.value,
      midSignal: midSignalEl && midSignalEl.value,
      midGain: midGainEl && midGainEl.value,
      rightSignal: rightSignalEl && rightSignalEl.value,
      rightGain: rightGainEl && rightGainEl.value,
      bandSpread: bandSpreadEl && bandSpreadEl.value,
      ghostSize: ghostSizeEl && ghostSizeEl.value,
      ghostColor: ghostColorEl && ghostColorEl.value,
      ghostDecay: ghostDecayEl && ghostDecayEl.value,
      ghostOpacity: ghostOpacityEl && ghostOpacityEl.value,
      glowOpacity: glowOpacityEl && glowOpacityEl.value,
      ghostFill: ghostFillEl && ghostFillEl.checked,
      borderWidth: borderWidthEl && borderWidthEl.value,
      borderGain: borderGainEl && borderGainEl.value,
      borderOpacity: borderOpacityEl && borderOpacityEl.value,
      borderTint: borderTintEl && borderTintEl.value,
      borderSignal: borderSignalEl && borderSignalEl.value,
      borderFreqDiv: borderFreqDivEl && borderFreqDivEl.value,
      globalTintColor: globalTintColorEl && globalTintColorEl.value,
      globalTintOpacity: globalTintOpacityEl && globalTintOpacityEl.value,
      masterTintEnable: masterTintEnableEl && masterTintEnableEl.checked,
      videoShift: videoShiftEl && videoShiftEl.value,
      videoShiftSweepEnable: videoShiftSweepEnableEl && videoShiftSweepEnableEl.checked,
      videoShiftSweepDiv: videoShiftSweepDivEl && videoShiftSweepDivEl.value,
      masterTintBaseGhost: base.ghostColor,
      masterTintBaseBorder: base.borderTint,
      masterTintBaseGlobal: base.globalTintColor,
    };
  }

  function applySettings(settings, showStatus = true) {
    if (!settings || typeof settings !== "object") return;

    if (settings.mode) setMode(settings.mode);
    if (typeof settings.panelCollapsed === "boolean") {
      panelCollapsed = settings.panelCollapsed;
      applyPanelCollapsedState();
    }

    const pairs = [
      [intensityEl, settings.intensity],
      [wordEl, settings.word],
      [textColorEl, settings.textColor],
      [textFontEl, settings.textFont],
      [textSizeEl, settings.textSize],
      [textXEl, settings.textX],
      [textYEl, settings.textY],
      [outlineColorEl, settings.outlineColor],
      [outlineThicknessEl, settings.outlineThickness],
      [leftGainEl, settings.leftGain],
      [midGainEl, settings.midGain],
      [rightGainEl, settings.rightGain],
      [bandSpreadEl, settings.bandSpread],
      [ghostSizeEl, settings.ghostSize],
      [ghostColorEl, settings.ghostColor],
      [ghostDecayEl, settings.ghostDecay],
      [ghostOpacityEl, settings.ghostOpacity],
      [glowOpacityEl, settings.glowOpacity],
      [borderWidthEl, settings.borderWidth],
      [borderGainEl, settings.borderGain],
      [borderOpacityEl, settings.borderOpacity],
      [borderTintEl, settings.borderTint],
      [borderFreqDivEl, settings.borderFreqDiv],
      [globalTintColorEl, settings.globalTintColor],
      [globalTintOpacityEl, settings.globalTintOpacity],
      [videoShiftEl, settings.videoShift !== undefined ? settings.videoShift : settings.masterTintShift],
      [videoShiftSweepDivEl, settings.videoShiftSweepDiv],
      [flowOverlayOpacityEl, settings.flowOverlayOpacity],
      [flowEffectEl, settings.flowEffect],
      [flowEffectIntensityEl, settings.flowEffectIntensity],
      [flowShapeEl, settings.flowShape],
    ];
    for (const [el, value] of pairs) {
      if (!el || value === undefined || value === null) continue;
      el.value = String(value);
    }

    if (ghostFillEl && typeof settings.ghostFill === "boolean") {
      ghostFillEl.checked = settings.ghostFill;
    }
    if (ghostColorEl && !settings.ghostColor && settings.ghostHue !== undefined && settings.ghostHue !== null) {
      ghostColorEl.value = hueToHex(settings.ghostHue);
    }
    if (outlineEnableEl && typeof settings.outlineEnable === "boolean") {
      outlineEnableEl.checked = settings.outlineEnable;
    }
    if (flowOverlayEnableEl && typeof settings.flowOverlayEnable === "boolean") {
      flowOverlayEnableEl.checked = settings.flowOverlayEnable;
    }
    if (masterTintEnableEl && typeof settings.masterTintEnable === "boolean") {
      masterTintEnableEl.checked = settings.masterTintEnable;
    }
    if (videoShiftSweepEnableEl && typeof settings.videoShiftSweepEnable === "boolean") {
      videoShiftSweepEnableEl.checked = settings.videoShiftSweepEnable;
    }

    state.masterTintBase = {
      ghostColor: settings.masterTintBaseGhost || (ghostColorEl && ghostColorEl.value) || "#66d5ff",
      borderTint: settings.masterTintBaseBorder || (borderTintEl && borderTintEl.value) || "#51b8ff",
      globalTintColor: settings.masterTintBaseGlobal || (globalTintColorEl && globalTintColorEl.value) || "#0b2442",
    };
    if (typeof settings.glowEnabled === "boolean") {
      glowEnabled = settings.glowEnabled;
      updateGlowButtonLabel();
    }

    if (leftSignalEl && settings.leftSignal) setSelectValueOrFallback(leftSignalEl, settings.leftSignal);
    if (midSignalEl && settings.midSignal) setSelectValueOrFallback(midSignalEl, settings.midSignal);
    if (rightSignalEl && settings.rightSignal) setSelectValueOrFallback(rightSignalEl, settings.rightSignal);
    if (borderSignalEl && settings.borderSignal) setSelectValueOrFallback(borderSignalEl, settings.borderSignal);

    if (showStatus) statusEl.textContent = "Settings loaded.";
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(collectSettings()));
      statusEl.textContent = "Settings saved.";
    } catch (_err) {
      statusEl.textContent = "Failed to save settings.";
    }
  }

  function loadSettings(showStatus = true) {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) {
        if (showStatus) statusEl.textContent = "No saved settings found.";
        return false;
      }
      applySettings(JSON.parse(raw), showStatus);
      return true;
    } catch (_err) {
      if (showStatus) statusEl.textContent = "Failed to load settings.";
      return false;
    }
  }

  async function loadDefaultSettingsIfMissing(showStatus = false) {
    if (loadSettings(false)) return true;
    if (defaultSettingsLoadPromise) {
      await defaultSettingsLoadPromise;
      return loadSettings(showStatus);
    }

    defaultSettingsLoadPromise = (async () => {
      try {
        const resp = await fetch(resolveAssetUrl(DEFAULT_SETTINGS_URL));
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const parsed = await resp.json();
        applySettings(parsed, false);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(collectSettings()));
      } catch (_err) {
        // Keep running with built-in control defaults if default settings file is unavailable.
      }
    })();

    try {
      await defaultSettingsLoadPromise;
    } finally {
      defaultSettingsLoadPromise = null;
    }

    return loadSettings(showStatus);
  }

  function exportSettings() {
    const data = JSON.stringify(collectSettings(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signal-settings-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    statusEl.textContent = "Settings exported.";
  }

  function importSettingsFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        applySettings(parsed, false);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(collectSettings()));
        statusEl.textContent = "Settings imported.";
      } catch (_err) {
        statusEl.textContent = "Invalid settings file.";
      }
    };
    reader.readAsText(file);
  }

  if (togglePanelBtn && hudEl) {
    togglePanelBtn.addEventListener("click", () => {
      panelCollapsed = !panelCollapsed;
      applyPanelCollapsedState();
    });
  }

  if (toggleGlowBtn) {
    toggleGlowBtn.addEventListener("click", () => {
      glowEnabled = !glowEnabled;
      updateGlowButtonLabel();
    });
    updateGlowButtonLabel();
  }

  saveSettingsBtn && saveSettingsBtn.addEventListener("click", saveSettings);
  loadSettingsBtn && loadSettingsBtn.addEventListener("click", () => loadSettings(true));
  exportSettingsBtn && exportSettingsBtn.addEventListener("click", exportSettings);
  importSettingsBtn && importSettingsBtn.addEventListener("click", () => importSettingsFile && importSettingsFile.click());
  if (importSettingsFile) {
    importSettingsFile.addEventListener("change", () => {
      const file = importSettingsFile.files && importSettingsFile.files[0];
      importSettingsFromFile(file);
      importSettingsFile.value = "";
    });
  }

  if (masterTintEnableEl) {
    masterTintEnableEl.addEventListener("change", () => {
      if (masterTintEnableEl.checked) captureMasterTintBaseFromCurrent();
    });
  }

  function stopAndClearBgVideo() {
    if (!bgVideo) return;
    bgVideo.pause();
    bgVideo.removeAttribute("src");
    bgVideo.load();
    if (bgVideoUrl) {
      URL.revokeObjectURL(bgVideoUrl);
      bgVideoUrl = null;
    }
  }

  async function playBgVideoSafely() {
    if (!bgVideo || !bgVideo.src) return;
    try {
      await bgVideo.play();
    } catch (_err) {
      statusEl.textContent = "Video loaded but playback is blocked. Press Play.";
    }
  }

  if (bgVideo) {
    bgVideo.autoplay = true;
    bgVideo.loop = true;
    bgVideo.muted = true;
    bgVideo.defaultMuted = true;
    bgVideo.volume = 0;
    bgVideo.playsInline = true;
    bgVideo.setAttribute("playsinline", "");
    bgVideo.setAttribute("webkit-playsinline", "");
    bgVideo.addEventListener("loadeddata", () => {
      playBgVideoSafely();
    });
    bgVideo.addEventListener("error", () => {
      statusEl.textContent = "Failed to decode video file.";
    });

    if (bgVideo.getAttribute("src")) {
      playBgVideoSafely();
    }
  }

  if (videoFileEl) {
    videoFileEl.addEventListener("change", () => {
      const file = videoFileEl.files && videoFileEl.files[0];
      if (!file) return;
      if (!file.type.startsWith("video/")) {
        statusEl.textContent = "Selected file is not a video.";
        return;
      }

      if (bgVideoUrl) URL.revokeObjectURL(bgVideoUrl);
      bgVideoUrl = URL.createObjectURL(file);
      bgVideo.src = bgVideoUrl;
      bgVideo.currentTime = 0;
      bgVideo.muted = true;
      bgVideo.defaultMuted = true;
      bgVideo.volume = 0;
      playBgVideoSafely();
      statusEl.textContent = `Background video loaded: ${file.name} (muted)`;
    });
  }

  if (clearVideoBtn) {
    clearVideoBtn.addEventListener("click", () => {
      stopAndClearBgVideo();
      if (videoFileEl) videoFileEl.value = "";
      statusEl.textContent = "Background video cleared.";
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      setMode(chip.dataset.mode);
    });
  });

  playBtn.addEventListener("click", async () => {
    try {
      await audio.play();
      playBgVideoSafely();
    } catch (err) {
      statusEl.textContent = "Audio play blocked. Click again after interacting.";
    }
  });
  pauseBtn.addEventListener("click", () => {
    audio.pause();
    if (bgVideo) bgVideo.pause();
  });
  audio.addEventListener("ended", () => {
    if (state.playlist.length > 1) {
      shiftTrack(1);
    }
  });

  audio.autoplay = true;

  const signalsUrl = "signals/output/signals.json";
  const playlistUrl = "library/manifests/playlist.json";
  const state = {
    timeline: [],
    stems: {},
    blended: {},
    bands: {},
    custom: {},
    rawGroups: {},
    meterDefs: [],
    meterEma: {},
    letterLaneState: [],
    letterStretchTrail: [],
    signalLaneMap: {},
    playlist: [],
    currentTrackIndex: -1,
    trackLoadToken: 0,
    trackBpm: 120,
    shockwaves: [],
    shockwaveCooldown: 0,
    prevKick: 0,
    ribbons: [],
    inkBlobs: [],
    masterTintBase: null,
    loaded: false,
  };

  function resetMotionEffectState() {
    state.shockwaves = [];
    state.shockwaveCooldown = 0;
    state.prevKick = 0;
    state.inkBlobs = [];
    state.ribbons = Array.from({ length: 4 }, (_, i) => ({
      phase: i * 1.31,
      points: [],
    }));
  }

  let idxHint = 0;
  function sampleLane(t, lane) {
    const xs = state.timeline;
    const ys = lane;
    if (!xs.length || !ys || !ys.length) return 0;
    if (t <= xs[0]) return ys[0] || 0;
    const last = xs.length - 1;
    if (t >= xs[last]) return ys[last] || 0;

    while (idxHint < last - 1 && xs[idxHint + 1] < t) idxHint++;
    while (idxHint > 0 && xs[idxHint] > t) idxHint--;

    const i0 = idxHint;
    const i1 = i0 + 1;
    const x0 = xs[i0], x1 = xs[i1];
    const y0 = ys[i0] || 0, y1 = ys[i1] || 0;
    const a = (t - x0) / (x1 - x0 || 1e-6);
    return y0 + (y1 - y0) * a;
  }

  function getStemLane(name, preferred = ["rms", "onset", "centroid"]) {
    const stemObj = state.stems && state.stems[name];
    if (!stemObj || typeof stemObj !== "object") return [];
    for (const key of preferred) {
      const lane = stemObj[key];
      if (Array.isArray(lane) && lane.length) return lane;
    }
    for (const value of Object.values(stemObj)) {
      if (Array.isArray(value) && value.length) return value;
    }
    return [];
  }

  function buildSignalLaneMap() {
    const map = {};
    const preferredOrder = ["blended", "stems", "bands", "proxies", "global", "customInstruments"];

    for (const groupName of preferredOrder) {
      const group = state.rawGroups[groupName];
      if (!group || typeof group !== "object") continue;

      for (const [key, lane] of Object.entries(group)) {
        if (Array.isArray(lane) && lane.length) {
          map[`${groupName}:${key}`] = lane;
          continue;
        }

        if (lane && typeof lane === "object") {
          for (const [subkey, sublane] of Object.entries(lane)) {
            if (!Array.isArray(sublane) || !sublane.length) continue;
            map[`${groupName}:${key}.${subkey}`] = sublane;
          }
        }
      }
    }

    return map;
  }

  function setSelectValueOrFallback(selectEl, preferred) {
    if (!selectEl) return;
    const values = Array.from(selectEl.options).map((opt) => opt.value);
    if (values.includes(preferred)) {
      selectEl.value = preferred;
    } else if (values.length) {
      selectEl.value = values[0];
    }
  }

  function populateSignalSelects() {
    if (!leftSignalEl || !midSignalEl || !rightSignalEl || !borderSignalEl) return;
    const prev = {
      left: leftSignalEl.value,
      mid: midSignalEl.value,
      right: rightSignalEl.value,
      border: borderSignalEl.value,
    };

    const ids = Object.keys(state.signalLaneMap);
    ids.sort((a, b) => a.localeCompare(b));

    const selects = [leftSignalEl, midSignalEl, rightSignalEl, borderSignalEl];
    for (const selectEl of selects) {
      selectEl.innerHTML = "";
      for (const id of ids) {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = id;
        selectEl.appendChild(opt);
      }
    }

    if (ids.length) {
      setSelectValueOrFallback(leftSignalEl, prev.left || "blended:bass");
      setSelectValueOrFallback(midSignalEl, prev.mid || "blended:snare");
      setSelectValueOrFallback(rightSignalEl, prev.right || "blended:hat");
      setSelectValueOrFallback(borderSignalEl, prev.border || "blended:melodic");
    }
  }

  function hexToRgb(hex) {
    if (typeof hex !== "string") return { r: 81, g: 184, b: 255 };
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    if (!m) return { r: 81, g: 184, b: 255 };
    return {
      r: Number.parseInt(m[1], 16),
      g: Number.parseInt(m[2], 16),
      b: Number.parseInt(m[3], 16),
    };
  }

  function hueToHex(hueValue) {
    const h = ((Number.parseFloat(hueValue) || 0) % 360 + 360) % 360;
    const c = 1;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) {
      r = c; g = x; b = 0;
    } else if (h < 120) {
      r = x; g = c; b = 0;
    } else if (h < 180) {
      r = 0; g = c; b = x;
    } else if (h < 240) {
      r = 0; g = x; b = c;
    } else if (h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
    const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function hexToHsl(hex) {
    const { r, g, b } = hexToRgb(hex);
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;
    let h = 0;
    const l = (max + min) / 2;
    let s = 0;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === rn) h = 60 * (((gn - bn) / d) % 6);
      else if (max === gn) h = 60 * ((bn - rn) / d + 2);
      else h = 60 * ((rn - gn) / d + 4);
    }
    if (h < 0) h += 360;
    return { h, s, l };
  }

  function hslToHex(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r1 = 0;
    let g1 = 0;
    let b1 = 0;
    if (h < 60) {
      r1 = c; g1 = x; b1 = 0;
    } else if (h < 120) {
      r1 = x; g1 = c; b1 = 0;
    } else if (h < 180) {
      r1 = 0; g1 = c; b1 = x;
    } else if (h < 240) {
      r1 = 0; g1 = x; b1 = c;
    } else if (h < 300) {
      r1 = x; g1 = 0; b1 = c;
    } else {
      r1 = c; g1 = 0; b1 = x;
    }
    const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
    return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
  }

  function shiftHexHue(hex, shiftDeg) {
    const hsl = hexToHsl(hex);
    const h = ((hsl.h + shiftDeg) % 360 + 360) % 360;
    return hslToHex(h, hsl.s, hsl.l);
  }

  function captureMasterTintBaseFromCurrent() {
    state.masterTintBase = {
      ghostColor: (ghostColorEl && ghostColorEl.value) || "#66d5ff",
      borderTint: (borderTintEl && borderTintEl.value) || "#51b8ff",
      globalTintColor: (globalTintColorEl && globalTintColorEl.value) || "#0b2442",
    };
  }

  function getEffectiveTintPalette() {
    const enabled = !!(masterTintEnableEl && masterTintEnableEl.checked);
    if (!enabled) {
      return {
        ghostColor: (ghostColorEl && ghostColorEl.value) || "#66d5ff",
        borderTint: (borderTintEl && borderTintEl.value) || "#51b8ff",
        globalTintColor: (globalTintColorEl && globalTintColorEl.value) || "#0b2442",
      };
    }
    if (!state.masterTintBase) captureMasterTintBaseFromCurrent();
    const shift = getVideoShiftValue();
    return {
      ghostColor: shiftHexHue(state.masterTintBase.ghostColor, shift),
      borderTint: shiftHexHue(state.masterTintBase.borderTint, shift),
      globalTintColor: shiftHexHue(state.masterTintBase.globalTintColor, shift),
    };
  }

  function getVideoShiftValue() {
    const fallback = Number.parseFloat(videoShiftEl && videoShiftEl.value) || 0;
    const sweepEnabled = !!(videoShiftSweepEnableEl && videoShiftSweepEnableEl.checked);
    if (!sweepEnabled || !videoShiftEl) return fallback;

    const min = Number.parseFloat(videoShiftEl.min);
    const max = Number.parseFloat(videoShiftEl.max);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return fallback;

    const bpm = Math.max(60, Math.min(220, state.trackBpm || 120));
    const div = Math.max(1, Number.parseFloat(videoShiftSweepDivEl && videoShiftSweepDivEl.value) || 8);
    const hz = bpm / (60 * div);
    const now = (audio && Number.isFinite(audio.currentTime)) ? audio.currentTime : performance.now() * 0.001;
    const phase = now * hz * Math.PI * 2;
    const normalized = 0.5 + 0.5 * Math.sin(phase);
    const sweepShift = min + (max - min) * normalized;
    videoShiftEl.value = sweepShift.toFixed(1);
    return sweepShift;
  }

  function normalizeTrackTitle(track, i) {
    if (track && typeof track.title === "string" && track.title.trim()) return track.title.trim();
    if (track && typeof track.id === "string" && track.id.trim()) return track.id.trim();
    return `Track ${i + 1}`;
  }

  function populateTrackSelect() {
    if (!trackSelectEl) return;
    trackSelectEl.innerHTML = "";
    for (let i = 0; i < state.playlist.length; i++) {
      const track = state.playlist[i];
      const option = document.createElement("option");
      option.value = String(i);
      option.textContent = `${i + 1}. ${normalizeTrackTitle(track, i)}`;
      trackSelectEl.appendChild(option);
    }
  }

  function updateTrackControls() {
    const hasTracks = state.playlist.length > 0;
    if (trackSelectEl) {
      trackSelectEl.disabled = !hasTracks;
      if (hasTracks && state.currentTrackIndex >= 0) {
        trackSelectEl.value = String(state.currentTrackIndex);
      }
    }
    if (prevTrackBtn) prevTrackBtn.disabled = !hasTracks || state.playlist.length < 2;
    if (nextTrackBtn) nextTrackBtn.disabled = !hasTracks || state.playlist.length < 2;
  }

  function estimateBpmFromData(data) {
    const timeline = Array.isArray(data && data.timelineSec) ? data.timelineSec : [];
    if (timeline.length < 32) return 120;

    const dt = (timeline[timeline.length - 1] - timeline[0]) / Math.max(1, timeline.length - 1);
    if (!Number.isFinite(dt) || dt <= 0) return 120;

    const sig = (data && data.signals) || {};
    const stems = sig.stems || {};
    const blended = sig.blended || {};

    const candidates = [
      stems.drums && stems.drums.onset,
      stems.drums && stems.drums.rms,
      blended.kick,
      blended.snare,
    ].filter((lane) => Array.isArray(lane) && lane.length === timeline.length);

    if (!candidates.length) return 120;

    const lane = candidates[0];
    const n = lane.length;
    const mean = lane.reduce((a, b) => a + (b || 0), 0) / n;
    const x = lane.map((v) => Math.max(0, (v || 0) - mean));

    let bestBpm = 120;
    let bestScore = -Infinity;
    for (let bpm = 70; bpm <= 180; bpm += 1) {
      const lag = Math.round((60 / bpm) / dt);
      if (lag < 1 || lag >= n - 2) continue;
      let score = 0;
      let count = 0;
      for (let i = lag; i < n; i++) {
        score += x[i] * x[i - lag];
        count++;
      }
      if (count) score /= count;
      if (score > bestScore) {
        bestScore = score;
        bestBpm = bpm;
      }
    }

    return Math.max(70, Math.min(180, bestBpm));
  }

  function applySignalsData(data) {
    state.timeline = data.timelineSec || [];
    state.rawGroups = (data && data.signals) || {};
    state.stems = (data.signals && data.signals.stems) || {};
    state.blended = (data.signals && data.signals.blended) || {};
    state.bands = (data.signals && data.signals.bands) || {};
    state.custom = (data.signals && data.signals.customInstruments) || {};
    state.signalLaneMap = buildSignalLaneMap();
    state.trackBpm = estimateBpmFromData(data);
    state.meterEma = {};
    state.letterLaneState = [];
    state.letterStretchTrail = [];
    resetMotionEffectState();
    idxHint = 0;
    populateSignalSelects();
    const hadLocalSettings = loadSettings(false);
    if (!hadLocalSettings) {
      void loadDefaultSettingsIfMissing(false);
    }
    state.meterDefs = buildMeterDefs();
    renderMeters();
    applyPanelCollapsedState();
  }

  async function fetchSignalsData(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  }

  function resolveAssetUrl(pathOrUrl) {
    if (!pathOrUrl || typeof pathOrUrl !== "string") return "";
    try {
      return new URL(pathOrUrl, window.location.href).toString();
    } catch (_err) {
      return pathOrUrl;
    }
  }

  async function loadTrackByIndex(nextIndex, opts = {}) {
    if (!state.playlist.length) return;
    const max = state.playlist.length - 1;
    const clamped = Math.max(0, Math.min(max, nextIndex));
    const track = state.playlist[clamped];
    if (!track || !track.audio) {
      throw new Error("Playlist track is missing audio path.");
    }

    const token = ++state.trackLoadToken;
    const shouldAutoplay = opts.autoplay !== false;
    state.loaded = false;
    statusEl.textContent = `Loading ${normalizeTrackTitle(track, clamped)} ...`;

    const audioUrl = resolveAssetUrl(track.audio);
    const trackSignalsUrl = track.signals ? resolveAssetUrl(track.signals) : "";
    const fallbackSignalsUrl = resolveAssetUrl(signalsUrl);

    let signalsStatusNote = "";
    if (trackSignalsUrl) {
      try {
        const data = await fetchSignalsData(trackSignalsUrl);
        if (token !== state.trackLoadToken) return;
        applySignalsData(data);
      } catch (_trackSignalsErr) {
        if (!state.timeline.length) {
          try {
            const fallbackData = await fetchSignalsData(fallbackSignalsUrl);
            if (token !== state.trackLoadToken) return;
            applySignalsData(fallbackData);
            signalsStatusNote = " Using fallback visuals.";
          } catch (_fallbackErr) {
            signalsStatusNote = " Visual signals unavailable.";
          }
        } else {
          signalsStatusNote = " Using previous visuals.";
        }
      }
    }

    const oldSrc = audio.currentSrc || audio.getAttribute("src") || "";
    if (oldSrc !== audioUrl && oldSrc !== track.audio) {
      audio.src = audioUrl;
      audio.load();
    } else {
      audio.currentTime = 0;
    }

    state.currentTrackIndex = clamped;
    updateTrackControls();
    state.loaded = true;

    if (shouldAutoplay) {
      try {
        await audio.play();
        playBgVideoSafely();
      } catch (_err) {
        statusEl.textContent = `Loaded ${normalizeTrackTitle(track, clamped)}. Autoplay blocked by browser.${signalsStatusNote}`;
        return;
      }
    }

    statusEl.textContent = `Loaded ${normalizeTrackTitle(track, clamped)}.${signalsStatusNote}`;
  }

  function shiftTrack(delta) {
    if (!state.playlist.length) return;
    const total = state.playlist.length;
    const current = state.currentTrackIndex >= 0 ? state.currentTrackIndex : 0;
    const next = (current + delta + total) % total;
    loadTrackByIndex(next, { autoplay: true }).catch((err) => {
      statusEl.textContent = `Failed to switch track: ${err.message}`;
      state.loaded = true;
    });
  }

  if (trackSelectEl) {
    trackSelectEl.addEventListener("change", () => {
      const parsed = Number.parseInt(trackSelectEl.value, 10);
      if (Number.isNaN(parsed)) return;
      loadTrackByIndex(parsed, { autoplay: true }).catch((err) => {
        statusEl.textContent = `Failed to switch track: ${err.message}`;
        state.loaded = true;
      });
    });
  }
  prevTrackBtn && prevTrackBtn.addEventListener("click", () => shiftTrack(-1));
  nextTrackBtn && nextTrackBtn.addEventListener("click", () => shiftTrack(1));

  const particles = Array.from({ length: 280 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8,
    r: 1 + Math.random() * 2.2,
  }));

  function drawShockwaves(s, options = {}) {
    const opacity = Math.max(0, Math.min(1, options.opacity === undefined ? 1 : options.opacity));
    const intensity = Math.max(0, Math.min(2, options.intensity === undefined ? 1 : options.intensity));
    const drawBackdrop = options.drawBackdrop !== false;
    const kick = Math.max(0, Math.min(2, Number.isFinite(s.kick) ? s.kick : 0));
    const snare = Math.max(0, Math.min(2, Number.isFinite(s.snare) ? s.snare : 0));

    if (drawBackdrop) {
      ctx.fillStyle = `rgba(9,12,24,${0.04 * opacity})`;
      ctx.fillRect(0, 0, w, h);
    }

    const cx = w * 0.5;
    const cy = h * 0.52;
    if (state.shockwaveCooldown > 0) state.shockwaveCooldown -= 1;
    const trigger = kick > 0.38 && state.prevKick <= 0.38;
    if (trigger && state.shockwaveCooldown <= 0) {
      state.shockwaves.push({ r: 12, a: (0.42 + kick * 0.2) * (0.5 + intensity * 0.5), lw: (1.8 + snare * 2.2) * (0.7 + intensity * 0.3) });
      state.shockwaveCooldown = 7;
    }
    state.prevKick = kick;

    const next = [];
    for (const sw of state.shockwaves) {
      sw.r += (4.2 + kick * 5) * (0.55 + intensity * 0.45);
      sw.a *= 0.972;
      if (sw.a < 0.02 || sw.r > Math.max(w, h) * 1.2) continue;
      next.push(sw);
      ctx.beginPath();
      ctx.arc(cx, cy, sw.r, 0, Math.PI * 2);
      ctx.lineWidth = sw.lw;
      ctx.strokeStyle = `rgba(190,220,255,${sw.a * opacity})`;
      ctx.stroke();
    }
    state.shockwaves = next;
  }

  function drawRibbons(s, options = {}) {
    const opacity = Math.max(0, Math.min(1, options.opacity === undefined ? 1 : options.opacity));
    const intensity = Math.max(0, Math.min(2, options.intensity === undefined ? 1 : options.intensity));
    const drawBackdrop = options.drawBackdrop !== false;
    const bass = Math.max(0, Math.min(2, Number.isFinite(s.bass) ? s.bass : 0));
    const melodic = Math.max(0, Math.min(2, Number.isFinite(s.melodic) ? s.melodic : 0));
    const snare = Math.max(0, Math.min(2, Number.isFinite(s.snare) ? s.snare : 0));
    const t = performance.now() * 0.001;

    if (drawBackdrop) {
      ctx.fillStyle = `rgba(10,16,28,${0.045 * opacity})`;
      ctx.fillRect(0, 0, w, h);
    }

    if (!state.ribbons.length) resetMotionEffectState();
    const maxPoints = 56;
    for (let i = 0; i < state.ribbons.length; i++) {
      const rb = state.ribbons[i];
      const yBase = h * (0.24 + (i / Math.max(1, state.ribbons.length - 1)) * 0.54);
      const x = w * 0.5 + Math.sin(t * (0.9 + bass * 0.6) + rb.phase) * (70 + bass * 120) * (0.55 + intensity * 0.45) + Math.sin(t * 2.1 + rb.phase * 1.9) * (16 + snare * 34);
      const y = yBase + Math.cos(t * (0.7 + melodic * 0.65) + rb.phase * 1.4) * (20 + melodic * 70) * (0.55 + intensity * 0.45);
      rb.points.push({ x, y });
      if (rb.points.length > maxPoints) rb.points.shift();

      if (rb.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(rb.points[0].x, rb.points[0].y);
      for (let p = 1; p < rb.points.length; p++) ctx.lineTo(rb.points[p].x, rb.points[p].y);
      ctx.strokeStyle = `rgba(${140 + i * 24},${200 + i * 8},255,${(0.12 + bass * 0.2) * opacity})`;
      ctx.lineWidth = (2.4 + snare * 2.2) * (0.7 + intensity * 0.3);
      ctx.stroke();
    }
  }

  function drawInkDiffusion(s, options = {}) {
    const opacity = Math.max(0, Math.min(1, options.opacity === undefined ? 1 : options.opacity));
    const intensity = Math.max(0, Math.min(2, options.intensity === undefined ? 1 : options.intensity));
    const drawBackdrop = options.drawBackdrop !== false;
    const melodic = Math.max(0, Math.min(2, Number.isFinite(s.melodic) ? s.melodic : 0));
    const vocal = Math.max(0, Math.min(2, Number.isFinite(s.vocal) ? s.vocal : 0));
    const bass = Math.max(0, Math.min(2, Number.isFinite(s.bass) ? s.bass : 0));

    if (drawBackdrop) {
      ctx.fillStyle = `rgba(8,14,24,${0.05 * opacity})`;
      ctx.fillRect(0, 0, w, h);
    }

    const spawnChance = Math.min(0.6, (0.03 + melodic * 0.08 + vocal * 0.05) * (0.5 + intensity * 0.5));
    if (Math.random() < spawnChance) {
      state.inkBlobs.push({
        x: w * (0.25 + Math.random() * 0.5),
        y: h * (0.22 + Math.random() * 0.56),
        r: 8 + Math.random() * 20,
        vr: (0.5 + bass * 0.9 + Math.random() * 0.8) * (0.55 + intensity * 0.45),
        a: (0.22 + melodic * 0.18) * (0.5 + intensity * 0.5),
        hueShift: Math.random() * 40,
      });
    }

    const next = [];
    for (const b of state.inkBlobs) {
      b.r += b.vr;
      b.a *= 0.986;
      if (b.a < 0.01 || b.r > Math.max(w, h) * 0.4) continue;
      next.push(b);
      const c0 = `rgba(${90 + Math.round(b.hueShift)},${160 + Math.round(vocal * 30)},${240},${b.a * opacity})`;
      const g = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, b.r);
      g.addColorStop(0, c0);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    state.inkBlobs = next;
  }

  function drawLissajous(s, options = {}) {
    const opacity = Math.max(0, Math.min(1, options.opacity === undefined ? 1 : options.opacity));
    const intensity = Math.max(0, Math.min(2, options.intensity === undefined ? 1 : options.intensity));
    const drawBackdrop = options.drawBackdrop !== false;
    const bass = Math.max(0, Math.min(2, Number.isFinite(s.bass) ? s.bass : 0));
    const snare = Math.max(0, Math.min(2, Number.isFinite(s.snare) ? s.snare : 0));
    const hat = Math.max(0, Math.min(2, Number.isFinite(s.hat) ? s.hat : 0));
    const vocal = Math.max(0, Math.min(2, Number.isFinite(s.vocal) ? s.vocal : 0));
    const melodic = Math.max(0, Math.min(2, Number.isFinite(s.melodic) ? s.melodic : 0));

    if (drawBackdrop) {
      ctx.fillStyle = `rgba(8,12,22,${0.045 * opacity})`;
      ctx.fillRect(0, 0, w, h);
    }

    const t = performance.now() * 0.001;
    const cx = w * 0.5;
    const cy = h * 0.52;
    const ax = w * (0.14 + bass * 0.12) * (0.55 + intensity * 0.45);
    const ay = h * (0.11 + melodic * 0.11) * (0.55 + intensity * 0.45);
    const a = 2 + Math.round(bass * 2);
    const b = 3 + Math.round(snare * 3);
    const delta = t * (0.6 + hat * 0.8);
    const points = 260;

    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const p = (i / points) * Math.PI * 2;
      const x = cx + Math.sin(a * p + delta) * ax;
      const y = cy + Math.sin(b * p + delta * 0.85 + vocal * 1.4) * ay;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(170,220,255,${(0.2 + melodic * 0.24) * opacity})`;
    ctx.lineWidth = (1.6 + snare * 2.2) * (0.65 + intensity * 0.35);
    ctx.stroke();
  }

  function drawConstellation(s, options = {}) {
    const opacity = Math.max(0, Math.min(1, options.opacity === undefined ? 1 : options.opacity));
    const intensity = Math.max(0, Math.min(2, options.intensity === undefined ? 1 : options.intensity));
    const drawBackdrop = options.drawBackdrop !== false;
    const kick = Math.max(0, Math.min(2, Number.isFinite(s.kick) ? s.kick : 0));
    const melodic = Math.max(0, Math.min(2, Number.isFinite(s.melodic) ? s.melodic : 0));

    if (drawBackdrop) {
      ctx.fillStyle = `rgba(9,13,24,${0.04 * opacity})`;
      ctx.fillRect(0, 0, w, h);
    }

    const linkDist = (34 + melodic * 90) * (0.6 + intensity * 0.4);
    const linkDist2 = linkDist * linkDist;
    const maxParticles = 120;
    const n = Math.min(maxParticles, particles.length);

    ctx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const p1 = particles[i];
      for (let j = i + 1; j < n; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > linkDist2) continue;
        const a = (1 - d2 / linkDist2) * (0.16 + kick * 0.22) * opacity * (0.55 + intensity * 0.45);
        ctx.strokeStyle = `rgba(180,225,255,${a})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }

  function drawScanlines(s, options = {}) {
    const opacity = Math.max(0, Math.min(1, options.opacity === undefined ? 1 : options.opacity));
    const intensity = Math.max(0, Math.min(2, options.intensity === undefined ? 1 : options.intensity));
    const drawBackdrop = options.drawBackdrop !== false;
    const snare = Math.max(0, Math.min(2, Number.isFinite(s.snare) ? s.snare : 0));
    const hat = Math.max(0, Math.min(2, Number.isFinite(s.hat) ? s.hat : 0));
    const bass = Math.max(0, Math.min(2, Number.isFinite(s.bass) ? s.bass : 0));

    if (drawBackdrop) {
      ctx.fillStyle = `rgba(7,11,22,${0.03 * opacity})`;
      ctx.fillRect(0, 0, w, h);
    }

    const t = performance.now() * 0.001;
    const spacing = Math.max(3, (10 - hat * 3) * (1.1 - intensity * 0.2));
    const jitterAmp = (8 + snare * 18) * (0.55 + intensity * 0.45);
    for (let y = 0; y < h; y += spacing) {
      const jitter = Math.sin(y * 0.06 + t * 8.4) * jitterAmp * (0.15 + snare * 0.35);
      const a = (0.02 + bass * 0.04 + hat * 0.03) * opacity;
      ctx.fillStyle = `rgba(180,215,255,${a})`;
      ctx.fillRect(jitter, y, w, 1.2);
    }
  }

  function drawVoronoiBlobs(s, options = {}) {
    const opacity = Math.max(0, Math.min(1, options.opacity === undefined ? 1 : options.opacity));
    const intensity = Math.max(0, Math.min(2, options.intensity === undefined ? 1 : options.intensity));
    const drawBackdrop = options.drawBackdrop !== false;
    const bass = Math.max(0, Math.min(2, Number.isFinite(s.bass) ? s.bass : 0));
    const melodic = Math.max(0, Math.min(2, Number.isFinite(s.melodic) ? s.melodic : 0));
    if (drawBackdrop) {
      ctx.fillStyle = `rgba(8,12,22,${0.04 * opacity})`;
      ctx.fillRect(0, 0, w, h);
    }

    const seeds = 7;
    const step = 26;
    const t = performance.now() * 0.001;
    const pts = Array.from({ length: seeds }, (_, i) => ({
      x: w * (0.15 + (i / Math.max(1, seeds - 1)) * 0.7) + Math.sin(t * (0.8 + bass * 0.5) + i * 1.6) * (22 + 38 * intensity),
      y: h * (0.2 + (((i * 37) % 100) / 100) * 0.6) + Math.cos(t * (0.75 + melodic * 0.5) + i * 1.3) * (20 + 34 * intensity),
      c: 155 + i * 12,
    }));

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        let best = 0;
        let bestD = Infinity;
        for (let i = 0; i < pts.length; i++) {
          const dx = pts[i].x - x;
          const dy = pts[i].y - y;
          const d = dx * dx + dy * dy;
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        }
        const p = pts[best];
        const a = Math.max(0.015, (0.05 + bass * 0.03) * opacity);
        ctx.fillStyle = `rgba(${p.c}, ${180 + Math.round(melodic * 30)}, 255, ${a})`;
        ctx.fillRect(x, y, step + 1, step + 1);
      }
    }
  }

  function drawFogLayers(s, options = {}) {
    const opacity = Math.max(0, Math.min(1, options.opacity === undefined ? 1 : options.opacity));
    const intensity = Math.max(0, Math.min(2, options.intensity === undefined ? 1 : options.intensity));
    const drawBackdrop = options.drawBackdrop !== false;
    const bass = Math.max(0, Math.min(2, Number.isFinite(s.bass) ? s.bass : 0));
    const vocal = Math.max(0, Math.min(2, Number.isFinite(s.vocal) ? s.vocal : 0));
    if (drawBackdrop) {
      ctx.fillStyle = `rgba(7,11,20,${0.035 * opacity})`;
      ctx.fillRect(0, 0, w, h);
    }

    const t = performance.now() * 0.001;
    for (let i = 0; i < 3; i++) {
      const px = w * (0.2 + i * 0.3) + Math.sin(t * (0.16 + i * 0.07) + i) * (90 + bass * 110 * intensity);
      const py = h * (0.35 + i * 0.2) + Math.cos(t * (0.13 + i * 0.05) + i * 1.6) * (50 + vocal * 70 * intensity);
      const pr = Math.max(w, h) * (0.28 + i * 0.06 + bass * 0.06);
      const g = ctx.createRadialGradient(px, py, 10, px, py, pr);
      g.addColorStop(0, `rgba(180,210,255,${(0.1 + bass * 0.08) * opacity})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawRefraction(s, options = {}) {
    const opacity = Math.max(0, Math.min(1, options.opacity === undefined ? 1 : options.opacity));
    const intensity = Math.max(0, Math.min(2, options.intensity === undefined ? 1 : options.intensity));
    const drawBackdrop = options.drawBackdrop !== false;
    const snare = Math.max(0, Math.min(2, Number.isFinite(s.snare) ? s.snare : 0));
    const hat = Math.max(0, Math.min(2, Number.isFinite(s.hat) ? s.hat : 0));
    if (drawBackdrop) {
      ctx.fillStyle = `rgba(8,12,20,${0.03 * opacity})`;
      ctx.fillRect(0, 0, w, h);
    }

    const t = performance.now() * 0.001;
    const bands = 18;
    const bandH = h / bands;
    for (let i = 0; i < bands; i++) {
      const y = i * bandH;
      const shift = Math.sin(t * 6 + i * 0.8) * (2 + snare * 8 * intensity);
      const a = (0.04 + hat * 0.05) * opacity;
      ctx.fillStyle = `rgba(255,80,80,${a})`;
      ctx.fillRect(shift, y, w, 1);
      ctx.fillStyle = `rgba(80,200,255,${a})`;
      ctx.fillRect(-shift, y + bandH * 0.5, w, 1);
    }
  }

  function drawKaleidoscope(s, options = {}) {
    const opacity = Math.max(0, Math.min(1, options.opacity === undefined ? 1 : options.opacity));
    const intensity = Math.max(0, Math.min(2, options.intensity === undefined ? 1 : options.intensity));
    const drawBackdrop = options.drawBackdrop !== false;
    const bass = Math.max(0, Math.min(2, Number.isFinite(s.bass) ? s.bass : 0));
    const melodic = Math.max(0, Math.min(2, Number.isFinite(s.melodic) ? s.melodic : 0));
    if (drawBackdrop) {
      ctx.fillStyle = `rgba(8,10,18,${0.04 * opacity})`;
      ctx.fillRect(0, 0, w, h);
    }

    const cx = w * 0.5;
    const cy = h * 0.52;
    const segs = Math.max(6, Math.min(16, Math.round(8 + bass * 4 * intensity)));
    const t = performance.now() * 0.001;
    for (let i = 0; i < segs; i++) {
      const a0 = (Math.PI * 2 * i) / segs + t * 0.22;
      const a1 = (Math.PI * 2 * (i + 1)) / segs + t * 0.22;
      const r = Math.min(w, h) * (0.18 + melodic * 0.42);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r);
      ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
      ctx.closePath();
      ctx.fillStyle = `rgba(${120 + i * 8}, ${170 + i * 3}, 255, ${(0.06 + bass * 0.05) * opacity})`;
      ctx.fill();
    }
  }

  function drawWaveMesh(s, options = {}) {
    const opacity = Math.max(0, Math.min(1, options.opacity === undefined ? 1 : options.opacity));
    const intensity = Math.max(0, Math.min(2, options.intensity === undefined ? 1 : options.intensity));
    const drawBackdrop = options.drawBackdrop !== false;
    const bass = Math.max(0, Math.min(2, Number.isFinite(s.bass) ? s.bass : 0));
    const hat = Math.max(0, Math.min(2, Number.isFinite(s.hat) ? s.hat : 0));
    if (drawBackdrop) {
      ctx.fillStyle = `rgba(8,11,20,${0.035 * opacity})`;
      ctx.fillRect(0, 0, w, h);
    }

    const cols = 16;
    const rows = 10;
    const t = performance.now() * 0.001;
    ctx.strokeStyle = `rgba(170,210,255,${(0.12 + bass * 0.08) * opacity})`;
    ctx.lineWidth = 1;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        const x = (c / cols) * w;
        const y0 = (r / rows) * h;
        const y = y0 + Math.sin(c * 0.6 + t * (1.8 + hat * 1.5)) * (6 + bass * 18 * intensity);
        if (c === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function drawCaustics(s, options = {}) {
    const opacity = Math.max(0, Math.min(1, options.opacity === undefined ? 1 : options.opacity));
    const intensity = Math.max(0, Math.min(2, options.intensity === undefined ? 1 : options.intensity));
    const drawBackdrop = options.drawBackdrop !== false;
    const melodic = Math.max(0, Math.min(2, Number.isFinite(s.melodic) ? s.melodic : 0));
    const vocal = Math.max(0, Math.min(2, Number.isFinite(s.vocal) ? s.vocal : 0));
    if (drawBackdrop) {
      ctx.fillStyle = `rgba(8,12,20,${0.03 * opacity})`;
      ctx.fillRect(0, 0, w, h);
    }

    const t = performance.now() * 0.001;
    const spots = 14;
    for (let i = 0; i < spots; i++) {
      const x = (i / spots) * w + Math.sin(t * 0.9 + i * 1.9) * (30 + melodic * 40 * intensity);
      const y = h * (0.2 + ((i * 37) % 100) / 100 * 0.6) + Math.cos(t * 1.1 + i * 1.3) * (18 + vocal * 32 * intensity);
      const r = 30 + Math.sin(t * 1.7 + i) * 12 + melodic * 22;
      const g = ctx.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, `rgba(210,235,255,${(0.12 + melodic * 0.08) * opacity})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawMotionEffect(s, options = {}) {
    const effectIntensity = Math.max(0, Math.min(2, parseFloat(flowEffectIntensityEl && flowEffectIntensityEl.value) || 1));
    const effectOptions = { ...options, intensity: effectIntensity };
    const effect = (flowEffectEl && flowEffectEl.value) || "flow";
    if (effect === "shockwaves") drawShockwaves(s, effectOptions);
    else if (effect === "ribbons") drawRibbons(s, effectOptions);
    else if (effect === "ink") drawInkDiffusion(s, effectOptions);
    else if (effect === "lissajous") drawLissajous(s, effectOptions);
    else if (effect === "constellation") drawConstellation(s, effectOptions);
    else if (effect === "scanlines") drawScanlines(s, effectOptions);
    else if (effect === "voronoi") drawVoronoiBlobs(s, effectOptions);
    else if (effect === "fog") drawFogLayers(s, effectOptions);
    else if (effect === "refraction") drawRefraction(s, effectOptions);
    else if (effect === "kaleidoscope") drawKaleidoscope(s, effectOptions);
    else if (effect === "mesh") drawWaveMesh(s, effectOptions);
    else if (effect === "caustics") drawCaustics(s, effectOptions);
    else drawFlow(s, effectOptions);
  }

  function drawNeon(s) {
    const { kick, snare, hat, bass, vocal } = s;
    const k = kick;
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.55, 40, w * 0.5, h * 0.55, h * 0.75);
    grad.addColorStop(0, `rgba(255,140,66,${0.12 + bass * 0.24})`);
    grad.addColorStop(1, `rgba(14,26,46,${0.22})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 7; i++) {
      const r = (i + 1) * (60 + vocal * 30) + k * 180;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.54, r, 0, Math.PI * 2);
      ctx.lineWidth = 1 + i * 0.4;
      ctx.strokeStyle = `rgba(81,184,255,${0.05 + hat * 0.12})`;
      ctx.stroke();
    }

    const bars = 42;
    for (let i = 0; i < bars; i++) {
      const x = (i / bars) * w;
      const val = Math.sin(i * 0.35 + performance.now() * 0.002) * 0.4 + 0.6;
      const y0 = h * 0.83;
      const bh = (8 + 90 * (val * snare + hat * 0.6)) * (0.6 + bass * 0.8);
      ctx.fillStyle = `rgba(255,240,220,${0.08 + snare * 0.22})`;
      ctx.fillRect(x, y0 - bh, Math.max(2, w / bars - 2), bh);
    }
  }

  function drawLetters(s) {
    const { kick, snare, hat, bass, vocal } = s;
    const tNow = performance.now() * 0.001;
    const energy = Math.min(1.6, (kick + snare + hat + bass + vocal) / 2.4);

    // Light haze so psychedelic layers build over time without losing clarity.
    ctx.fillStyle = `rgba(8,15,28,${0.1 + Math.min(0.12, energy * 0.08)})`;
    ctx.fillRect(0, 0, w, h);

    const text = (wordEl.value || "MOD").toUpperCase().slice(0, 24);
    const chars = [...text];
    const textSize = parseFloat(textSizeEl && textSizeEl.value) || 1;
    const baseSize = Math.max(36, Math.min(360, w * 0.09 * textSize));
    const fontKey = (textFontEl && textFontEl.value) || "bebas";
    const fontFamily = FONT_FAMILIES[fontKey] || FONT_FAMILIES.bebas;
    ctx.font = `700 ${baseSize}px ${fontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const widths = chars.map((c) => ctx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + Math.max(0, chars.length - 1) * 8;
    const textX = parseFloat(textXEl && textXEl.value) || 0;
    const textY = parseFloat(textYEl && textYEl.value) || 52;
    let x = (w - total) * 0.5 + (textX / 100) * w;
    const y = getResponsiveTextY(textY, baseSize);
    const ghostSize = parseFloat(ghostSizeEl && ghostSizeEl.value) || 1;
    const palette = getEffectiveTintPalette();
    const ghostColor = palette.ghostColor;
    const ghostRgb = hexToRgb(ghostColor);
    const ghostDecaySec = parseFloat(ghostDecayEl && ghostDecayEl.value) || 0.45;
    const ghostOpacity = parseFloat(ghostOpacityEl && ghostOpacityEl.value) || 1;
    const glowOpacity = parseFloat(glowOpacityEl && glowOpacityEl.value) || 1;
    const ghostFill = !!(ghostFillEl && ghostFillEl.checked);
    const textColor = (textColorEl && textColorEl.value) || "#ffffff";
    const outlineEnabled = !!(outlineEnableEl && outlineEnableEl.checked);
    const outlineColor = (outlineColorEl && outlineColorEl.value) || "#ffffff";
    const outlineThickness = parseFloat(outlineThicknessEl && outlineThicknessEl.value) || 0;
    const decayFrames = Math.max(8, Math.min(180, Math.round(ghostDecaySec * 60)));
    const drawStep = Math.max(1, Math.floor(decayFrames / 22));
    const bandSpread = parseFloat(bandSpreadEl && bandSpreadEl.value) || 0.45;

    // Draw a subtle translucent bar behind the text and in front of the video.
    const barH = Math.max(44, baseSize * 1.25);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(0, y - barH * 0.5, w, barH);
    ctx.restore();

    if (state.letterLaneState.length !== chars.length) {
      state.letterLaneState = Array(chars.length).fill(0);
    }
    if (state.letterStretchTrail.length !== chars.length) {
      state.letterStretchTrail = Array.from({ length: chars.length }, () => Array(decayFrames).fill(1));
    }

    for (let i = 0; i < chars.length; i++) {
      const t = chars.length <= 1 ? 0.5 : i / (chars.length - 1);
      const wL0 = Math.max(0, 1 - Math.abs(t - 0) / bandSpread);
      const wM0 = Math.max(0, 1 - Math.abs(t - 0.5) / bandSpread);
      const wR0 = Math.max(0, 1 - Math.abs(t - 1) / bandSpread);
      const wSum = Math.max(1e-6, wL0 + wM0 + wR0);
      const wL = wL0 / wSum;
      const wM = wM0 / wSum;
      const wR = wR0 / wSum;

      const laneRaw = bass * wL + snare * wM + hat * wR;
      const lane = state.letterLaneState[i] * 0.82 + laneRaw * 0.18;
      state.letterLaneState[i] = lane;

      // Original behavior used blended lanes with straightforward vertical stretch.
      const sy = 1 + lane * (0.45 + kick * 0.6);
      const sx = 1;
      const glow = (0.22 + vocal * 0.36) * glowOpacity;

      const trail = state.letterStretchTrail[i];
      if (trail.length < decayFrames) {
        while (trail.length < decayFrames) trail.push(trail[trail.length - 1] || 1);
      }
      trail.unshift(sy);
      trail.length = decayFrames;
      const vel = trail[0] - trail[1];

      ctx.save();
      ctx.translate(x + widths[i] * 0.5, y);
      // White afterimage echoes from delayed stretch states.
      for (let g = trail.length - 1; g >= 1; g -= drawStep) {
        const ghostSy = trail[g];
        const ghostAge = 1 - g / trail.length;
        const ghostAlpha = (0.12 + lane * 0.16) * Math.pow(Math.max(0, ghostAge), 0.45) * ghostOpacity;
        const ghostX = -vel * g * 18 * ghostSize;
        const ghostY = g * 1.6 * ghostSize;
        const ghostScale = ghostSize >= 1 ? 1 + (ghostSize - 1) * 0.7 : ghostSize;
        ctx.save();
        ctx.translate(ghostX, ghostY);
        ctx.scale(sx * ghostScale, ghostSy * ghostScale);
        ctx.strokeStyle = `rgba(${ghostRgb.r}, ${ghostRgb.g}, ${ghostRgb.b}, ${ghostAlpha})`;
        ctx.lineWidth = (2 + snare * 2.4) * ghostSize;
        ctx.strokeText(chars[i], -widths[i] * 0.5, 0);
        if (ghostFill) {
          ctx.fillStyle = `rgba(${ghostRgb.r}, ${ghostRgb.g}, ${ghostRgb.b}, ${ghostAlpha * 0.6})`;
          ctx.fillText(chars[i], -widths[i] * 0.5, 0);
        }
        ctx.restore();
      }

      ctx.scale(sx, sy);
      if (outlineEnabled && outlineThickness > 0) {
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = outlineThickness;
        ctx.shadowBlur = 0;
        ctx.shadowColor = "rgba(0,0,0,0)";
        ctx.strokeText(chars[i], -widths[i] * 0.5, 0);
      }

      if (glowEnabled) {
        ctx.strokeStyle = `rgba(255,255,255,${glow})`;
        ctx.lineWidth = 3 + snare * 4.2;
        ctx.shadowBlur = 10 + lane * 24;
        ctx.shadowColor = `rgba(255,255,255,${0.24 + lane * 0.32})`;
        ctx.strokeText(chars[i], -widths[i] * 0.5, 0);
      }

      ctx.fillStyle = textColor;
      ctx.fillText(chars[i], -widths[i] * 0.5, 0);
      ctx.restore();

      // Soft white halo behind each letter.
      ctx.save();
      const haloR = 14 + lane * 54 + kick * 18;
      const halo = ctx.createRadialGradient(
        x + widths[i] * 0.5,
        y,
        1,
        x + widths[i] * 0.5,
        y,
        haloR
      );
      halo.addColorStop(0, `rgba(255,255,255,${glowEnabled ? (0.12 + lane * 0.12) * glowOpacity : 0})`);
      halo.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x + widths[i] * 0.5, y, haloR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      x += widths[i] + 8;
    }
  }

  function getResponsiveTextY(textYPercent, baseSize) {
    const yPct = Math.max(0, Math.min(100, Number.isFinite(textYPercent) ? textYPercent : 52));
    const isMobile = w <= 720;
    if (!isMobile) return h * (yPct / 100);

    const trackBarHeight = trackBarEl ? trackBarEl.getBoundingClientRect().height : 52;
    const topBound = Math.max(baseSize * 0.72, h * 0.2);
    const bottomPadding = trackBarHeight + Math.max(18, h * 0.06);
    const bottomBound = Math.max(topBound + 12, h - bottomPadding);

    return topBound + (bottomBound - topBound) * (yPct / 100);
  }

  function drawFlow(s, options = {}) {
    const opacity = Math.max(0, Math.min(1, options.opacity === undefined ? 1 : options.opacity));
    const drawBackdrop = options.drawBackdrop !== false;
    const shape = (flowShapeEl && flowShapeEl.value) || "dot";
    const kick = Math.max(0, Math.min(2, Number.isFinite(s.kick) ? s.kick : 0));
    const snare = Math.max(0, Math.min(2, Number.isFinite(s.snare) ? s.snare : 0));
    const hat = Math.max(0, Math.min(2, Number.isFinite(s.hat) ? s.hat : 0));
    const bass = Math.max(0, Math.min(2, Number.isFinite(s.bass) ? s.bass : 0));
    const vocal = Math.max(0, Math.min(2, Number.isFinite(s.vocal) ? s.vocal : 0));
    const melodic = Math.max(0, Math.min(2, Number.isFinite(s.melodic) ? s.melodic : 0));
    if (drawBackdrop) {
      ctx.fillStyle = `rgba(7,12,24,${0.06 * opacity})`;
      ctx.fillRect(0, 0, w, h);
    }

    const cx = w * (0.5 + (vocal - 0.5) * 0.08);
    const cy = h * 0.52;

    for (const p of particles) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.vx) || !Number.isFinite(p.vy)) {
        const a = Math.random() * Math.PI * 2;
        const burst = 0.15 + bass * 0.25;
        p.x = cx + (Math.random() - 0.5) * 20;
        p.y = cy + (Math.random() - 0.5) * 20;
        p.vx = Math.cos(a) * burst;
        p.vy = Math.sin(a) * burst;
      }

      const dx = p.x - cx;
      const dy = p.y - cy;
      const d = Math.max(12, Math.hypot(dx, dy));
      const inv = 1 / d;
      const nx = dx * inv;
      const ny = dy * inv;
      const now = performance.now() * 0.001;

      // Outward radial flow from center with subtle turbulence.
      const radial = 0.2 + bass * 0.8 + kick * 0.45;
      const pulse = 0.75 + 0.25 * Math.sin(now * 4.5 + d * 0.025 + vocal * 2.4);
      const turbulence = 0.06 + hat * 0.16;
      const fx = nx * radial * pulse + Math.sin((p.y + now * 120) * 0.03) * turbulence;
      const fy = ny * radial * pulse + Math.cos((p.x - now * 100) * 0.03) * turbulence;

      p.vx = p.vx * 0.9 + fx * 0.2;
      p.vy = p.vy * 0.9 + fy * 0.2;
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -28 || p.x > w + 28 || p.y < -28 || p.y > h + 28) {
        const a = Math.random() * Math.PI * 2;
        const burst = 0.18 + bass * 0.3;
        p.x = cx + (Math.random() - 0.5) * 24;
        p.y = cy + (Math.random() - 0.5) * 24;
        p.vx = Math.cos(a) * burst;
        p.vy = Math.sin(a) * burst;
      }

      const radius = Math.max(0.4, p.r + melodic * 2.6);
      const alpha = Math.max(0.02, Math.min(1, (0.08 + kick * 0.35) * opacity));
      const r = 255;
      const g = 180 + Math.round(vocal * 60);
      const b = 140 + Math.round(hat * 80);
      const color = `rgba(${r},${g},${b},${alpha})`;

      if (shape === "flower") {
        const petals = 5;
        const petalR = radius * 0.6;
        const ring = radius * 0.95;
        ctx.fillStyle = color;
        for (let i = 0; i < petals; i++) {
          const a = (Math.PI * 2 * i) / petals + performance.now() * 0.0006;
          const px = p.x + Math.cos(a) * ring;
          const py = p.y + Math.sin(a) * ring;
          ctx.beginPath();
          ctx.arc(px, py, petalR, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.52, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,245,200,${Math.min(1, alpha + 0.1)})`;
        ctx.fill();
      } else if (shape === "diamond") {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - radius);
        ctx.lineTo(p.x + radius, p.y);
        ctx.lineTo(p.x, p.y + radius);
        ctx.lineTo(p.x - radius, p.y);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
  }

  function drawLavaBorders(s, t, signalDrive = 0) {
    const borderWidth = parseFloat(borderWidthEl && borderWidthEl.value) || 1;
    const borderGain = Math.max(0, parseFloat(borderGainEl && borderGainEl.value) || 0);
    const borderOpacity = Math.max(0, parseFloat(borderOpacityEl && borderOpacityEl.value) || 0);
    const palette = getEffectiveTintPalette();
    const tint = hexToRgb(palette.borderTint || "#51b8ff");
    const accent = {
      r: Math.min(255, Math.round(tint.r * 0.8 + 40)),
      g: Math.min(255, Math.round(tint.g * 0.8 + 40)),
      b: Math.min(255, Math.round(tint.b * 0.8 + 40)),
    };

    const rawDrive = Math.max(0, Math.min(2.4, signalDrive * borderGain));
    const drive = Math.max(0, Math.min(1, rawDrive));

    const bpm = Math.max(60, Math.min(200, state.trackBpm || 120));
    const freqDiv = Math.max(1, Number.parseFloat(borderFreqDivEl && borderFreqDivEl.value) || 2);
    const beatHz = bpm / (60 * freqDiv);
    const time = audio.currentTime || performance.now() * 0.001;
    const cycles = 2.4;
    const k = (Math.PI * 2 * cycles) / Math.max(1, h);

    const borderW = Math.max(24, Math.min(320, w * 0.1 * borderWidth));
    const amp = (8 + 52 * drive) * (0.45 + 0.55 * borderWidth);
    const step = 12;

    function drawSide(side) {
      const dir = side === "left" ? 1 : -1;
      const xBase = side === "left" ? 0 : w;

      ctx.save();
      if (side === "left") {
        ctx.beginPath();
        ctx.rect(0, 0, borderW + 30, h);
      } else {
        ctx.beginPath();
        ctx.rect(w - borderW - 30, 0, borderW + 30, h);
      }
      ctx.clip();

      const alphaMain = (0.16 + drive * 0.18) * borderOpacity;
      const grad = ctx.createLinearGradient(
        side === "left" ? 0 : w,
        0,
        side === "left" ? borderW + 26 : w - borderW - 26,
        h
      );
      grad.addColorStop(0, `rgba(${tint.r}, ${tint.g}, ${tint.b}, ${alphaMain + 0.1})`);
      grad.addColorStop(0.55, `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${alphaMain * 0.9})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.beginPath();
      ctx.moveTo(xBase, 0);
      for (let y = 0; y <= h; y += step) {
        const wave = Math.sin(k * y + time * beatHz * Math.PI * 2);
        const harmonic = Math.sin(k * y * 0.55 - time * beatHz * Math.PI) * 0.35;
        const x = xBase + dir * (borderW * 0.58 + (wave + harmonic) * amp);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(xBase, h);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Add a subtle highlight crest that moves at beat rate.
      ctx.beginPath();
      for (let y = 0; y <= h; y += step) {
        const wave = Math.sin(k * y + time * beatHz * Math.PI * 2);
        const harmonic = Math.sin(k * y * 0.55 - time * beatHz * Math.PI) * 0.35;
        const x = xBase + dir * (borderW * 0.58 + (wave + harmonic) * amp * 0.92);
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${0.2 * borderOpacity})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    drawSide("left");
    drawSide("right");
  }

  function drawInstruments(t, intensity) {
    const drumsLane = getStemLane("drums");
    const bassLane = getStemLane("bass");
    const otherLane = getStemLane("other");

    const drums = sampleLane(t, drumsLane) * intensity;
    const bass = sampleLane(t, bassLane) * intensity;
    const other = sampleLane(t, otherLane) * intensity;

    ctx.fillStyle = "rgba(9,14,25,0.2)";
    ctx.fillRect(0, 0, w, h);

    const lanes = [
      { name: "DRUMS", value: drums, colorA: "rgba(81,184,255,", colorB: "rgba(150,220,255," },
      { name: "BASS", value: bass, colorA: "rgba(255,166,84,", colorB: "rgba(255,215,160," },
      { name: "OTHER", value: other, colorA: "rgba(255,222,102,", colorB: "rgba(255,245,200," },
    ];

    const laneH = h / 3;
    for (let i = 0; i < lanes.length; i++) {
      const lane = lanes[i];
      const y0 = i * laneH;
      const centerY = y0 + laneH * 0.5;

      ctx.fillStyle = `${lane.colorA}${0.05 + lane.value * 0.08})`;
      ctx.fillRect(0, y0, w, laneH);

      const bars = 48;
      for (let b = 0; b < bars; b++) {
        const x = (b / bars) * w;
        const wobble = 0.55 + 0.45 * Math.sin(b * 0.38 + performance.now() * 0.002 + i);
        const bh = (6 + lane.value * laneH * 0.55) * wobble;
        ctx.fillStyle = `${lane.colorB}${0.16 + lane.value * 0.35})`;
        ctx.fillRect(x, centerY - bh * 0.5, Math.max(2, w / bars - 2), bh);
      }

      // sweeping glow arc per lane
      const sweep = ((performance.now() * 0.00018 + i * 0.22) % 1) * w;
      const rad = 28 + lane.value * 140;
      const g = ctx.createRadialGradient(sweep, centerY, 2, sweep, centerY, rad);
      g.addColorStop(0, `${lane.colorB}${0.16 + lane.value * 0.28})`);
      g.addColorStop(1, `${lane.colorA}0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sweep, centerY, rad, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(234,243,255,0.86)";
      ctx.font = "600 13px Space Grotesk, Trebuchet MS, sans-serif";
      ctx.fillText(`${lane.name} ${lane.value.toFixed(2)}`, 12, y0 + 22);
    }

    if (!drumsLane.length && !bassLane.length && !otherLane.length) {
      ctx.fillStyle = "rgba(255,220,190,0.95)";
      ctx.font = "700 20px Space Grotesk, Trebuchet MS, sans-serif";
      ctx.fillText("No stem lanes in signals.json", 18, h * 0.48);
      ctx.font = "500 14px Space Grotesk, Trebuchet MS, sans-serif";
      ctx.fillStyle = "rgba(255,235,220,0.8)";
      ctx.fillText("Run pipeline with Demucs stems enabled.", 18, h * 0.48 + 28);
    }
  }

  function formatMeterName(group, key, subkey = "") {
    if (group === "customInstruments") return key;
    if (subkey) return `${group}:${key}.${subkey}`;
    return `${group}:${key}`;
  }

  function buildMeterDefs() {
    const defs = [];
    const preferredOrder = [
      "stems",
      "customInstruments",
      "blended",
      "proxies",
      "bands",
      "global",
    ];
    const seen = new Set();

    for (const groupName of preferredOrder) {
      const group = state.rawGroups[groupName];
      if (!group || typeof group !== "object") continue;

      for (const [key, lane] of Object.entries(group)) {
        if (Array.isArray(lane) && lane.length) {
          const id = `${groupName}:${key}`;
          if (seen.has(id)) continue;
          seen.add(id);
          defs.push({ id, group: groupName, key, lane, label: formatMeterName(groupName, key) });
          continue;
        }

        if (lane && typeof lane === "object") {
          for (const [subkey, sublane] of Object.entries(lane)) {
            if (!Array.isArray(sublane) || !sublane.length) continue;
            const id = `${groupName}:${key}.${subkey}`;
            if (seen.has(id)) continue;
            seen.add(id);
            defs.push({
              id,
              group: groupName,
              key,
              subkey,
              lane: sublane,
              label: formatMeterName(groupName, key, subkey),
            });
          }
        }
      }
    }

    return defs.slice(0, 24);
  }

  function renderMeters() {
    if (!metersEl) return;
    metersEl.innerHTML = "";

    if (!state.meterDefs.length) {
      const empty = document.createElement("div");
      empty.className = "small";
      empty.textContent = "No raw lanes found for meters.";
      metersEl.appendChild(empty);
      return;
    }

    for (const def of state.meterDefs) {
      const row = document.createElement("div");
      row.className = "meter";

      const name = document.createElement("div");
      name.className = "meter-name";
      name.textContent = def.label;

      const track = document.createElement("div");
      track.className = "meter-track";
      const fill = document.createElement("div");
      fill.className = "meter-fill";
      track.appendChild(fill);

      const value = document.createElement("div");
      value.className = "meter-value";
      value.textContent = "0.00";

      row.appendChild(name);
      row.appendChild(track);
      row.appendChild(value);
      metersEl.appendChild(row);

      def.fillEl = fill;
      def.valueEl = value;
      state.meterEma[def.id] = 0;
    }
  }

  function updateMeters(t) {
    for (const def of state.meterDefs) {
      const raw = Math.max(0, sampleLane(t, def.lane));
      const prev = state.meterEma[def.id] || 0;
      const smooth = prev * 0.82 + raw * 0.18;
      state.meterEma[def.id] = smooth;

      const clamped = Math.max(0, Math.min(1, smooth));
      if (def.fillEl) def.fillEl.style.transform = `scaleX(${clamped})`;
      if (def.valueEl) def.valueEl.textContent = smooth.toFixed(2);
    }
  }

  function drawVideoBackground() {
    if (!bgVideo || !bgVideo.src || bgVideo.readyState < 2) return false;
    const vw = bgVideo.videoWidth || 0;
    const vh = bgVideo.videoHeight || 0;
    if (!vw || !vh) return false;

    const scale = Math.max(w / vw, h / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    const dx = (w - dw) * 0.5;
    const dy = (h - dh) * 0.5;

    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.drawImage(bgVideo, dx, dy, dw, dh);
    ctx.restore();
    return true;
  }

  function drawGlobalVideoTint() {
    const opacity = Math.max(0, Math.min(1, parseFloat(globalTintOpacityEl && globalTintOpacityEl.value) || 0));
    if (opacity <= 0) return;
    const palette = getEffectiveTintPalette();
    const tint = hexToRgb(palette.globalTintColor || "#000000");
    ctx.save();
    ctx.fillStyle = `rgba(${tint.r}, ${tint.g}, ${tint.b}, ${opacity})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!state.loaded) return;

    ctx.clearRect(0, 0, w, h);
    drawVideoBackground();
    drawGlobalVideoTint();

    const t = audio.currentTime || 0;
    const intensity = parseFloat(intensityEl.value) || 1;

    const drumsStemLane = getStemLane("drums");
    const bassStemLane = getStemLane("bass");
    const otherStemLane = getStemLane("other");

    const drumsLane = drumsStemLane.length ? drumsStemLane : (state.blended.kick || state.blended.snare || []);
    const bassLane = bassStemLane.length ? bassStemLane : (state.blended.bass || []);
    const otherLane = otherStemLane.length ? otherStemLane : (state.blended.melodic || state.blended.vocal || []);

    const drumsStem = sampleLane(t, drumsLane) * intensity;
    const bassStem = sampleLane(t, bassLane) * intensity;
    const otherStem = sampleLane(t, otherLane) * intensity;

    const sStem = {
      // Stem-first routing: drums/bass/other are the primary drivers.
      kick: drumsStem,
      snare: drumsStem * 0.45 + otherStem * 0.55,
      hat: otherStem,
      bass: bassStem,
      vocal: otherStem,
      melodic: otherStem * 0.8 + bassStem * 0.2,
    };

    const leftLane = (leftSignalEl && state.signalLaneMap[leftSignalEl.value]) || state.blended.bass || [];
    const midLane = (midSignalEl && state.signalLaneMap[midSignalEl.value]) || state.blended.snare || [];
    const rightLane = (rightSignalEl && state.signalLaneMap[rightSignalEl.value]) || state.blended.hat || [];
    const borderLane = (borderSignalEl && state.signalLaneMap[borderSignalEl.value]) || state.blended.melodic || [];
    const leftGain = parseFloat(leftGainEl && leftGainEl.value) || 1;
    const midGain = parseFloat(midGainEl && midGainEl.value) || 1;
    const rightGain = parseFloat(rightGainEl && rightGainEl.value) || 1;
    const borderDrive = sampleLane(t, borderLane) * intensity;

    // Stretch Type uses selectable left/mid/right lanes.
    const sLetters = {
      kick: sampleLane(t, state.blended.kick) * intensity,
      snare: sampleLane(t, midLane) * intensity * midGain,
      hat: sampleLane(t, rightLane) * intensity * rightGain,
      bass: sampleLane(t, leftLane) * intensity * leftGain,
      vocal: sampleLane(t, state.blended.vocal) * intensity,
      melodic: sampleLane(t, state.blended.melodic) * intensity,
    };

    if (mode === "letters") {
      drawLetters(sLetters);
      const flowOverlayEnabled = !!(flowOverlayEnableEl && flowOverlayEnableEl.checked);
      if (flowOverlayEnabled) {
        const flowOverlayOpacity = Math.max(0, Math.min(1, parseFloat(flowOverlayOpacityEl && flowOverlayOpacityEl.value) || 0));
        drawMotionEffect(sStem, { opacity: flowOverlayOpacity, drawBackdrop: false });
      }
      drawLavaBorders(sLetters, t, borderDrive);
    } else {
      drawMotionEffect(sStem, { opacity: 1, drawBackdrop: true });
      drawLavaBorders(sStem, t, borderDrive);
    }

    updateMeters(t);
  }

  fetch(playlistUrl)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((manifest) => {
      const tracks = Array.isArray(manifest && manifest.tracks) ? manifest.tracks : [];
      if (!tracks.length) throw new Error("playlist has no tracks");
      state.playlist = tracks;
      populateTrackSelect();
      updateTrackControls();
      return loadTrackByIndex(0, { autoplay: true });
    })
    .catch((_playlistErr) => {
      return fetchSignalsData(signalsUrl)
        .then((data) => {
          state.playlist = [];
          state.currentTrackIndex = -1;
          updateTrackControls();
          applySignalsData(data);
          state.loaded = true;
          statusEl.textContent = "Playlist unavailable. Loaded single-track signals fallback.";
          audio.play().catch(() => {
            statusEl.textContent = "Playlist unavailable. Loaded single-track signals fallback. Autoplay blocked by browser.";
          });
        })
        .catch((err) => {
          statusEl.textContent = `Failed to load signals: ${err.message}`;
        });
    });

  frame();
})();
