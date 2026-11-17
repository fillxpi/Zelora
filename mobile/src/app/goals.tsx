import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoalCard } from '../features/goals/GoalCard';
import { getGoalProgress } from '../features/goals/goalLogic';
import { useGoals } from '../features/goals/useGoals';
import { loadHabits } from '../features/habits/storage';
import type { Habit } from '../features/habits/types';

export default function GoalsScreen() {
  const { goals, isLoaded, addGoal, removeGoal } = useGoals();
  const [habits, setHabits] = useState<Habit[]>([]);

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);

  // Esta tela só lê os hábitos (quem altera é a tela inicial).
  useEffect(() => {
    loadHabits().then(setHabits);
  }, []);

  function toggleSelected(habitId: string) {
    setSelectedHabitIds((current) =>
      current.includes(habitId)
        ? current.filter((id) => id !== habitId)
        : [...current, habitId],
    );
  }

  function handleCreate() {
    const trimmed = title.trim();
    const targetNumber = Number.parseInt(target, 10);

    if (!trimmed) {
      Alert.alert('Falta o nome', 'Dê um nome para a meta.');
      return;
    }
    if (!Number.isInteger(targetNumber) || targetNumber < 1) {
      Alert.alert('Meta inválida', 'Informe um número de conclusões maior que zero.');
      return;
    }
    if (selectedHabitIds.length === 0) {
      Alert.alert('Escolha os hábitos', 'Selecione pelo menos um hábito para a meta.');
      return;
    }

    addGoal({ title: trimmed, target: targetNumber, habitIds: selectedHabitIds });
    setTitle('');
    setTarget('');
    setSelectedHabitIds([]);
  }

  function confirmRemove(id: string, goalTitle: string) {
    Alert.alert('Remover meta', `Remover "${goalTitle}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeGoal(id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Nova meta</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome (ex.: Rotina de estudos)"
            placeholderTextColor="#8b8fa3"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={styles.input}
            placeholder="Total de conclusões (ex.: 30)"
            placeholderTextColor="#8b8fa3"
            value={target}
            onChangeText={setTarget}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Hábitos que contam para esta meta:</Text>

          {habits.length === 0 ? (
            <Text style={styles.hint}>
              Você ainda não tem hábitos. Crie alguns na tela inicial primeiro.
            </Text>
          ) : (
            <View style={styles.chips}>
              {habits.map((habit) => {
                const selected = selectedHabitIds.includes(habit.id);
                return (
                  <Pressable
                    key={habit.id}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => toggleSelected(habit.id)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {habit.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Pressable style={styles.createButton} onPress={handleCreate}>
            <Text style={styles.createButtonText}>Criar meta</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Suas metas</Text>

        {goals.length === 0 ? (
          <Text style={styles.hint}>
            {isLoaded ? 'Nenhuma meta ainda. Crie a primeira acima.' : 'Carregando...'}
          </Text>
        ) : (
          goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              progress={getGoalProgress(goal, habits)}
              onLongPress={() => confirmRemove(goal.id, goal.title)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12131a',
  },
  content: {
    padding: 20,
    gap: 14,
  },
  formCard: {
    backgroundColor: '#1d1f2b',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#2c2f40',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
  },
  label: {
    color: '#d6d8e6',
  },
  hint: {
    color: '#8b8fa3',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#2c2f40',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: '#7c5cff',
  },
  chipText: {
    color: '#d6d8e6',
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#7c5cff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});