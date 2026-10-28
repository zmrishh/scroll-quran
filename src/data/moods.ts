import type { Mood } from '@/store/app-store';

import type { Topic } from './content';

/** Answers to "How is your heart today?" and the topics each one leans the feed towards. */
export const MOODS: readonly { id: Mood; label: string; reply: string; topics: Topic[] }[] = [
  { id: 'anxious', label: 'Anxious', reply: 'Here is something for an anxious heart.', topics: ['peace', 'trust'] },
  { id: 'sad', label: 'Sad', reply: 'Here is something for when you feel low.', topics: ['hope', 'mercy'] },
  { id: 'grateful', label: 'Grateful', reply: 'Here is something to give that gratitude words.', topics: ['gratitude'] },
  { id: 'guilty', label: 'Guilty', reply: 'Here is something for coming back.', topics: ['forgiveness', 'mercy'] },
  { id: 'lost', label: 'Lost', reply: 'Here is something for finding the way.', topics: ['guidance', 'trust'] },
  { id: 'tired', label: 'Tired', reply: 'Here is something for carrying on.', topics: ['patience', 'hope'] },
];

export const moodInfo = (m: Mood) => MOODS.find((x) => x.id === m);
