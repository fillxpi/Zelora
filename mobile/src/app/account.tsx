import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppState } from '../state/AppStateProvider';

const STATUS_LABEL = {
  idle: 'Sincronização ativa',
  syncing: 'Sincronizando...',
  offline: 'Sem conexão',
  error: 'Erro ao sincronizar',
};

export default function AccountScreen() {
  const { syncState } = useAppState();
  const {
    isLoggedIn,
    email: accountEmail,
    status,
    message,
    hasConflict,
    authenticate,
    logout,
    syncNow,
    showConflict,
  } = syncState;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const busy = status === 'syncing';

  async function submit(mode: 'login' | 'register') {
    setError(null);
    const result = await authenticate(mode, email, password);
    if (result) {
      setError(result);
    } else {
      setPassword('');
    }
  }

  function confirmLogout() {
    Alert.alert(
      'Sair da conta',
      'Seus dados continuam neste aparelho, mas deixam de ser sincronizados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            void logout();
          },
        },
      ],
    );
  }

  if (isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.label}>Conectado como</Text>
          <Text style={styles.email}>{accountEmail}</Text>
          <Text style={styles.status}>{STATUS_LABEL[status]}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>

        {hasConflict ? (
          <Pressable style={styles.primaryButton} onPress={showConflict}>
            <Text style={styles.buttonText}>Resolver diferença de dados</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.primaryButton} onPress={() => void syncNow()} disabled={busy}>
            {busy ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Sincronizar agora</Text>}
          </Pressable>
        )}

        <Pressable style={styles.secondaryButton} onPress={confirmLogout}>
          <Text style={styles.buttonText}>Sair</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.intro}>
        Entre para guardar seus hábitos, metas e progresso na nuvem. O app continua funcionando sem
        conta.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#8b8fa3"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha (mínimo 8 caracteres)"
        placeholderTextColor="#8b8fa3"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={() => void submit('login')} disabled={busy}>
        {busy ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Entrar</Text>}
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => void submit('register')} disabled={busy}>
        <Text style={styles.buttonText}>Criar conta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12131a',
    padding: 20,
    gap: 12,
  },
  intro: {
    color: '#d6d8e6',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#1d1f2b',
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  label: {
    color: '#8b8fa3',
  },
  email: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  status: {
    color: '#d6d8e6',
    marginTop: 8,
  },
  message: {
    color: '#ffb86b',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#1d1f2b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
  },
  error: {
    color: '#ff7b7b',
  },
  primaryButton: {
    backgroundColor: '#7c5cff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#1d1f2b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});