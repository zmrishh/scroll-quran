import { create } from 'zustand';

/** The streak just reached, while its celebration is on screen; 0 when none is showing. Not persisted. */
export const useCelebration = create<{ streak: number }>(() => ({ streak: 0 }));
