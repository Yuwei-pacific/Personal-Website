const MASKED_TEXT_Y_PERCENT = 140;
const MASKED_TEXT_ROTATION = 5;
const MASKED_TEXT_DURATION = 0.8;
const MASKED_TEXT_STAGGER = 0.05;

export function maskedTextHiddenVars() {
  return {
    yPercent: MASKED_TEXT_Y_PERCENT,
    rotation: MASKED_TEXT_ROTATION,
    transformOrigin: "left bottom",
  };
}

export function maskedTextRevealVars() {
  return {
    yPercent: 0,
    rotation: 0,
    duration: MASKED_TEXT_DURATION,
    ease: "power4.out",
    stagger: {
      each: MASKED_TEXT_STAGGER,
      from: "start" as const,
    },
  };
}
