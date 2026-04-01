// app/quiz.tsx
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { QUIZ_QUESTIONS } from '../utils/constants';
import { calculateDosha } from '../utils/doshaCalc';

interface Dosha {
  vata: number;
  pitta: number;
  kapha: number;
}

interface QuizProps {
  onDone: (dosha: Dosha) => void;
}

export default function Quiz({ onDone }: QuizProps) {
  const [idx, setIdx] = useState<number>(0);
  const [ans, setAns] = useState<Record<string, number>>({});
  const q = QUIZ_QUESTIONS[idx];
  const has = ans[q.id] !== undefined;

  const next = () => {
    if (idx < QUIZ_QUESTIONS.length - 1) { setIdx((i) => i + 1); return; }
    onDone(calculateDosha(ans));
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.progressWrap}>
          <Text style={styles.stepText}>Step {idx + 1} of {QUIZ_QUESTIONS.length}</Text>
          <View style={styles.pips}>
            {QUIZ_QUESTIONS.map((_, i) => (
              <View key={i} style={[styles.pip, i <= idx && styles.pipDone]} />
            ))}
          </View>
        </View>

        <Text style={styles.cat}>{q.cat}</Text>
        <Text style={styles.question}>{q.q}</Text>

        <View style={styles.opts}>
          {q.opts.map((o: string, i: number) => (
            <TouchableOpacity
              key={i}
              style={[styles.opt, ans[q.id] === i && styles.optSel]}
              onPress={() => setAns((p) => ({ ...p, [q.id]: i }))}
            >
              <Text style={[styles.optText, ans[q.id] === i && styles.optTextSel]}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.nav}>
          <TouchableOpacity
            style={[styles.btnGhost, idx === 0 && { opacity: 0.3 }]}
            onPress={() => setIdx((i) => Math.max(0, i - 1))}
          >
            <Text style={styles.btnGhostText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPrimary, !has && { opacity: 0.4 }]}
            onPress={next}
            disabled={!has}
          >
            <Text style={styles.btnPrimaryText}>
              {idx === QUIZ_QUESTIONS.length - 1 ? 'See Results' : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f9f5',
  },
  scroll: {
    padding: 24,
    paddingTop: 40,
  },
  progressWrap: {
    alignItems: 'center',
    marginBottom: 36,
  },
  stepText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  pips: {
    flexDirection: 'row',
    gap: 6,
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  pipDone: {
    backgroundColor: '#4a9b5f',
  },
  cat: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a9b5f',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  question: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 24,
    lineHeight: 30,
  },
  opts: {
    gap: 12,
    marginBottom: 32,
  },
  opt: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
  },
  optSel: {
    borderColor: '#4a9b5f',
    backgroundColor: '#f0f7f2',
  },
  optText: {
    fontSize: 15,
    color: '#333',
  },
  optTextSel: {
    color: '#2d6a4f',
    fontWeight: '600',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnGhost: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  btnGhostText: {
    fontSize: 15,
    color: '#666',
  },
  btnPrimary: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#4a9b5f',
  },
  btnPrimaryText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
});