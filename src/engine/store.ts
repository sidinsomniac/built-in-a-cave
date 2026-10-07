// The save: zustand, persisted to localStorage, versioned, with automatic backups.
// Lessons learned from Parseltongue: never trust a missing version, and keep copies.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Design } from "../sim/types";
import type { Endpoint } from "./stations";
import { ZONES, type Zone } from "./zones";

export const SAVE_KEY = "built-in-a-cave-save";
export const BACKUP_KEY = "built-in-a-cave-backups";
export const SAVE_VERSION = 1;

export type Mark = 1 | 3 | 7;

export interface ExerciseRecord {
  zone: Zone;
  /** Best zone so far. */
  best: Zone;
  attempts: number;
  hintsUsed: number;
  completedAt?: string;
}

/** Everything a learner has done on one station of one case, at one Mark. */
export interface StationRecord {
  zone?: Zone;
  best?: Zone;
  attempts: number;
  hintsUsed: number;
  /** The learner's work, so a station reopens as they left it. */
  asked?: string[];
  estimates?: Record<string, string>;
  design?: Design;
  endpoints?: Endpoint[];
  code?: Record<string, string>;
  placements?: Record<string, string>;
  /** Design table: whether the player has run the simulation, and the guided steps they've finished. */
  ran?: boolean;
  stepsDone?: string[];
  stepAnswers?: Record<string, string>;
  /** Parts briefing: every option picked for each card, in order. */
  picks?: Record<number, number[]>;
}

export interface CaseProgress {
  /** Highest Mark unlocked. */
  unlocked: Mark;
  /** Best overall zone per Mark completed. */
  completed: Partial<Record<Mark, Zone>>;
  stations: Partial<Record<Mark, Record<string, StationRecord>>>;
}

interface SaveData {
  name: string;
  xp: number;
  exercises: Record<string, ExerciseRecord>;
  cases: Record<string, CaseProgress>;
  scenesSeen: Record<string, true>;
  drafts: Record<string, Record<string, string>>;
}

interface Actions {
  recordExercise: (id: string, zone: Zone, hintsUsed: number) => number;
  recordStation: (caseId: string, mark: Mark, stationId: string, patch: Partial<StationRecord>) => void;
  gradeStation: (caseId: string, mark: Mark, stationId: string, zone: Zone, hintsUsed: number) => number;
  completeCase: (caseId: string, mark: Mark, zone: Zone) => void;
  seeScene: (id: string) => void;
  saveDraft: (id: string, files: Record<string, string>) => void;
  reset: () => void;
}

export type GameState = SaveData & Actions;

const initialData: SaveData = { name: "", xp: 0, exercises: {}, cases: {}, scenesSeen: {}, drafts: {} };

/** XP for a result: the zone sets the reward, hints shave a little off, never below 5. */
export function xpFor(zone: Zone, hintsUsed: number, base = 40): number {
  const share = { optimal: 1, solid: 0.75, risky: 0.4, failing: 0 }[zone];
  if (share === 0) return 0;
  return Math.max(5, Math.round(base * share - hintsUsed * 3));
}

export const xpForLevel = (level: number) => 50 * (level - 1) * level;
export function levelFor(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

const better = (a: Zone | undefined, b: Zone): Zone => (!a || ZONES[b].rank > ZONES[a].rank ? b : a);

/** Works out a save's version from its contents, so a mislabelled save is never wiped. */
export function detectSaveVersion(raw: unknown): number {
  if (!raw || typeof raw !== "object") return 0;
  const r = raw as { version?: unknown; state?: Record<string, unknown> };
  if (typeof r.version === "number") return r.version;
  return r.state && "exercises" in r.state ? SAVE_VERSION : 0;
}

/** Keeps the last 3 saves, written before any upgrade or reset. */
export function backupSave(reason: string) {
  try {
    const current = localStorage.getItem(SAVE_KEY);
    if (!current) return;
    const list = JSON.parse(localStorage.getItem(BACKUP_KEY) ?? "[]") as unknown[];
    list.unshift({ at: new Date().toISOString(), reason, save: current });
    localStorage.setItem(BACKUP_KEY, JSON.stringify(list.slice(0, 3)));
  } catch {
    // storage full or unavailable: never block the game on a backup
  }
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialData,
      recordExercise(id, zone, hintsUsed) {
        const prev = get().exercises[id];
        const firstPass = zone !== "failing" && (!prev || prev.best === "failing");
        const gained = firstPass ? xpFor(zone, hintsUsed) : 0;
        set((s) => ({
          xp: s.xp + gained,
          exercises: {
            ...s.exercises,
            [id]: {
              zone,
              best: better(prev?.best, zone),
              attempts: (prev?.attempts ?? 0) + 1,
              hintsUsed: Math.max(prev?.hintsUsed ?? 0, hintsUsed),
              completedAt: prev?.completedAt ?? (zone !== "failing" ? new Date().toISOString() : undefined),
            },
          },
        }));
        return gained;
      },
      recordStation(caseId, mark, stationId, patch) {
        set((s) => {
          const cp = s.cases[caseId] ?? { unlocked: 1, completed: {}, stations: {} };
          const forMark = cp.stations[mark] ?? {};
          const prev = forMark[stationId] ?? { attempts: 0, hintsUsed: 0 };
          return {
            cases: { ...s.cases, [caseId]: { ...cp, stations: { ...cp.stations, [mark]: { ...forMark, [stationId]: { ...prev, ...patch } } } } },
          };
        });
      },
      gradeStation(caseId, mark, stationId, zone, hintsUsed) {
        const prev = get().cases[caseId]?.stations[mark]?.[stationId];
        const firstPass = zone !== "failing" && (!prev?.best || prev.best === "failing");
        const gained = firstPass ? xpFor(zone, hintsUsed, 30 + mark * 5) : 0;
        get().recordStation(caseId, mark, stationId, { zone, best: better(prev?.best, zone), attempts: (prev?.attempts ?? 0) + 1, hintsUsed });
        set((s) => ({ xp: s.xp + gained }));
        return gained;
      },
      completeCase(caseId, mark, zone) {
        set((s) => {
          const cp = s.cases[caseId] ?? { unlocked: 1, completed: {}, stations: {} };
          const nextMark: Mark = mark === 1 ? 3 : 7;
          const unlocked = (Math.max(cp.unlocked, zone !== "failing" ? nextMark : cp.unlocked) as Mark);
          return { cases: { ...s.cases, [caseId]: { ...cp, unlocked, completed: { ...cp.completed, [mark]: better(cp.completed[mark], zone) } } } };
        });
      },
      seeScene: (id) => set((s) => ({ scenesSeen: { ...s.scenesSeen, [id]: true } })),
      saveDraft: (id, files) => set((s) => ({ drafts: { ...s.drafts, [id]: files } })),
      reset() {
        backupSave("reset");
        set({ ...initialData });
      },
    }),
    {
      name: SAVE_KEY,
      version: SAVE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ name: s.name, xp: s.xp, exercises: s.exercises, cases: s.cases, scenesSeen: s.scenesSeen, drafts: s.drafts }),
      migrate(persisted, version) {
        backupSave(`upgrade from v${version}`);
        return { ...initialData, ...(persisted as Partial<SaveData>) } as GameState;
      },
    },
  ),
);
