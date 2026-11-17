import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Goal } from './goalTypes';

const STORAGE_KEY = 'zelora:goals';

export async function loadGoals(): Promise<Goal[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Goal[]) : [];
  } catch {
    return [];
  }
}

export async function saveGoals(goals: Goal[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch {
    // Por enquanto, falhas de gravação são ignoradas.
  }
}