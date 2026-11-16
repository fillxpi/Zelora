import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Habit } from './types';

const STORAGE_KEY = 'zelora:habits';

export async function loadHabits(): Promise<Habit[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Habit[]) : [];
  } catch {
    return [];
  }
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch {
    // Por enquanto, falhas de gravação são ignoradas.
  }
}