import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '../features/game/GameHeader';
import { COINS_PER_COMPLETION } from '../features/game/rules';
import { useGame } from '../features/game/useGame';
import { HabitItem } from '../features/habits/HabitItem';
import type { Habit } from '../features/habits/types';
import { useHabits } from '../features/habits/useHabits';
import { toDateKey } from '../lib/date';

export default function HomeScreen() {
  const { habits, isLoaded, addHabit, toggleHabit, removeHabit } = useHabits();
  const [title, setTitle] = useState('');
  const today = toDateKey();

  const activeDates = habits.flatMap((habit) => habit.completedDates);
  const { coins, freezes, dailyStreak, canBuyFreeze, addCoins, buyFreeze } = useGame(
    activeDates,
    isLoaded,
  );

  const doneToday = habits.filter((habit) => habit.completedDates.includes(today)).length;
  const progress = habits.length === 0 ? 0 : doneToday / habits.length;

  function handleAdd() {
    addHabit(title);
    setTitle('');
  }

  function handleToggle(habit: Habit) {
    const wasDone = habit.completedDates.includes(today);
    toggleHabit(habit.id);
    // Concluir ganha moedas; desmarcar devolve, para não dar para "farmar" moedas.
    addCoins(wasDone ? -COINS_PER_COMPLETION : COINS_PER_COMPLETION);
  }

  function confirmRemove(id: string, habitTitle: string) {
    Alert.alert('Remover hábito', `Remover "${habitTitle}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeHabit(id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Zelora</Text>

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
});