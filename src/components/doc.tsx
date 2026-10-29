import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles, useColors } from '@/theme/theme';
import { fonts, layout } from '@/theme/tokens';

import { Icon } from './icon';
import { CloseButton } from './ui';

/** A text page inside the app (Sources, Privacy, Terms): a title, a close button, then sections. */
export function DocScreen({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <CloseButton />
        </View>
        {meta && <Text style={styles.meta}>{meta}</Text>}
        {children}
      </ScrollView>
    </View>
  );
}

export function Block({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      {typeof children === 'string' ? <Text style={styles.body}>{children}</Text> : children}
    </View>
  );
}

/** A paragraph inside a Block, for sections with more than one. */
export function Para({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <Text style={[styles.body, styles.para]}>{children}</Text>;
}

export function Bullets({ items }: { items: string[] }) {
  const styles = useStyles();
  return (
    <View style={styles.bullets}>
      {items.map((item) => (
        <View key={item} style={styles.bullet}>
          <Text style={styles.dot}>•</Text>
          <Text style={[styles.body, { flex: 1 }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

/** A tappable line under a section, for a page or address that goes with it. */
export function DocLink({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} style={styles.link}>
      <Text style={styles.linkText}>{label}</Text>
      <Icon name="chevron-right" size={16} color={colors.text} />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.page },
  content: { paddingHorizontal: layout.gutter, paddingTop: 26, maxWidth: 560, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.read, fontSize: 32, color: colors.text },
  meta: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet, marginTop: 6 },
  block: { marginTop: 24 },
  blockTitle: { fontFamily: fonts.uiMedium, fontSize: 16, color: colors.text, marginBottom: 6 },
  body: { fontFamily: fonts.read, fontSize: 15.5, lineHeight: 24, color: colors.read },
  para: { marginTop: 8 },
  bullets: { gap: 6, marginTop: 6 },
  bullet: { flexDirection: 'row', gap: 10 },
  dot: { fontFamily: fonts.read, fontSize: 15.5, lineHeight: 24, color: colors.gold },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  linkText: { fontFamily: fonts.uiMedium, fontSize: 15, color: colors.text },
}));
