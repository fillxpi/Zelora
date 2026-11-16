import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getLastDays } from '../../lib/date';
import { getCurrentStreak } from './streak';
import type { Habit } from './types';

type Props = {
  habit: Habit;
  today: string;
  onToggle: () => void;
  onLongPress: () => void;
};

export function HabitItem({ habit, today, onToggle, onLongPress }: Props) {
  const isDone = habit.completedDates.includes(today);
  const streak = getCurrentStreak(habit.completedDates, today);
  const lastDays = getLastDays(7, today);

  return (
    <Pressable
      style={[styles.container, isDone && styles.containerDone]}
      onPress={onToggle}
      onLongPress={onLongPress}
    >
      <Text style={styles.check}>{isDone ? '✓' : '○'}</Text>

      <View style={styles.content}>
        <Text style={[styles.title, isDone && styles.titleDone]}>{habit.title}</Text>

        <View style={styles.weekRow}>
          {lastDays.map((day) => (
            <View
              key={day}
              style={[
                styles.dot,
                habit.completedDates.includes(day) && styles.dotDone,
                day === today && styles.dotToday,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={[styles.streakBadge, streak === 0 && styles.streakBadgeInactive]}>
        <Text style={styles.streakText}>🔥 {streak}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1d1f2b',
    borderRadius: 14,
    padding: 16,
  },
  containerDone: {
    backgroundColor: '#243a2f',
  },
  check: {
    color: '#ffffff',
    fontSize: 18,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
  },
  titleDone: {
    color: '#9fd8b4',
    textDecorationLine: 'line-through',
  },
  weekRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2c2f40',
  },
  dotDone: {
    backgroundColor: '#7c5cff',
  },
  dotToday: {
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  streakBadge: {
    backgroundColor: '#3a2a1c',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  streakBadgeInactive: {
    opacity: 0.45,
  },
  streakText: {
    color: '#ffb35c',
    fontWeight: '700',
  },
});