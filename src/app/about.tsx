import { Block, DocLink, DocScreen } from '@/components/doc';
import { LINKS, openLink } from '@/lib/links';

export default function About() {
  return (
    <DocScreen title="Sources">
      <Block title="Quran text">
        Arabic text from the Tanzil Quran Text (Uthmani, Version 1.1), Copyright © 2007–2026 Tanzil Project, licensed under
        Creative Commons Attribution 3.0. It is reproduced exactly as published. Surah facts (Meccan or Medinan, number of
        ayat) also come from Tanzil.
      </Block>
      <DocLink label="tanzil.net" onPress={() => openLink(LINKS.tanzil)} />

      <Block title="Translation">
        English meanings are from Marmaduke Pickthall’s The Meaning of the Glorious Koran (1930), which is in the public
        domain. A translation carries the meaning; it is not the Quran itself.
      </Block>

      <Block title="Duas, Names and dhikr">Every dua is taken from the Quran, and each Name of Allah shows where it appears in it.</Block>

      <Block title="Art">
        The illumination in the app comes from Quran manuscripts in The Metropolitan Museum of Art, New York, released into the
        public domain through its Open Access programme: the Blue Qur’an (Tunisia, 9th–10th century), the Anonymous Baghdad
        Qur’an (Iraq, 1307), the Qur’an of Ibrahim Sultan (Iran, 1427), opening pages from Morocco (18th century) and the
        opening of Al-Fatiha from India (about 1800).
      </Block>
      <DocLink label="metmuseum.org/open-access" onPress={() => openLink(LINKS.metOpenAccess)} />

      <Block title="Typefaces">Amiri Quran, Amiri, Literata and Inter Tight, all under the SIL Open Font License.</Block>

      <Block title="No AI">Nothing in Scroll Quran is generated.</Block>
    </DocScreen>
  );
}
