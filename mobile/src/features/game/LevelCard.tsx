import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { getAvatarStage } from './level';
import type { LevelInfo } from './level';

type Props = {
  levelInfo: LevelInfo;
  /** true quando os dados salvos já foram carregados (evita animar o nível na abertura do app). */
  ready: boolean;
};

export function LevelCard({ levelInfo, ready }: Props) {
  const { level, xpIntoLevel, xpNeeded, progress } = levelInfo;
  const stage = getAvatarStage(level);

  const fill = useRef(new Animated.Value(progress)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const previousLevel = useRef<number | null>(null);

  // Barra de XP enchendo suavemente.
  useEffect(() => {
    Animated.timing(fill, { toValue: progress, duration: 400, useNativeDriver: false }).start();
  }, [progress, fill]);

  // Avatar "pula" quando o usuário sobe de nível.
  useEffect(() => {
    if (!ready) return;

    if (previousLevel.current !== null && level > previousLevel.current) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.35, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }

    previousLevel.current = level;
  }, [ready, level, scale]);

  const barWidth = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.card}>
      <Animated.Text style={[styles.avatar, { transform: [{ scale }] }]}>
        {stage.emoji}
      </Animated.Text>

      <View style={styles.info}>
        <Text style={styles.levelText}>
          Nível {level} · {stage.name}
        </Text>

        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: barWidth }]} />
        </View>

        <Text style={styles.xpText}>
          {xpIntoLevel} / {xpNeeded} XP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#1d1f2b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  avatar: {
    fontSize: 52,
  },
  info: {
    flex: 1,
    gap: 8,
  },
  levelText: {
    color: '#ffffff',
    fontSize: 16,
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
    backgroundColor: '#5fd38d',
  },
  xpText: {
    color: '#8b8fa3',
    fontSize: 12,
  },
});