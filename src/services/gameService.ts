import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
    CharacterResponse,
    ScenarioResponse,
    GameSessionResponse,
    GameTurnResponse,
    GameActionRequest,
    StartGameRequest,
    CursorPaginatedResponse,
    MessageHistoryResponse,
    IllustrationResponse,
    UserResponse,
} from '../types/api';
import { addSentryBreadcrumb, captureException } from '../sentry';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const API_URL = `${API_BASE_URL}/game`;
const AUTH_URL = `${API_BASE_URL}/auth`;

type RetryableConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};

let refreshPromise: Promise<string> | null = null;
let authFailureHandler: (() => void) | null = null;

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

const authApi = axios.create({
    baseURL: AUTH_URL,
    withCredentials: true,
});

export function setAuthFailureHandler(handler: (() => void) | null) {
    authFailureHandler = handler;
}

function getAccessToken() {
    return localStorage.getItem('access_token');
}

function setAccessToken(token: string) {
    localStorage.setItem('access_token', token);
}

async function refreshAccessToken(): Promise<string> {
    if (!refreshPromise) {
        refreshPromise = authApi
            .post<{ access_token: string }>('/refresh/', {})
            .then((response) => {
                const newToken = response.data.access_token;
                setAccessToken(newToken);
                return newToken;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

function attachRequestInterceptor(client: typeof api) {
    client.interceptors.request.use((config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
}

attachRequestInterceptor(api);
attachRequestInterceptor(authApi);

async function handleAuthRetry(error: AxiosError) {
    const originalConfig = error.config as RetryableConfig | undefined;
    const statusCode = error.response?.status;

    if (!originalConfig || statusCode !== 401 || originalConfig._retry) {
        throw error;
    }

    if (originalConfig.url?.includes('/refresh/')) {
        throw error;
    }

    originalConfig._retry = true;

    try {
        const newToken = await refreshAccessToken();
        originalConfig.headers.Authorization = `Bearer ${newToken}`;
        return api.request(originalConfig);
    } catch (refreshError) {
        localStorage.removeItem('access_token');
        if (authFailureHandler) {
            authFailureHandler();
        }
        throw refreshError;
    }
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (axios.isAxiosError(error)) {
            const statusCode = error.response?.status;
            const url = error.config?.url;
            const method = error.config?.method?.toUpperCase();

            addSentryBreadcrumb(
                'API request failed',
                'http',
                statusCode && statusCode >= 500 ? 'error' : 'warning',
                {
                    status_code: statusCode ?? 'network_error',
                    url,
                    method
                }
            );

            if (!statusCode || statusCode >= 500) {
                captureException(error, {
                    type: 'api_error',
                    statusCode: statusCode ?? null,
                    url,
                    method
                });
            }

            if (statusCode === 401) {
                return handleAuthRetry(error);
            }
        } else {
            captureException(error, {
                type: 'unknown_api_error'
            });
        }

        return Promise.reject(error);
    }
);

authApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            return handleAuthRetry(error);
        }
        return Promise.reject(error);
    }
);

export const authService = {
    getSelf: async (): Promise<UserResponse> => {
        const response = await authApi.get<UserResponse>('/self/');
        return response.data;
    },
};

export const gameService = {
    getCharacters: async (): Promise<CharacterResponse[]> => {
        const response = await api.get<CharacterResponse[]>('/characters/');
        return response.data;
    },

    getScenarios: async (): Promise<ScenarioResponse[]> => {
        const response = await api.get<ScenarioResponse[]>('/scenarios/');
        return response.data;
    },

    createCharacter: async (name: string, description: string, scenarioId: string): Promise<CharacterResponse> => {
        const response = await api.post<CharacterResponse>('/characters/', {
            name,
            description,
            scenario_id: scenarioId
        });
        return response.data;
    },

    getSessions: async (limit = 20): Promise<CursorPaginatedResponse<any>> => {
        // The API lists sessions generally, filtering by character might need query params if supported
        // API Spec says: list_sessions_api_v1_game_sessions_get(limit, cursor, status)
        const response = await api.get('/sessions/', { params: { limit } });
        return response.data;
    },

    getSession: async (sessionId: string): Promise<GameSessionResponse> => {
        const response = await api.get<GameSessionResponse>(`/sessions/${sessionId}/`);
        return response.data;
    },

    startGame: async (characterId: string, scenarioId: string): Promise<GameSessionResponse> => {
        const payload: StartGameRequest = { character_id: characterId, scenario_id: scenarioId };
        const response = await api.post<GameSessionResponse>('/sessions/', payload, {
            headers: {
                'Idempotency-Key': self.crypto.randomUUID()
            }
        });
        return response.data;
    },

    sendAction: async (sessionId: string, action: string): Promise<GameTurnResponse> => {
        const payload: GameActionRequest = { action };
        const response = await api.post<GameTurnResponse>(`/sessions/${sessionId}/actions/`, payload, {
            headers: {
                'Idempotency-Key': self.crypto.randomUUID()
            }
        });
        return response.data;
    },


    getLoginUrl: async (): Promise<{ auth_url: string }> => {
        const response = await axios.get<{ auth_url: string }>(`${API_BASE_URL}/auth/google/login/`);
        return response.data;
    },

    exchangeCodeForToken: async (code: string, state: string): Promise<{ access_token: string; token_type: string; user: any }> => {
        const response = await axios.get<{ access_token: string; token_type: string; user: any }>(`${API_BASE_URL}/auth/google/callback/`, {
            params: { code, state }
        });
        return response.data;
    },

    deleteSession: async (sessionId: string): Promise<void> => {
        await api.delete(`/sessions/${sessionId}/`);
    },

    getSessionMessages: async (sessionId: string, limit = 50, cursor?: string): Promise<CursorPaginatedResponse<MessageHistoryResponse>> => {
        const response = await api.get<CursorPaginatedResponse<MessageHistoryResponse>>(`/sessions/${sessionId}/messages/`, {
            params: { limit, cursor }
        });
        return response.data;
    }
,

    generateIllustration: async (sessionId: string, messageId: string): Promise<IllustrationResponse> => {
        const response = await api.post<IllustrationResponse>(
            `/sessions/${sessionId}/messages/${messageId}/illustration/`
        );
        return response.data;
    }
};
