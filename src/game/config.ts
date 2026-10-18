// Fixed game pacing for every round (DESIGN.md 2.4) – no speed-up
export const TIMING = {
  leadInMs: 800, // wait before each sequence playback (input stays blocked)
  flashMs: 600, // highlight + tone per color
  gapMs: 250, // pause between colors
  minPressMs: 250, // minimum player press feedback
} as const;
