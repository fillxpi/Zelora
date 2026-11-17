import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GoalProgress } from './goalLogic';
import type { Goal } from './goalTypes';

type Props = {
  goal: Goal;
  progress: GoalProgress;
  onLongPress: () => void;
};

export function GoalCard({ goal, progress, onLongPress }: Props) {
  const percent = Math.round(progress.ratio * 100);

  return (
    <Pressable
      style={[styles.card, progress.isComplete && styles.cardComplete]}
      onLongPress={onLongPress}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>{goal.title}</Text>
        <Text style={styles.percent}>{percent}%</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress.ratio * 100}%` }]} />
      </View>

      <Text style={styles.counter}>
        {progress.completed} de {progress.target} conclusões
      </Text>

      <View style={styles.milestones}>
        {progress.milestones.map((milestone) => (
          <Text
            key={milestone.id}
            style={[styles.milestone, milestone.reached && styles.milestoneReached]}
          >
            {milestone.reached ? '✓' : '○'} {milestone.title} ({milestone.requiredCompletions})
          </Text>
        ))}
      </View>

      {progress.isComplete && <Text style={styles.completeText}>🎉 Meta concluída!</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1d1f2b',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  cardComplete: {
    backgroundColor: '#243a2f',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  percent: {
    color: '#7c5cff',
    fontSize: 17,
    fontWeight: '700',
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2c2f40',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#7c5cff',
  },
  counter: {
    color: '#d6d8e6',
    fontSize: 13,
  },
  milestones: {
    gap: 4,
  },
  milestone: {
    color: '#8b8fa3',
    fontSize: 13,
  },
  milestoneReached: {
    color: '#9fd8b4',
  },
  completeText: {
    color: '#9fd8b4',
    fontWeight: '700',
  },
});