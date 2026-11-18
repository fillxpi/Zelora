import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'zelora_token';
const META_KEY = 'zelora:sync';

export type Session = {
  token: string;
  email: string;
  /** Versão do servidor que este aparelho conhece. */
  revision: number;
  /** Dados (em formato padronizado) da última vez que ficaram iguais aos do servidor. */
  lastSyncedJson: string | null;
};

export async function loadSession(): Promise<Session | null> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const raw = await AsyncStorage.getItem(META_KEY);
    if (!token || !raw) return null;

    const meta = JSON.parse(raw) as Omit<Session, 'token'>;
    return { token, ...meta };
  } catch {
    return null;
  }
}

export async function saveSession(session: Session): Promise<void> {
  const { token, ...meta } = session;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
}

export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await AsyncStorage.removeItem(META_KEY);
  } catch {
    // Se falhar, a próxima leitura não encontra uma sessão completa mesmo assim.
  }
}