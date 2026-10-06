// Every franchise name and flavour line lives here, so it can be swapped in one place.
export const GAME_NAME = "Built in a Cave";
export const COMPANY = "Stark Industries";
export const MENTOR = "JARVIS";
export const AUDITOR = "Rhodey";

/** The suit Mark shown as the player's title, by level. */
export const TITLES = [
  "Mark I - Scrap Prototype",
  "Mark II - Test Rig",
  "Mark III - Hot Rod Red",
  "Mark IV - Expo Edition",
  "Mark V - Suitcase Suit",
  "Mark VI - Triangle Reactor",
  "Mark VII - Deployable",
  "Mark XLII - Prodigal Son",
  "Mark L - Nanotech",
];
export const titleFor = (level: number) => TITLES[Math.min(level - 1, TITLES.length - 1)];

export const MARK_LEVELS = {
  1: { name: "Mark I", label: "Guided", blurb: "JARVIS walks you through every station. Part of the design is built; hints are free." },
  3: { name: "Mark III", label: "Assisted", blurb: "A skeleton to start from. JARVIS stays quiet unless asked; hints cost a little." },
  7: { name: "Mark VII", label: "Solo", blurb: "Blank stations, full hint cost. This is interview pace." },
} as const;

export const LOADING_LINES = [
  "Spinning up the arc reactor...",
  "Polishing the repulsors...",
  "Asking Dummy to put down the fire extinguisher...",
  "Reticulating Helicarrier rotors...",
];
