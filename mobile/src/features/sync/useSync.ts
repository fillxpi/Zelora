import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';

import { ApiError, apiRequest } from '../../lib/api';
import type { GameState } from '../game/gameTypes';
import type { Goal } from '../goals/goalTypes';
import type { Habit } from '../habits/types';
import { canonicalize, canonicalJson, isEmptySnapshot } from './syncLogic';
import type { ServerSnapshot, Snapshot } from './syncLogic';
import { clearSession, loadSession, saveSession } from './syncSession';
import type { Session } from './syncSession';

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';
type Choice = 'local' | 'cloud';

type Params = {
  /** true quando hábitos, metas e jogo já foram carregados do aparelho */
  ready: boolean;
  habits: Habit[];
  goals: Goal[];
  game: GameState;
  /** Troca os dados do aparelho pelos que vieram da nuvem. */
  replaceAll: (snapshot: Snapshot) => void;
};

export function useSync({ ready, habits, goals, game, replaceAll }: Params) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [hasConflict, setHasConflict] = useState(false);

  const snapshot = useMemo<Snapshot>(() => ({ habits, goals, game }), [habits, goals, game]);
  const localJson = useMemo(() => canonicalJson(snapshot), [snapshot]);

  // Refs guardam sempre o valor mais recente para as funções assíncronas.
  const latest = useRef(snapshot);
  const replaceAllRef = useRef(replaceAll);
  const sessionRef = useRef<Session | null>(null);
  const conflictRef = useRef<ServerSnapshot | null>(null);
  const busy = useRef(false);
  const resolveRef = useRef<(choice: Choice) => Promise<void>>(async () => {});

  useEffect(() => {
    latest.current = snapshot;
    replaceAllRef.current = replaceAll;
  });

  useEffect(() => {
    let active = true;

    loadSession().then((stored) => {
      if (!active) return;
      sessionRef.current = stored;
      setSession(stored);
      setSessionLoaded(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const updateSession = useCallback(async (next: Session | null) => {
    sessionRef.current = next;
    setSession(next);
    if (next) {
      await saveSession(next);
    } else {
      await clearSession();
    }
  }, []);

  const setConflict = useCallback((server: ServerSnapshot | null) => {
    conflictRef.current = server;
    setHasConflict(server !== null);
  }, []);

  const reportError = useCallback(
    async (error: unknown) => {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setConflict(null);
          await updateSession(null);
          setStatus('idle');
          setMessage('Sessão expirada. Entre novamente.');
          return;
        }
        if (error.status === 0) {
          setStatus('offline');
          setMessage('Sem conexão com o servidor. Tentaremos de novo depois.');
          return;
        }
        setStatus('error');
        setMessage(error.message);
        return;
      }
      setStatus('error');
      setMessage('Erro inesperado na sincronização.');
    },
    [setConflict, updateSession],
  );

  /** Troca os dados do aparelho pelos da nuvem e guarda a nova versão. */
  const applyCloudData = useCallback(
    async (server: ServerSnapshot) => {
      const { revision, ...data } = server;
      replaceAllRef.current(data);

      const current = sessionRef.current;
      if (current) {
        await updateSession({ ...current, revision, lastSyncedJson: canonicalJson(data) });
      }
    },
    [updateSession],
  );

  /** Envia os dados do aparelho. Devolve 'ok' ou os dados do servidor se houver conflito. */
  const pushLocal = useCallback(
    async (baseRevision: number): Promise<'ok' | ServerSnapshot> => {
      const current = sessionRef.current;
      if (!current) return 'ok';

      const payload = canonicalize(latest.current);
      const sentJson = JSON.stringify(payload);

      try {
        const result = await apiRequest<ServerSnapshot>('/sync', {
          method: 'PUT',
          token: current.token,
          body: { baseRevision, ...payload },
        });
        await updateSession({ ...current, revision: result.revision, lastSyncedJson: sentJson });
        return 'ok';
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          return (error.body as { server: ServerSnapshot }).server;
        }
        throw error;
      }
    },
    [updateSession],
  );

  const showConflict = useCallback(() => {
    Alert.alert(
      'Dados diferentes',
      'Este aparelho e a nuvem têm dados diferentes. Qual versão você quer manter? A outra será substituída.',
      [
        { text: 'Decidir depois', style: 'cancel' },
        {
          text: 'Usar a da nuvem',
          onPress: () => {
            void resolveRef.current('cloud');
          },
        },
        {
          text: 'Manter deste aparelho',
          onPress: () => {
            void resolveRef.current('local');
          },
        },
      ],
    );
  }, []);

  const raiseConflict = useCallback(
    (server: ServerSnapshot) => {
      setConflict(server);
      setStatus('idle');
      setMessage('Os dados deste aparelho e da nuvem são diferentes.');
      showConflict();
    },
    [setConflict, showConflict],
  );

  const resolveConflict = useCallback(
    async (choice: Choice) => {
      const server = conflictRef.current;
      if (!server || busy.current) return;

      busy.current = true;
      setStatus('syncing');

      try {
        if (choice === 'cloud') {
          await applyCloudData(server);
          setConflict(null);
        } else {
          const result = await pushLocal(server.revision);
          if (result !== 'ok') {
            raiseConflict(result);
            return;
          }
          setConflict(null);
        }
        setStatus('idle');
        setMessage(null);
      } catch (error) {
        await reportError(error);
      } finally {
        busy.current = false;
      }
    },
    [applyCloudData, pushLocal, raiseConflict, reportError, setConflict],
  );

  useEffect(() => {
    resolveRef.current = resolveConflict;
  });

  /** Sincroniza: envia se o aparelho mudou; senão, busca se a nuvem tiver novidades. */
  const syncNow = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || busy.current || conflictRef.current) return;

    busy.current = true;
    setStatus('syncing');

    try {
      if (canonicalJson(latest.current) !== current.lastSyncedJson) {
        const result = await pushLocal(current.revision);
        if (result !== 'ok') {
          raiseConflict(result);
          return;
        }
      } else {
        const server = await apiRequest<ServerSnapshot>('/sync', { token: current.token });
        if (server.revision !== current.revision) {
          await applyCloudData(server);
        }
      }
      setStatus('idle');
      setMessage(null);
    } catch (error) {
      await reportError(error);
    } finally {
      busy.current = false;
    }
  }, [applyCloudData, pushLocal, raiseConflict, reportError]);

  /** Primeira sincronização logo depois de entrar na conta. */
  const initialSync = useCallback(
    async (newSession: Session) => {
      const server = await apiRequest<ServerSnapshot>('/sync', { token: newSession.token });
      const { revision, ...serverData } = server;
      const local = latest.current;
      const localJson = canonicalJson(local);

      const serverEmpty = revision === 0 || isEmptySnapshot(serverData);
      const localEmpty = isEmptySnapshot(local);

      if (localJson === canonicalJson(serverData)) {
        await updateSession({ ...newSession, revision, lastSyncedJson: localJson });
      } else if (serverEmpty) {
        await updateSession({ ...newSession, revision, lastSyncedJson: null });
        const result = await pushLocal(revision);
        if (result !== 'ok') raiseConflict(result);
      } else if (localEmpty) {
        await updateSession({ ...newSession, revision, lastSyncedJson: null });
        await applyCloudData(server);
      } else {
        await updateSession({ ...newSession, revision, lastSyncedJson: null });
        raiseConflict(server);
      }
    },
    [applyCloudData, pushLocal, raiseConflict, updateSession],
  );

  /** Entra (login) ou cria a conta (register). Devolve uma mensagem de erro ou null. */
  const authenticate = useCallback(
    async (mode: 'login' | 'register', email: string, password: string): Promise<string | null> => {
      if (busy.current) return 'Aguarde a sincronização terminar.';

      busy.current = true;
      setStatus('syncing');
      setMessage(null);

      try {
        const result = await apiRequest<{ token: string; user: { email: string } }>(
          `/auth/${mode}`,
          { method: 'POST', body: { email: email.trim(), password } },
        );
        const newSession: Session = {
          token: result.token,
          email: result.user.email,
          revision: 0,
          lastSyncedJson: null,
        };
        await updateSession(newSession);
        await initialSync(newSession);
        setStatus('idle');
        return null;
      } catch (error) {
        setStatus('idle');
        if (error instanceof ApiError) {
          return error.status === 0
            ? 'Sem conexão com o servidor. Confira o endereço da API e a rede.'
            : error.message;
        }
        return 'Erro inesperado.';
      } finally {
        busy.current = false;
      }
    },
    [initialSync, updateSession],
  );

  const logout = useCallback(async () => {
    setConflict(null);
    await updateSession(null);
    setStatus('idle');
    setMessage(null);
  }, [setConflict, updateSession]);

  // Sincroniza ao abrir o app, depois que tudo foi carregado.
  useEffect(() => {
    if (ready && sessionLoaded && sessionRef.current) {
      void syncNow();
    }
  }, [ready, sessionLoaded, syncNow]);

  // Sincroniza 2 segundos depois de qualquer mudança nos dados.
  const dirty = session !== null && localJson !== session.lastSyncedJson;

  useEffect(() => {
    if (!ready || !dirty || hasConflict) return;

    const timer = setTimeout(() => {
      void syncNow();
    }, 2000);

    return () => clearTimeout(timer);
  }, [ready, dirty, localJson, hasConflict, syncNow]);

  // Sincroniza quando o app volta para a tela.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncNow();
      }
    });

    return () => subscription.remove();
  }, [syncNow]);

  return {
    isLoggedIn: session !== null,
    email: session?.email ?? null,
    status,
    message,
    hasConflict,
    authenticate,
    logout,
    syncNow,
    showConflict,
  };
}