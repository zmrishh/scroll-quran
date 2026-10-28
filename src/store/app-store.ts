import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Topic } from '@/data/content';

/** Free users read this many cards a day, then the feed ends in a paywall until tomorrow. */
export const FREE_DAILY_CARDS = 5;
/** Free users can keep this many saved cards. */
export const FREE_SAVES = 3;

export type Display = 'both' | 'arabic' | 'english';
export type ArabicSize = 's' | 'm' | 'l';

type Totals = { views: number; dhikr: number; quizAnswered: number; quizCorrect: number; memorised: number; ameen: number };

export type Mood = 'anxious' | 'sad' | 'grateful' | 'guilty' | 'lost' | 'tired';
export type Note = { text: string; at: number };

type State = {
  onboarded: boolean;
  topics: Topic[];
  affinity: Partial<Record<Topic, number>>;
  liked: Record<string, number>;
  saved: Record<string, number>;
  display: Display;
  arabicSize: ArabicSize;
  haptics: boolean;
  premium: boolean;
  day: string;
  viewedToday: number;
  streak: number;
  lastActiveDay: string;
  totals: Totals;
  hintSeen: boolean;
  /** Names of Allah the reader has come across, for the collection meter. */
  seenNames: Record<string, true>;
  /** Consecutive correct quiz answers. */
  quizStreak: number;
  /** Days (YYYY-MM-DD) the app was opened, newest last, capped at 60. */
  activeDays: string[];
  /** Private reflections, keyed like saves ("<kind>:<id>"). */
  notes: Record<string, Note>;
  /** Today's answer to "How is your heart today?". */
  mood: { day: string; mood: Mood } | null;
  /** How many times each dua has had "Ameen" said to it. */
  ameen: Record<string, number>;
  /** Where the reader last was in the full Quran. */
  lastRead: { surah: number; ayah: number } | null;
};

type Actions = {
  completeOnboarding: (topics: Topic[], display: Display) => void;
  touchDay: () => void;
  recordView: () => void;
  seeName: (id: string) => void;
  nudge: (topics: readonly Topic[], amount: number) => void;
  toggleLike: (key: string, topics: readonly Topic[]) => boolean;
  like: (key: string, topics: readonly Topic[]) => void;
  toggleSave: (key: string, topics: readonly Topic[]) => boolean;
  addDhikr: (n: number) => void;
  answerQuiz: (correct: boolean) => void;
  setNote: (key: string, text: string) => void;
  setMood: (mood: Mood) => void;
  sayAmeen: (key: string) => void;
  addMemorised: () => void;
  setLastRead: (surah: number, ayah: number) => void;
  set: (patch: Partial<Pick<State, 'display' | 'arabicSize' | 'haptics' | 'premium' | 'hintSeen'>>) => void;
  resetAll: () => void;
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const initial: State = {
  onboarded: false,
  topics: [],
  affinity: {},
  liked: {},
  saved: {},
  display: 'both',
  arabicSize: 'm',
  haptics: true,
  premium: false,
  day: today(),
  viewedToday: 0,
  streak: 0,
  lastActiveDay: '',
  totals: { views: 0, dhikr: 0, quizAnswered: 0, quizCorrect: 0, memorised: 0, ameen: 0 },
  hintSeen: false,
  seenNames: {},
  quizStreak: 0,
  activeDays: [],
  notes: {},
  mood: null,
  ameen: {},
  lastRead: null,
};

export const useApp = create<State & Actions>()(
  persist(
    (set, get) => {
      const nudge = (topics: readonly Topic[], amount: number) =>
        set((s) => {
          const affinity = { ...s.affinity };
          for (const t of topics) affinity[t] = Math.max(0, (affinity[t] ?? 0) + amount);
          return { affinity };
        });

      return {
        ...initial,

        completeOnboarding: (topics, display) => {
          const affinity: Partial<Record<Topic, number>> = {};
          for (const t of topics) affinity[t] = 4;
          set({ onboarded: true, topics, display, affinity });
        },

        touchDay: () => {
          const s = get();
          const t = today();
          if (s.lastActiveDay === t) return;
          const streak = s.lastActiveDay === yesterday() ? s.streak + 1 : 1;
          set({
            lastActiveDay: t,
            streak,
            day: t,
            viewedToday: s.day === t ? s.viewedToday : 0,
            activeDays: [...s.activeDays.filter((d) => d !== t), t].slice(-60),
          });
        },

        recordView: () =>
          set((s) => {
            const t = today();
            const viewedToday = s.day === t ? s.viewedToday + 1 : 1;
            return { day: t, viewedToday, totals: { ...s.totals, views: s.totals.views + 1 } };
          }),

        nudge,

        seeName: (id) => {
          if (!get().seenNames[id]) set({ seenNames: { ...get().seenNames, [id]: true } });
        },

        toggleLike: (key, topics) => {
          const liked = { ...get().liked };
          const on = !liked[key];
          if (on) liked[key] = Date.now();
          else delete liked[key];
          set({ liked });
          nudge(topics, on ? 2 : -2);
          return on;
        },

        like: (key, topics) => {
          if (get().liked[key]) return;
          set({ liked: { ...get().liked, [key]: Date.now() } });
          nudge(topics, 2);
        },

        toggleSave: (key, topics) => {
          const saved = { ...get().saved };
          const on = !saved[key];
          if (on) saved[key] = Date.now();
          else delete saved[key];
          set({ saved });
          nudge(topics, on ? 3 : -3);
          return on;
        },

        addDhikr: (n) => set((s) => ({ totals: { ...s.totals, dhikr: s.totals.dhikr + n } })),

        answerQuiz: (correct) =>
          set((s) => ({
            totals: {
              ...s.totals,
              quizAnswered: s.totals.quizAnswered + 1,
              quizCorrect: s.totals.quizCorrect + (correct ? 1 : 0),
            },
            quizStreak: correct ? s.quizStreak + 1 : 0,
          })),

        setNote: (key, text) =>
          set((s) => {
            const notes = { ...s.notes };
            if (text.trim()) notes[key] = { text: text.trim(), at: Date.now() };
            else delete notes[key];
            return { notes };
          }),

        setMood: (mood) => set({ mood: { day: today(), mood } }),

        sayAmeen: (key) =>
          set((s) => ({
            ameen: { ...s.ameen, [key]: (s.ameen[key] ?? 0) + 1 },
            totals: { ...s.totals, ameen: s.totals.ameen + 1 },
          })),

        addMemorised: () => set((s) => ({ totals: { ...s.totals, memorised: s.totals.memorised + 1 } })),

        setLastRead: (surah, ayah) => {
          const l = get().lastRead;
          if (l?.surah !== surah || l.ayah !== ayah) set({ lastRead: { surah, ayah } });
        },

        set: (patch) => set(patch),

        resetAll: () => set({ ...initial, day: today() }),
      };
    },
    {
      name: 'scroll-quran',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // Saved state from older versions lacks newer totals; fill them from the defaults.
      merge: (persisted, current) => {
        const p = persisted as Partial<State> | undefined;
        return { ...current, ...p, totals: { ...current.totals, ...p?.totals } };
      },
    },
  ),
);

/** Today's mood, if the reader has checked in today. */
export const moodToday = (s: Pick<State, 'mood'>) => (s.mood?.day === today() ? s.mood.mood : null);

/** Cards a free user can still see today. */
export const remainingToday = (s: Pick<State, 'premium' | 'viewedToday' | 'day'>) =>
  s.premium ? Infinity : Math.max(0, FREE_DAILY_CARDS - (s.day === today() ? s.viewedToday : 0));
