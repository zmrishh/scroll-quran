import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { MOODS, moodInfo } from '@/data/moods';
import { haptic } from '@/lib/feedback';
import { moodToday, useApp, type Mood } from '@/store/app-store';
import { makeStyles, useColors } from '@/theme/theme';
import { fonts } from '@/theme/tokens';

import { Icon } from '../icon';

/** The day's first card: one honest question, and the feed meets the answer. */
export function CheckInCard({ onPick }: { onPick?: (mood: Mood) => void }) {
  const colors = useColors();
  const styles = useStyles();
  const chosen = useApp(moodToday);

  return (
    <>
      <Text style={styles.title}>How is your heart today?</Text>
      <View style={styles.list}>
        {MOODS.map((m) => {
          const on = m.id === chosen;
          return (
            <Pressable
              key={m.id}
              onPress={() => {
                if (chosen) return;
                haptic.success();
                useApp.getState().setMood(m.id);
                onPick?.(m.id);
              }}
              style={({ pressed }) => [styles.row, pressed && !chosen && { opacity: 0.6 }, chosen && !on && { opacity: 0.35 }]}>
              <Text style={[styles.label, on && { color: colors.gold }]}>{m.label}</Text>
              {on && <Icon name="check" size={18} color={colors.gold} strokeWidth={2.2} />}
            </Pressable>
          );
        })}
      </View>
      {chosen && (
        <Animated.Text entering={FadeIn.duration(400)} style={styles.reply}>
          {moodInfo(chosen)?.reply} Swipe up.
        </Animated.Text>
      )}
    </>
  );
}

const useStyles = makeStyles((colors) => ({
  title: { fontFamily: fonts.read, fontSize: 28, lineHeight: 36, color: colors.text },
  list: { marginTop: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  label: { fontFamily: fonts.uiMedium, fontSize: 18, color: colors.text },
  reply: { fontFamily: fonts.read, fontSize: 16, lineHeight: 24, color: colors.gold, marginTop: 18 },
}));
