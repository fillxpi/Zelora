import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Habit } from '../features/habits/types';
import { toDateKey } from '../lib/date';

export default function HomeScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [title, setTitle] = useState('');
  const today = toDateKey();

  const doneToday = habits.filter((habit) => habit.completedDates.includes(today)).length;
  const progress = habits.length === 0 ? 0 : doneToday / habits.length;

  function addHabit() {
    const trimmed = title.trim();
    if (!trimmed) return;

    setHabits((current) => [
      ...current,
      { id: Date.now().toString(), title: trimmed, completedDates: [] },
    ]);
    setTitle('');
  }

  function toggleHabit(id: string) {
    setHabits((current) =>
      current.map((habit) => {
        if (habit.id !== id) return habit;

        const isDone = habit.completedDates.includes(today);
        return {
          ...habit,
          completedDates: isDone
            ? habit.completedDates.filter((date) => date !== today)
            : [...habit.completedDates, today],
        };
      }),
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Zelora</Text>

      <View style={styles.progressCard}>
        <Text style={styles.progressText}>
          {doneToday} de {habits.length} hábitos concluídos hoje
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Novo hábito (ex.: beber água)"
          placeholderTextColor="#8b8fa3"
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={addHabit}
          returnKeyType="done"
        />
        <Pressable style={styles.addButton} onPress={addHabit}>
          <Text style={styles.addButtonText}>Adicionar</Text>
        </Pressable>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(habit) => habit.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum hábito ainda. Adicione o primeiro acima.</Text>
        }
        renderItem={({ item }) => {
          const isDone = item.completedDates.includes(today);
          return (
            <Pressable
              style={[styles.habitItem, isDone && styles.habitItemDone]}
              onPress={() => toggleHabit(item.id)}
            >
              <Text style={styles.habitCheck}>{isDone ? '✓' : '○'}</Text>
              <Text style={[styles.habitTitle, isDone && styles.habitTitleDone]}>
                {item.title}
              </Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12131a',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 16,
  },
  progressCard: {
    backgroundColor: '#1d1f2b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  progressText: {
    color: '#d6d8e6',
    marginBottom: 10,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2c2f40',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c5cff',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#1d1f2b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#7c5cff',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
  emptyText: {
    color: '#8b8fa3',
    textAlign: 'center',
    marginTop: 24,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1d1f2b',
    borderRadius: 14,
    padding: 16,
  },
  habitItemDone: {
    backgroundColor: '#243a2f',
  },
  habitCheck: {
    color: '#ffffff',
    fontSize: 18,
  },
  habitTitle: {
    color: '#ffffff',
    fontSize: 16,
    flexShrink: 1,
  },
  habitTitleDone: {
    color: '#9fd8b4',
    textDecorationLine: 'line-through',
  },
});