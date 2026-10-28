import {
  DHIKR,
  DUAS,
  NAMES,
  PASSAGES,
  passageEnglish,
  type Passage,
  type Topic,
} from '@/data/content';

export type Quiz =
  | { type: 'surah'; passage: Passage; options: string[]; answer: string }
  | { type: 'name'; prompt: string; options: string[]; answer: string; arabic: string };

export type FeedItem =
  | {
      kind: 'ayah' | 'dua' | 'name' | 'dhikr';
      key: string;
      id: string;
      topics: readonly Topic[];
      /** Ayah shown as "complete the verse": the key line hidden until tapped. */
      blank?: boolean;
    }
  | { kind: 'quiz'; key: string; quiz: Quiz; topics: readonly Topic[] }
  | { kind: 'limit'; key: string; topics: readonly Topic[] }
  | { kind: 'checkin'; key: string; topics: readonly Topic[] };

type Kind = 'ayah' | 'dua' | 'name' | 'dhikr' | 'quiz';

// One "beat" of the feed. Ayat carry the feed; the other card types keep it from feeling repetitive.
const RHYTHM: Kind[] = ['ayah', 'ayah', 'dua', 'ayah', 'quiz', 'ayah', 'name', 'ayah', 'dhikr', 'ayah'];
const EXPLORE = 0.2;
const RECENT_WINDOW = 40;
// Every few ayat, one turns into a "complete the verse" card.
const BLANK_EVERY = 6;

type Pooled = { id: string; topics: readonly Topic[] };

const POOLS: Record<Exclude<Kind, 'quiz'>, readonly Pooled[]> = {
  ayah: PASSAGES,
  dua: DUAS,
  name: NAMES,
  dhikr: DHIKR,
};

const shortPassages = PASSAGES.filter((p) => passageEnglish(p).length <= 170 && p.surah !== 1);

const pick = <T>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];

const shuffle = <T>(xs: T[]) => {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
};

function weighted<T extends Pooled>(pool: readonly T[], affinity: Partial<Record<Topic, number>>): T {
  if (Math.random() < EXPLORE) return pick(pool);
  const weights = pool.map((p) => 1 + p.topics.reduce((s, t) => s + (affinity[t] ?? 0), 0));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function makeQuiz(topic: Topic | null): Quiz {
  if (Math.random() < 0.65) {
    const candidates = topic ? shortPassages.filter((p) => p.topics.includes(topic)) : shortPassages;
    const passage = pick(candidates.length ? candidates : shortPassages);
    const others = shuffle([...new Set(PASSAGES.map((p) => p.surahName))].filter((n) => n !== passage.surahName));
    return {
      type: 'surah',
      passage,
      answer: passage.surahName,
      options: shuffle([passage.surahName, others[0], others[1]]),
    };
  }
  const name = pick(NAMES);
  const others = shuffle(NAMES.filter((n) => n.id !== name.id));
  return {
    type: 'name',
    prompt: name.meaning,
    arabic: name.arabic,
    answer: name.translit,
    options: shuffle([name.translit, others[0].translit, others[1].translit]),
  };
}

/**
 * Stateful generator for one feed session. `topic` narrows every pool to one theme;
 * `null` is the personalised "For you" feed driven by the affinity scores.
 */
export function createFeed(topic: Topic | null) {
  let beat = 0;
  let serial = 0;
  let ayahCount = 0;
  const recent: string[] = [];

  const next = (affinity: Partial<Record<Topic, number>>): FeedItem => {
    const kind = RHYTHM[beat++ % RHYTHM.length];
    serial++;
    if (kind === 'quiz') {
      const quiz = makeQuiz(topic);
      return {
        kind: 'quiz',
        key: `quiz-${serial}`,
        quiz,
        topics: quiz.type === 'surah' ? quiz.passage.topics : [],
      };
    }
    const all = POOLS[kind];
    const themed = topic ? all.filter((p) => p.topics.includes(topic)) : all;
    const base = themed.length ? themed : all;
    const fresh = base.filter((p) => !recent.includes(`${kind}:${p.id}`));
    const choice = weighted(fresh.length ? fresh : base, affinity);
    recent.push(`${kind}:${choice.id}`);
    if (recent.length > RECENT_WINDOW) recent.shift();
    const item: FeedItem = { kind, key: `${kind}-${choice.id}-${serial}`, id: choice.id, topics: choice.topics };
    if (kind === 'ayah' && ++ayahCount % BLANK_EVERY === 3) {
      const p = PASSAGES.find((x) => x.id === choice.id);
      if (p && p.ayat.length < 3 && p.key.length <= 70 && passageEnglish(p).length <= 260) item.blank = true;
    }
    return item;
  };

  return {
    batch(count: number, affinity: Partial<Record<Topic, number>>) {
      return Array.from({ length: count }, () => next(affinity));
    },
  };
}
