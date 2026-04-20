const FINGER_JOINTS = {
  thumb: [4, 3, 2],
  index: [8, 6, 5],
  middle: [12, 10, 9],
  ring: [16, 14, 13],
  pinky: [20, 18, 17],
};

export const MUDRA_DETAILS = {
  "Patāka": {
    meaning: "flag gesture; often used for clouds, forest, river, blessing, and denial.",
    emoji: "✋",
  },
  "Tripatāka": {
    meaning: "three-part flag; used for crown, tree, lightning, and flames.",
    emoji: "👑",
  },
  "Ardhapatāka": {
    meaning: "half-flag; often depicts leaves, knife, or a flowing river bank.",
    emoji: "🍃",
  },
  Suchi: {
    meaning: "pointing gesture; indicates warning, instruction, or emphasis.",
    emoji: "☝️",
  },
  "Chandrakalā": {
    meaning: "crescent moon gesture; evokes the moon, face profile, or spear.",
    emoji: "🌙",
  },
  "Alāpadma": {
    meaning: "fully bloomed lotus; used for beauty, radiance, and circular motion.",
    emoji: "🪷",
  },
  "Muṣṭi": {
    meaning: "closed fist; conveys firmness, grasping, strength, or holding objects.",
    emoji: "✊",
  },
  Katakamukha: {
    meaning: "kataka — the link of a chain; used to hold a garland, depict an ornament, or represent an offering.",
    emoji: "🌼",
  },
  "Mayūra": {
    meaning: "peacock; used to portray a bird's neck, Krishna's feathers, and creepers.",
    emoji: "🦚",
  },
};

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function isExtended(landmarks, finger) {
  const [tip, pip, mcp] = FINGER_JOINTS[finger];
  return landmarks[tip].y < landmarks[pip].y && landmarks[pip].y < landmarks[mcp].y;
}

function isFolded(landmarks, finger) {
  const [tip, pip, mcp] = FINGER_JOINTS[finger];
  return landmarks[tip].y > landmarks[pip].y || distance(landmarks[tip], landmarks[mcp]) < 0.12;
}

function palmScale(landmarks) {
  return distance(landmarks[0], landmarks[9]);
}

function thumbOpen(landmarks) {
  const d = distance(landmarks[4], landmarks[5]);
  return d / palmScale(landmarks) > 0.52;
}

function thumbClosed(landmarks) {
  const d = distance(landmarks[4], landmarks[5]);
  return d / palmScale(landmarks) < 0.43;
}

function fingerSpread(landmarks) {
  const palm = palmScale(landmarks);
  const pairs =
    distance(landmarks[8], landmarks[12]) +
    distance(landmarks[12], landmarks[16]) +
    distance(landmarks[16], landmarks[20]);
  return pairs / (3 * palm);
}

function fingertipCluster(landmarks) {
  const palm = palmScale(landmarks);
  const tips = [8, 12, 16, 20];
  let sum = 0;
  let count = 0;
  for (let i = 0; i < tips.length; i += 1) {
    for (let j = i + 1; j < tips.length; j += 1) {
      sum += distance(landmarks[tips[i]], landmarks[tips[j]]);
      count += 1;
    }
  }
  return (sum / count) / palm;
}

function detectPataka(hand) {
  if (
    isExtended(hand, "index") &&
    isExtended(hand, "middle") &&
    isExtended(hand, "ring") &&
    isExtended(hand, "pinky") &&
    thumbClosed(hand) &&
    fingerSpread(hand) < 0.58
  ) {
    return 0.82;
  }
  return 0;
}

function detectTripataka(hand) {
  const thumbRingDistance = distance(hand[4], hand[16]);
  if (
    isExtended(hand, "index") &&
    isExtended(hand, "middle") &&
    isFolded(hand, "ring") &&
    isExtended(hand, "pinky") &&
    thumbRingDistance > 0.05
  ) {
    return 0.8;
  }
  return 0;
}

function detectArdhapataka(hand) {
  if (
    isExtended(hand, "index") &&
    isExtended(hand, "middle") &&
    isFolded(hand, "ring") &&
    isFolded(hand, "pinky") &&
    thumbClosed(hand)
  ) {
    return 0.8;
  }
  return 0;
}

function detectTarjani(hand) {
  if (
    isExtended(hand, "index") &&
    isFolded(hand, "middle") &&
    isFolded(hand, "ring") &&
    isFolded(hand, "pinky") &&
    thumbClosed(hand)
  ) {
    return 0.84;
  }
  return 0;
}

function detectChandrakala(hand) {
  if (
    isExtended(hand, "index") &&
    thumbOpen(hand) &&
    isFolded(hand, "middle") &&
    isFolded(hand, "ring") &&
    isFolded(hand, "pinky")
  ) {
    return 0.86;
  }
  return 0;
}

function detectAlapadma(hand) {
  if (
    isExtended(hand, "index") &&
    isExtended(hand, "middle") &&
    isExtended(hand, "ring") &&
    isExtended(hand, "pinky") &&
    thumbOpen(hand) &&
    fingerSpread(hand) > 0.66
  ) {
    return 0.9;
  }
  return 0;
}

function detectMushti(hand) {
  if (
    isFolded(hand, "index") &&
    isFolded(hand, "middle") &&
    isFolded(hand, "ring") &&
    isFolded(hand, "pinky") &&
    fingertipCluster(hand) < 0.4 &&
    thumbClosed(hand)
  ) {
    return 0.88;
  }
  return 0;
}

function detectKapittha(hand) {
  const thumbIndexDistance = distance(hand[4], hand[8]) / palmScale(hand);
  if (
    isFolded(hand, "index") &&
    isFolded(hand, "middle") &&
    isExtended(hand, "ring") &&
    isExtended(hand, "pinky") &&
    thumbIndexDistance < 0.55
  ) {
    return 0.77;
  }
  return 0;
}

function detectMayura(hand) {
  const thumbRingDistance = distance(hand[4], hand[16]);
  if (
    isExtended(hand, "index") &&
    isExtended(hand, "middle") &&
    isFolded(hand, "ring") &&
    isExtended(hand, "pinky") &&
    thumbRingDistance < 0.05
  ) {
    return 0.93;
  }
  return 0;
}

export function detectMudra(landmarks) {
  const candidates = [
    { name: "Mayūra", score: detectMayura(landmarks) },
    { name: "Alāpadma", score: detectAlapadma(landmarks) },
    { name: "Muṣṭi", score: detectMushti(landmarks) },
    { name: "Chandrakalā", score: detectChandrakala(landmarks) },
    { name: "Suchi", score: detectTarjani(landmarks) },
    { name: "Patāka", score: detectPataka(landmarks) },
    { name: "Tripatāka", score: detectTripataka(landmarks) },
    { name: "Ardhapatāka", score: detectArdhapataka(landmarks) },
    { name: "Katakamukha", score: detectKapittha(landmarks) },
  ];

  const best = candidates.reduce((acc, item) => (item.score > acc.score ? item : acc), {
    name: null,
    score: 0,
  });

  if (!best.name || best.score < 0.75) {
    return null;
  }

  return {
    name: best.name,
    score: best.score,
    meaning: MUDRA_DETAILS[best.name].meaning,
    emoji: MUDRA_DETAILS[best.name].emoji,
  };
}
