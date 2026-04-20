import { detectMudra } from "./mudras.js";

const MUDRA_AUDIO = {
  "Patāka":       new Audio("./audio/Patāka.mp3"),
  "Tripatāka":    new Audio("./audio/Tripatāka.mp3"),
  "Ardhapatāka":  new Audio("./audio/Ardhapatāka.mp3"),
  "Chandrakalā":  new Audio("./audio/Chandrakalā.mp3"),
  "Alāpadma":     new Audio("./audio/Alāpadma.mp3"),
  "Muṣṭi":        new Audio("./audio/Muṣṭi.mp3"),
  "Katakamukha":  new Audio("./audio/Katakamukha.mp3"),
  "Mayūra":       new Audio("./audio/Mayūra.mp3"),
  "Suchi":        new Audio("./audio/suchi.mp3"),
};

const STABLE_FRAMES_REQUIRED = 8;

let stableCandidate = null;   // mudra name currently accumulating frames
let stableFrameCount = 0;     // consecutive frames seen for stableCandidate
let confirmedMudra = null;    // last mudra that passed the threshold (audio played)
let currentAudio = null;      // Audio node currently playing

function stopCurrentAudio() {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = null;
}

function stabilizeAndPlay(rawName) {
  if (rawName !== stableCandidate) {
    // New candidate — reset counter
    stableCandidate = rawName;
    stableFrameCount = 1;
    return;
  }

  stableFrameCount++;

  if (stableFrameCount < STABLE_FRAMES_REQUIRED) return;
  if (rawName === confirmedMudra) return; // already played for this hold

  confirmedMudra = rawName;
  if (!audioEnabled) return;
  stopCurrentAudio();

  const audio = MUDRA_AUDIO[rawName];
  if (!audio) return;
  audio.currentTime = 0;
  currentAudio = audio;
  audio.play().catch(() => {});
}

const videoElement = document.querySelector(".input-video");
const canvasElement = document.querySelector(".output-canvas");
const canvasCtx = canvasElement.getContext("2d");
const mudraNameEl = document.getElementById("mudraName");
const mudraEmojiEl = document.getElementById("mudraEmoji");
const mudraMeaningEl = document.getElementById("mudraMeaning");
const handTagEl = document.getElementById("handTag");
const audioToggleEl = document.getElementById("audioToggle");

let audioEnabled = true;

// Render Lucide icons once the UMD script has loaded.
if (window.lucide) window.lucide.createIcons();

audioToggleEl.addEventListener("click", () => {
  audioEnabled = !audioEnabled;
  if (!audioEnabled) stopCurrentAudio();

  const iconEl = document.getElementById("audioIcon");
  iconEl.setAttribute("data-lucide", audioEnabled ? "volume-2" : "volume-x");
  window.lucide.createIcons();
});

const UNKNOWN_TEXT = {
  name: "unknown",
  emoji: "🫱",
  meaning: "align your hand in view to begin detection.",
};

let frameWidth = 1920;
let frameHeight = 1080;
const TARGET_WIDTH = 1920;
const TARGET_HEIGHT = 1080;

videoElement.style.filter = "contrast(1.05) saturate(1.1)";

function resizeCanvas(width, height) {
  frameWidth = width;
  frameHeight = height;
  canvasElement.width = width;
  canvasElement.height = height;
}

function updateChip(detection) {
  if (!detection) {
    mudraNameEl.textContent = UNKNOWN_TEXT.name;
    mudraEmojiEl.textContent = UNKNOWN_TEXT.emoji;
    mudraMeaningEl.textContent = UNKNOWN_TEXT.meaning;
    stableCandidate = null;
    stableFrameCount = 0;
    confirmedMudra = null;
    stopCurrentAudio();
    return;
  }

  stabilizeAndPlay(detection.name);
  mudraNameEl.textContent = detection.name;
  mudraEmojiEl.textContent = detection.emoji ?? "🫱";
  mudraMeaningEl.textContent = detection.meaning;
}

function updateHandTag(detection, handLandmarks) {
  if (!detection || !handLandmarks?.length) {
    handTagEl.style.opacity = "0";
    handTagEl.style.left = "-9999px";
    handTagEl.style.top = "-9999px";
    return;
  }

  const wrist = handLandmarks[0];
  const minY = Math.min(...handLandmarks.map((point) => point.y));
  const mirroredX = (1 - wrist.x) * canvasElement.clientWidth;
  const topY = minY * canvasElement.clientHeight;

  handTagEl.textContent = detection.name;
  handTagEl.style.left = `${mirroredX}px`;
  handTagEl.style.top = `${Math.max(26, topY - 14)}px`;
  handTagEl.style.opacity = "1";
}

async function enforceHdVideoTrack() {
  const stream = videoElement.srcObject;
  if (!(stream instanceof MediaStream)) {
    return;
  }

  const [track] = stream.getVideoTracks();
  if (!track) {
    return;
  }

  // Ask for HD explicitly so browsers don't default to low-res streams.
  await track.applyConstraints({
    width: { ideal: 1920, min: 1280 },
    height: { ideal: 1080, min: 720 },
    frameRate: { ideal: 60, min: 30 },
    facingMode: "user",
    aspectRatio: { ideal: 1920 / 1080 },
  });

  const settings = track.getSettings();
  if (settings.width && settings.height) {
    resizeCanvas(settings.width, settings.height);
  }
}

function onResults(results) {
  if (results.image.width && results.image.height) {
    if (results.image.width !== frameWidth || results.image.height !== frameHeight) {
      resizeCanvas(results.image.width, results.image.height);
    }
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  let detection = null;
  let handLandmarks = null;

  if (results.multiHandLandmarks?.length) {
    handLandmarks = results.multiHandLandmarks[0];
    detection = detectMudra(handLandmarks);

    drawConnectors(canvasCtx, handLandmarks, HAND_CONNECTIONS, {
      color: "rgba(236, 244, 255, 0.36)",
      lineWidth: 2.5,
    });
    drawLandmarks(canvasCtx, handLandmarks, {
      color: "rgba(243, 248, 255, 0.5)",
      lineWidth: 1,
      radius: 2.7,
    });
  }

  updateChip(detection);
  updateHandTag(detection, handLandmarks);
  canvasCtx.restore();
}

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.55,
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: TARGET_WIDTH,
  height: TARGET_HEIGHT,
  facingMode: "user",
});

camera
  .start()
  .then(enforceHdVideoTrack)
  .catch((err) => {
    mudraNameEl.textContent = "camera unavailable";
    mudraEmojiEl.textContent = "⚠️";
    mudraMeaningEl.textContent = `could not start webcam: ${err?.message ?? "unknown error"}`;
  });
