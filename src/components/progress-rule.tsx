import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { makeStyles, useColors } from '@/theme/theme';

import { Star } from './logo';

const TIP = 16;

/** Progress as a gold rule drawn along a faint one, with the star from the logo at its tip. */
export function ProgressRule({ progress }: { progress: number }) {
  const colors = useColors();
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const p = useSharedValue(progress);

  useEffect(() => {
    p.set(withTiming(progress, { duration: 750, easing: Easing.inOut(Easing.cubic) }));
  }, [progress, p]);

  const fill = useAnimatedStyle(() => ({ width: width * p.get() }));
  const tip = useAnimatedStyle(() => ({
    transform: [{ translateX: width * p.get() - (TIP + 6) / 2 }],
  }));

  return (
    <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.line} />
      <Animated.View style={[styles.fill, fill]} />
      <Animated.View style={[styles.tip, tip]}>
        <Star size={TIP} color={colors.gold} />
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  track: { height: TIP + 6, justifyContent: 'center' },
  line: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.line },
  fill: { position: 'absolute', left: 0, height: 1.5, backgroundColor: colors.gold },
  tip: {
    position: 'absolute',
    left: 0,
    width: TIP + 6,
    height: TIP + 6,
    borderRadius: (TIP + 6) / 2,
    backgroundColor: colors.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
