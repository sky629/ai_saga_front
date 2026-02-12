import axios from 'axios';
import type {
    CharacterResponse,
    ScenarioResponse,
    GameSessionResponse,
    GameActionResponse,
    GameActionRequest,
    StartGameRequest,
    CursorPaginatedResponse,
    MessageHistoryResponse
} from '../types/api';

// TODO: Use env variable
const API_URL = 'http://localhost:8000/api/v1/game';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

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

    sendAction: async (sessionId: string, action: string): Promise<GameActionResponse> => {
        const payload: GameActionRequest = { action };
        const response = await api.post<GameActionResponse | any>(`/sessions/${sessionId}/actions/`, payload, {
            headers: {
                'Idempotency-Key': self.crypto.randomUUID()
            }
        });
        return response.data;
    },


    getLoginUrl: async (): Promise<{ auth_url: string }> => {
        // Use global axios or create a new instance to avoid /game prefix from 'api' instance
        // hardcoding base for now or use relative if proxy setup (we use absolute http://localhost:8000/api/v1)
        const response = await axios.get<{ auth_url: string }>('http://localhost:8000/api/v1/auth/google/login/');
        return response.data;
    },

    exchangeCodeForToken: async (code: string, state: string): Promise<{ access_token: string; token_type: string; user: any }> => {
        const response = await axios.get<{ access_token: string; token_type: string; user: any }>('http://localhost:8000/api/v1/auth/google/callback/', {
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
};
