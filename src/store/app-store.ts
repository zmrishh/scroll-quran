import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Topic } from '@/data/content';
import type { CardStyleId } from '@/data/styles';

import { useCelebration } from './celebration';

/** Free users read this many cards a day, then the feed ends in a paywall until tomorrow. */
export const FREE_DAILY_CARDS = 5;
/** Free users can keep this many saved cards. */
export const FREE_SAVES = 3;

/** Daily goals offered in onboarding, in cards. */
export const DAILY_GOALS = [5, 10, 20] as const;

/** Who is signed in. The ID comes from Apple or Google; name and email never leave the phone. */
export type Account = { provider: 'apple' | 'google' | 'test'; id: string; name: string | null; email: string | null };

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
  /** Cards a day that complete a streak day. Free users' goal is capped at the free limit. */
  dailyGoal: number;
  streak: number;
  /** The last day the daily goal was reached. */
  lastActiveDay: string;
  account: Account | null;
  /** The last account signed in, kept after signing out: Apple only sends the name the first time. */
  lastProfile: Account | null;
  cardStyle: CardStyleId;
  /** Store product IDs of card styles bought. With RevenueCat set up, refreshed from it. */
  ownedStyles: string[];
  totals: Totals;
  hintSeen: boolean;
  /** Names of Allah the reader has come across, for the collection meter. */
  seenNames: Record<string, true>;
  /** Consecutive correct quiz answers. */
  quizStreak: number;
  /** Days (YYYY-MM-DD) the daily goal was reached, newest last, capped at 60. */
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
  completeOnboarding: (topics: Topic[], display: Display, dailyGoal: number) => void;
  setAccount: (account: Account | null) => void;
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
  set: (
    patch: Partial<Pick<State, 'display' | 'arabicSize' | 'haptics' | 'premium' | 'hintSeen' | 'dailyGoal' | 'cardStyle' | 'ownedStyles'>>,
  ) => void;
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
  dailyGoal: FREE_DAILY_CARDS,
  streak: 0,
  lastActiveDay: '',
  account: null,
  lastProfile: null,
  cardStyle: 'night',
  ownedStyles: [],
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

        completeOnboarding: (topics, display, dailyGoal) => {
          const affinity: Partial<Record<Topic, number>> = {};
          for (const t of topics) affinity[t] = 4;
          set({ onboarded: true, topics, display, affinity, dailyGoal });
        },

        setAccount: (account) => set(account ? { account, lastProfile: account } : { account: null }),

        // Starts a new day's count. The streak itself only moves when the daily goal is reached.
        touchDay: () => {
          const t = today();
          if (get().day !== t) set({ day: t, viewedToday: 0 });
        },

        recordView: () => {
          const s = get();
          const t = today();
          const viewedToday = s.day === t ? s.viewedToday + 1 : 1;
          const totals = { ...s.totals, views: s.totals.views + 1 };
          if (viewedToday < dailyTarget(s) || s.lastActiveDay === t) {
            set({ day: t, viewedToday, totals });
            return;
          }
          const streak = s.lastActiveDay === yesterday() ? s.streak + 1 : 1;
          set({
            day: t,
            viewedToday,
            totals,
            streak,
            lastActiveDay: t,
            activeDays: [...s.activeDays.filter((d) => d !== t), t].slice(-60),
          });
          useCelebration.setState({ streak });
        },

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

/** Cards that complete today's streak day. A free user's goal can't be more than they're allowed to read. */
export const dailyTarget = (s: Pick<State, 'premium' | 'dailyGoal'>) =>
  s.premium ? s.dailyGoal : Math.min(s.dailyGoal, FREE_DAILY_CARDS);

/** The streak as it stands now: it lapses once a whole day passes without reaching the goal. */
export const currentStreak = (s: Pick<State, 'streak' | 'lastActiveDay'>) =>
  s.lastActiveDay === today() || s.lastActiveDay === yesterday() ? s.streak : 0;

export const isToday = (day: string) => day === today();

/** Cards a free user can still see today. */
export const remainingToday = (s: Pick<State, 'premium' | 'viewedToday' | 'day'>) =>
  s.premium ? Infinity : Math.max(0, FREE_DAILY_CARDS - (s.day === today() ? s.viewedToday : 0));
