import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FREEZE_COST, MAX_FREEZES } from './rules';

type Props = {
  streak: number;
  coins: number;
  freezes: number;
  canBuyFreeze: boolean;
  onBuyFreeze: () => void;
};

export function GameHeader({ streak, coins, freezes, canBuyFreeze, onBuyFreeze }: Props) {
  const isFull = freezes >= MAX_FREEZES;

  return (
    <View style={styles.card}>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>🔥 {streak}</Text>
          <Text style={styles.statLabel}>dias seguidos</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statValue}>🪙 {coins}</Text>
          <Text style={styles.statLabel}>moedas</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statValue}>
            ❄️ {freezes}/{MAX_FREEZES}
          </Text>
          <Text style={styles.statLabel}>proteções</Text>
        </View>
      </View>

      <Pressable
        style={[styles.buyButton, !canBuyFreeze && styles.buyButtonDisabled]}
        disabled={!canBuyFreeze}
        onPress={onBuyFreeze}
      >
        <Text style={styles.buyButtonText}>
          {isFull ? 'Limite de proteções atingido' : `Comprar proteção de sequência (${FREEZE_COST} 🪙)`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1d1f2b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: '#8b8fa3',
    fontSize: 12,
  },
  buyButton: {
    backgroundColor: '#3b6ea8',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buyButtonDisabled: {
    opacity: 0.4,
  },
  buyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});