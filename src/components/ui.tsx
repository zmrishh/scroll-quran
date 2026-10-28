import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, fonts } from '@/theme/tokens';

/** A raised panel on the page: one step lighter, a hairline edge, generous radius. */
export function Surface({ children, style, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; accent?: boolean }) {
  return <View style={[styles.surface, accent && styles.accent, style]}>{children}</View>;
}

/** A small heading above a group, with an optional detail on the right. */
export function SectionHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      {detail && <Text style={styles.headerDetail}>{detail}</Text>}
    </View>
  );
}

/** A thin progress ring with its value drawn in the middle by the caller. */
export function Ring({ size, progress, children }: { size: number; progress: number; children?: ReactNode }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.gold}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * Math.min(1, Math.max(0, progress))} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

/** A short horizontal progress bar. */
export function Bar({ progress, style }: { progress: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.track, style]}>
      <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
    </View>
  );
}

/** "now", "5m", "3h", "2d", "4w" — compact time since a timestamp. */
export function timeAgo(at: number) {
  const mins = Math.floor((Date.now() - at) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 14 ? `${days}d` : `${Math.floor(days / 7)}w`;
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.raised,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: 18,
  },
  accent: { borderColor: colors.gold, borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, marginTop: 30 },
  headerTitle: { fontFamily: fonts.uiMedium, fontSize: 15, color: colors.text },
  headerDetail: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, backgroundColor: colors.gold },
});
