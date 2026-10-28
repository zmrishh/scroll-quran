import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { passageEnglish, splitLines, type Passage } from '@/data/content';
import type { ArabicSize, Display } from '@/store/app-store';

import { canMemorise, MemoriseArabic, MemoriseToggle } from '../memorise';
import { Arabic, Note, Translation, translationSize } from '../reading';

type Common = { passage: Passage; display: Display; size: ArabicSize };

/** Long English is read in pages of roughly this many characters. */
const PAGE_CHARS = 170;
const LONG_ENGLISH = 260;
const PAGE_FONT = 21;

export type AyahPage = { kind: 'arabic' } | { kind: 'ayah'; index: number } | { kind: 'text'; start: number; end: number };

/**
 * Passages of three or more ayat are read one ayah per page. A single long ayah shows its
 * Arabic first, then its meaning a few sentences at a time. Everything else fits on one page.
 */
export function ayahPages(passage: Passage, display: Display): AyahPage[] {
  if (passage.ayat.length >= 3) return passage.ayat.map((_, index) => ({ kind: 'ayah', index }));
  const en = passageEnglish(passage);
  if (en.length <= LONG_ENGLISH || display === 'arabic') return [];
  const pages: AyahPage[] = display === 'english' ? [] : [{ kind: 'arabic' }];
  let start = 0;
  let cursor = 0;
  for (const line of splitLines(en)) {
    const s = en.indexOf(line, cursor);
    cursor = s + line.length;
    if (cursor - start > PAGE_CHARS && s > start) {
      pages.push({ kind: 'text', start, end: s });
      start = s;
    }
  }
  pages.push({ kind: 'text', start, end: en.length });
  return pages;
}

export function AyahCard({ passage, display, size, blank }: Common & { blank?: boolean }) {
  const en = passageEnglish(passage);
  const [memorising, setMemorising] = useState(false);
  const memorisable = display !== 'english' && !blank && canMemorise(passage.ayat);
  return (
    <>
      {display !== 'english' &&
        (memorising ? (
          <MemoriseArabic ayat={passage.ayat} size={size} />
        ) : (
          <Arabic ayat={passage.ayat} bismillah={passage.bismillah} size={size} />
        ))}
      {display !== 'arabic' && (
        <View style={display === 'english' ? null : styles.gap}>
          <Translation text={en} keyText={passage.key} fontSize={translationSize(en.length) + (display === 'english' ? 3 : 0)} blank={blank} />
        </View>
      )}
      {memorisable && <MemoriseToggle on={memorising} onPress={() => setMemorising(!memorising)} />}
    </>
  );
}

export function PagedAyahCard({ passage, display, size, pages, page }: Common & { pages: AyahPage[]; page: number }) {
  const current = pages[Math.min(page, pages.length - 1)];
  const en = passageEnglish(passage);
  const last = page === pages.length - 1;
  const cue = last ? null : <Note>{page === 0 ? 'Tap for the next part' : 'Tap to keep reading'}</Note>;

  if (current.kind === 'arabic') {
    // The key line as a marked excerpt, so the cover already says something to non-Arabic readers.
    const excerpt = `…${passage.key}…`;
    return (
      <>
        <Arabic ayat={passage.ayat} bismillah={passage.bismillah} size={size} />
        <View style={styles.gap}>
          <Translation text={excerpt} keyText={excerpt} fontSize={translationSize(excerpt.length)} />
        </View>
        <Note>Tap for the full meaning</Note>
      </>
    );
  }

  if (current.kind === 'text') {
    const chunk = en.slice(current.start, current.end).trim();
    return (
      <>
        <Translation text={chunk} keyText={chunk.includes(passage.key) ? passage.key : undefined} fontSize={PAGE_FONT} />
        {cue}
      </>
    );
  }

  const ayah = passage.ayat[current.index];
  return (
    <>
      {display !== 'english' && (
        <Arabic ayat={[ayah]} bismillah={current.index === 0 && passage.bismillah} size={size} boost={4} />
      )}
      {display !== 'arabic' && (
        <View style={display === 'english' ? null : styles.gap}>
          <Translation text={ayah.en} keyText={ayah.en.includes(passage.key) ? passage.key : undefined} fontSize={PAGE_FONT - 1} />
        </View>
      )}
      {cue}
    </>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: 22 },
});
