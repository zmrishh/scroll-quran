# Design: Night, in the colours of Islamic art

A deep emerald-black page (mosque tile green), ivory type (mushaf paper) and antique gold (calligraphy and the embroidery on the kiswa). The verse is the brightest thing on the screen; gold is kept for accents. There are no gradients, patterns, coloured fields, badges or meters.

## Colours

| Token | Used for |
|---|---|
| `page` #0C1512 | Every screen's background |
| `text` #F3EBD8 | The Arabic, the key line, headings |
| `read` #BDB7A2 | The translation |
| `quiet` #8C8A78 | References, the wordmark, idle icons |
| `faint` #5B6259 | Hints and the free-day counter |
| `line` #22312A | Hairlines, unfilled tasbih beads, the hidden-words gap |
| `gold` #C9A65E | Ayah markers, the bismillah, Arabic surah names, Names of Allah, filled beads, liked and saved icons, the active tab, buttons and selections |

Fonts: Amiri Quran for the Quran, Amiri for Names and dhikr, Literata for the translation, Inter Tight for everything else.

## What helps people read

| Aid | Where |
|---|---|
| Key line set brighter than the rest of the translation (chosen by hand for every passage longer than about two lines) | `Translation` in `components/reading.tsx` |
| Duas: the narration around a dua is greyer, so the words to say stand out | `DuaCard` |
| Long passages read in short pages: tap the right side to go on, the left to go back, with thin page bars at the top | `ayahPages` in `components/cards/ayah-card.tsx` |
| Long ayat open on the Arabic plus a marked excerpt of the key line, then the full meaning | `PagedAyahCard` |
| Passages of three or more ayat read one ayah per page | `PagedAyahCard` |
| Pickthall's "Lo!" starts a line instead of ending one when the text is split | `splitLines` in `data/content.ts` |
| Complete the verse: every few cards the key line is hidden until tapped | `Translation` `blank` |
| Names of Allah with their three root letters | `NameCard` |
| A 33-bead tasbih; every 11th bead is larger and buzzes harder | `DhikrCard` |
| One footer line saying where a card comes from, and who is speaking when it is a person | `footerLabel` in `components/feed-card.tsx` |

## Things to do on a card

| Interaction | Where |
|---|---|
| Daily check-in: the day's first "For you" card asks how your heart is (anxious, sad, grateful, guilty, lost, tired); the cards after it lean towards matching topics for the rest of the day. It doesn't count towards the free limit | `cards/checkin-card.tsx`, `data/moods.ts`, `feed/session.ts` |
| Memorise mode on short ayat and duas: every Arabic word starts hidden, tap each to check yourself; finishing counts towards "ayat memorised" | `components/memorise.tsx` |
| Ameen on duas, with a private count of how often you've said it | `AmeenButton` in `cards/content-cards.tsx` |
| Private reflections: the pen icon opens a note; notes appear in Saved (with a Notes filter) and under the card | `components/note-sheet.tsx` |
| Dhikr counter, quiz answers, complete-the-verse gaps, double-tap to like | as before |
