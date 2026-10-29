import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptic } from '@/lib/feedback';
import { useApp } from '@/store/app-store';
import { makeStyles, useColors } from '@/theme/theme';
import { fonts, layout } from '@/theme/tokens';

const MAX = 600;

type Props = { open: boolean; noteKey: string; source: string; onClose: () => void };

/** A private reflection on one card. Stays on the phone; shows up in Saved under Notes. */
export function NoteSheet({ open, noteKey, source, onClose }: Props) {
  return (
    <Modal visible={open} transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
      {/* Mounted only while open, so each opening starts from the saved note. */}
      {open && <Sheet noteKey={noteKey} source={source} onClose={onClose} />}
    </Modal>
  );
}

function Sheet({ noteKey, source, onClose }: Omit<Props, 'open'>) {
  const colors = useColors();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const existing = useApp((s) => s.notes[noteKey]?.text ?? '');
  const [text, setText] = useState(existing);

  const save = () => {
    useApp.getState().setNote(noteKey, text);
    haptic.success();
    onClose();
  };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.source}>{source}</Text>
        <Text style={styles.title}>Your reflection</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="What does this mean to you today?"
          placeholderTextColor={colors.faint}
          multiline
          autoFocus
          maxLength={MAX}
          style={styles.input}
          selectionColor={colors.gold}
        />
        <View style={styles.row}>
          <View style={styles.buttons}>
            {existing ? (
              <Pressable hitSlop={8} onPress={() => setText('')}>
                <Text style={styles.secondary}>Clear</Text>
              </Pressable>
            ) : null}
            <Pressable hitSlop={8} onPress={onClose}>
              <Text style={styles.secondary}>Cancel</Text>
            </Pressable>
            <Pressable onPress={save} style={styles.save} accessibilityRole="button">
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  fill: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: colors.raised, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20, paddingHorizontal: 24 },
  source: { fontFamily: fonts.ui, fontSize: 13, color: colors.quiet },
  title: { fontFamily: fonts.read, fontSize: 22, color: colors.text, marginTop: 4 },
  input: {
    fontFamily: fonts.read,
    fontSize: 17,
    lineHeight: 25,
    color: colors.text,
    minHeight: 120,
    maxHeight: 220,
    marginTop: 14,
    textAlignVertical: 'top',
    padding: 0,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 16 },
  buttons: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  secondary: { fontFamily: fonts.uiMedium, fontSize: 15, color: colors.quiet },
  save: { backgroundColor: colors.gold, borderRadius: layout.radius.md, paddingHorizontal: 18, height: 40, justifyContent: 'center' },
  saveText: { fontFamily: fonts.uiMedium, fontSize: 15, color: colors.page },
}));
