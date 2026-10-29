import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { passageEnglish, passageRef } from '@/data/content';
import type { Quiz } from '@/feed/engine';
import { haptic } from '@/lib/feedback';
import { useApp } from '@/store/app-store';
import { makeStyles, useColors } from '@/theme/theme';
import { fonts, layout } from '@/theme/tokens';

import { Icon } from '../icon';

export function QuizCard({ quiz }: { quiz: Quiz }) {
  const colors = useColors();
  const styles = useStyles();
  const [choice, setChoice] = useState<string | null>(null);
  const answerQuiz = useApp((s) => s.answerQuiz);
  const answered = choice !== null;
  const correct = choice === quiz.answer;

  const choose = (option: string) => {
    if (answered) return;
    setChoice(option);
    answerQuiz(option === quiz.answer);
    if (option === quiz.answer) haptic.success();
    else haptic.error();
  };

  return (
    <>
      <Text style={styles.question}>
        {quiz.type === 'surah' ? 'Which surah is this from?' : `Which Name of Allah means “${quiz.prompt}”?`}
      </Text>
      {quiz.type === 'surah' && <Text style={styles.quote}>{passageEnglish(quiz.passage)}</Text>}

      <View style={styles.options}>
        {quiz.options.map((option) => {
          const isAnswer = option === quiz.answer;
          const state = !answered ? 'idle' : isAnswer ? 'right' : option === choice ? 'wrong' : 'dim';
          return (
            <Pressable
              key={option}
              onPress={() => choose(option)}
              style={({ pressed }) => [
                styles.option,
                state === 'right' && { borderColor: colors.right },
                state === 'wrong' && { borderColor: colors.wrong },
                { opacity: state === 'dim' ? 0.35 : pressed ? 0.7 : 1 },
              ]}>
              <Text style={[styles.optionText, state === 'right' && { color: colors.right }, state === 'wrong' && { color: colors.wrong }]}>
                {option}
              </Text>
              {state === 'right' && <Icon name="check" size={18} color={colors.right} strokeWidth={2.4} />}
              {state === 'wrong' && <Icon name="x" size={18} color={colors.wrong} strokeWidth={2.4} />}
            </Pressable>
          );
        })}
      </View>

      {answered && (
        <Animated.Text entering={FadeIn.duration(300)} style={styles.result}>
          {correct ? 'Correct. ' : `It is ${quiz.answer}. `}
          {quiz.type === 'surah' ? passageRef(quiz.passage) : ''}
        </Animated.Text>
      )}
    </>
  );
}

const useStyles = makeStyles((colors) => ({
  question: { fontFamily: fonts.uiMedium, fontSize: 24, lineHeight: 30, letterSpacing: -0.3, color: colors.text },
  quote: { fontFamily: fonts.read, fontSize: 17, lineHeight: 26, color: colors.read, marginTop: 16 },
  options: { gap: 10, marginTop: 28 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    borderRadius: layout.radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
  },
  optionText: { fontFamily: fonts.uiMedium, fontSize: 16, color: colors.text },
  result: { fontFamily: fonts.ui, fontSize: 14, color: colors.quiet, marginTop: 18 },
}));
