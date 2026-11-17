import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '../features/game/GameHeader';
import { LevelCard } from '../features/game/LevelCard';
import { HabitItem } from '../features/habits/HabitItem';
import type { Habit } from '../features/habits/types';
import { toDateKey } from '../lib/date';
import { useAppState } from '../state/AppStateProvider';

export default function HomeScreen() {
  const router = useRouter();
  const { habitsState, gameState } = useAppState();
  const { habits, isLoaded, addHabit, toggleHabit, removeHabit } = habitsState;
  const {
    isReady,
    coins,
    freezes,
    levelInfo,
    dailyStreak,
    canBuyFreeze,
    registerCompletion,
    buyFreeze,
  } = gameState;

  const [title, setTitle] = useState('');
  const today = toDateKey();

  const doneToday = habits.filter((habit) => habit.completedDates.includes(today)).length;
  const progress = habits.length === 0 ? 0 : doneToday / habits.length;

  function handleAdd() {
    addHabit(title);
    setTitle('');
  }

  function handleToggle(habit: Habit) {
    const wasDone = habit.completedDates.includes(today);
    toggleHabit(habit.id);
    registerCompletion(!wasDone);
  }

  function confirmRemove(id: string, habitTitle: string) {
    Alert.alert('Remover hábito', `Remover "${habitTitle}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeHabit(id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Zelora</Text>
        <Pressable style={styles.goalsButton} onPress={() => router.push('/goals')}>
          <Text style={styles.goalsButtonText}>🎯 Metas</Text>
        </Pressable>
      </View>

      <LevelCard levelInfo={levelInfo} ready={isReady} />

      <GameHeader
        streak={dailyStreak}
        coins={coins}
        freezes={freezes}
        canBuyFreeze={canBuyFreeze}
        onBuyFreeze={buyFreeze}
      />

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
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Adicionar</Text>
        </Pressable>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(habit) => habit.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {isLoaded ? 'Nenhum hábito ainda. Adicione o primeiro acima.' : 'Carregando...'}
          </Text>
        }
        renderItem={({ item }) => (
          <HabitItem
            habit={item}
            today={today}
            onToggle={() => handleToggle(item)}
            onLongPress={() => confirmRemove(item.id, item.title)}
          />
        )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  goalsButton: {
    backgroundColor: '#1d1f2b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  goalsButtonText: {
    color: '#ffffff',
    fontWeight: '600',
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
});