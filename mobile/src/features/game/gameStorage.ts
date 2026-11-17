import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GameState } from './gameTypes';

const STORAGE_KEY = 'zelora:game';

export const DEFAULT_GAME_STATE: GameState = {
  coins: 0,
  xp: 0,
  freezes: 0,
  frozenDates: [],
  lastCheckedDate: null,
  claimedMilestones: [],
};

export async function loadGameState(): Promise<GameState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_GAME_STATE;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_GAME_STATE;

    return { ...DEFAULT_GAME_STATE, ...(parsed as Partial<GameState>) };
  } catch {
    return DEFAULT_GAME_STATE;
  }
}

export async function saveGameState(state: GameState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Por enquanto, falhas de gravação são ignoradas.
  }
}