import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { FOOTER_HEIGHT } from '@/theme/layout';
import { makeStyles, useColors } from '@/theme/theme';
import { fonts } from '@/theme/tokens';

import { Icon, type IconName } from './icon';

type Props = {
  label: string;
  /** The surah's name in Arabic, shown in gold before the reference. */
  arabic?: string;
  /** Opens the passage in the full surah. */
  onSource?: () => void;
  bottom: number;
  actions?: {
    liked: boolean;
    saved: boolean;
    noted: boolean;
    onLike: () => void;
    onSave: () => void;
    onNote: () => void;
    onShare: () => void;
  };
};

/** The card's footer: where the text is from, and like, save and share. */
export function CardFooter({ label, arabic, bottom, actions, onSource }: Props) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={[styles.row, { bottom }]} pointerEvents="box-none">
      <Pressable
        disabled={!onSource}
        onPress={onSource}
        hitSlop={8}
        style={({ pressed }) => [styles.source, pressed && { opacity: 0.6 }]}
        accessibilityRole={onSource ? 'link' : undefined}
        accessibilityLabel={onSource ? `Read ${label} in the full surah` : undefined}>
        {arabic && <Text style={styles.arabic}>{arabic}</Text>}
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {onSource && <Icon name="chevron-right" size={14} color={colors.quiet} strokeWidth={2} />}
      </Pressable>
      {actions && (
        <View style={styles.icons}>
          <IconButton icon="heart" label="Like" active={actions.liked} onPress={actions.onLike} />
          <IconButton icon="bookmark" label="Save" active={actions.saved} onPress={actions.onSave} />
          <IconButton icon="note" label="Write a reflection" active={actions.noted} onPress={actions.onNote} />
          <IconButton icon="share" label="Share" onPress={actions.onShare} />
        </View>
      )}
    </View>
  );
}

function IconButton({ icon, label, onPress, active = false }: { icon: IconName; label: string; onPress: () => void; active?: boolean }) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      hitSlop={10}
      onPress={() => {
        scale.set(withSequence(withTiming(0.8, { duration: 70 }), withSpring(1, { damping: 8, stiffness: 320 })));
        onPress();
      }}>
      <Animated.View style={style}>
        <Icon name={icon} size={22} color={active ? colors.gold : colors.quiet} filled={active && icon !== 'note'} strokeWidth={1.8} />
      </Animated.View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    position: 'absolute',
    left: 28,
    right: 24,
    height: FOOTER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  source: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  arabic: { fontFamily: fonts.arabic, fontSize: 16, lineHeight: 30, color: colors.gold },
  label: { flexShrink: 1, fontFamily: fonts.ui, fontSize: 13, color: colors.quiet },
  icons: { flexDirection: 'row', gap: 20 },
}));
