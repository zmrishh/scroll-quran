import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { colors, fonts } from '@/theme/tokens';

export default function About() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Sources</Text>
          <Pressable accessibilityLabel="Close" hitSlop={12} onPress={() => router.back()} style={styles.close}>
            <Icon name="x" size={18} color={colors.read} strokeWidth={2.4} />
          </Pressable>
        </View>

        <Block title="Quran text">
          Arabic text from the Tanzil Quran Text (Uthmani, Version 1.1), Copyright © 2007–2026 Tanzil Project, licensed
          under Creative Commons Attribution 3.0. It is reproduced exactly as published. Surah facts (Meccan or Medinan,
          number of ayat) also come from Tanzil.
        </Block>
        <Pressable onPress={() => Linking.openURL('https://tanzil.net')} style={styles.link}>
          <Text style={styles.linkText}>tanzil.net</Text>
          <Icon name="chevron-right" size={16} color={colors.text} />
        </Pressable>

        <Block title="Translation">
          English meanings are from Marmaduke Pickthall’s The Meaning of the Glorious Koran (1930), which is in the public
          domain. A translation carries the meaning; it is not the Quran itself.
        </Block>

        <Block title="Duas, Names and dhikr">
          Every dua is taken from the Quran. Each Name of Allah shows a Quran reference where it appears, checked against
          the Arabic text. The brighter key line on each card was chosen by hand and matches the translation word for word.
        </Block>

        <Block title="Art">
          The illumination in the app comes from Quran manuscripts in The Metropolitan Museum of Art, New York, released into
          the public domain through its Open Access programme: the Blue Qur’an (Tunisia, 9th–10th century), the Anonymous
          Baghdad Qur’an (Iraq, 1307), the Qur’an of Ibrahim Sultan (Iran, 1427), opening pages from Morocco (18th century) and
          the opening of Al-Fatiha from India (about 1800).
        </Block>
        <Pressable onPress={() => Linking.openURL('https://www.metmuseum.org/hubs/open-access')} style={styles.link}>
          <Text style={styles.linkText}>metmuseum.org/open-access</Text>
          <Icon name="chevron-right" size={16} color={colors.text} />
        </Pressable>

        <Block title="Typefaces">Amiri Quran, Amiri, Literata and Inter Tight, all under the SIL Open Font License.</Block>

        <Block title="No AI">
          Nothing in Scroll Quran is generated. The feed follows simple rules based on what you like, save and spend time
          on.
        </Block>
      </ScrollView>
    </View>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      <Text style={styles.blockBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  content: { paddingHorizontal: 28, paddingTop: 26, maxWidth: 560, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.read, fontSize: 32, color: colors.text },
  close: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  block: { marginTop: 24 },
  blockTitle: { fontFamily: fonts.uiMedium, fontSize: 16, color: colors.text, marginBottom: 6 },
  blockBody: { fontFamily: fonts.read, fontSize: 15.5, lineHeight: 24, color: colors.read },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  linkText: { fontFamily: fonts.uiMedium, fontSize: 15, color: colors.text },
});
