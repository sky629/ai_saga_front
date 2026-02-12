// Generated based on OpenAPI Spec

// Game State Structures
export interface GameState {
    items: string[];
    visited_locations: string[];
    met_npcs: string[];
    discoveries: string[];
}

export interface StateChanges {
    hp_change?: number;
    items_gained?: string[];
    items_lost?: string[];
    location?: string;
    npcs_met?: string[];
    discoveries?: string[];
}

export interface ParsedGameResponse {
    narrative: string;
    options: string[];
    state_changes?: StateChanges;
}

export interface CharacterStatsResponse {
    hp: number;
    max_hp: number;
    level: number;
}

export interface CharacterResponse {
    id: string;
    user_id: string;
    scenario_id: string;
    name: string;
    description?: string | null;
    stats: CharacterStatsResponse;
    inventory: any[]; // Defined as empty object in spec for now
    is_active: boolean;
    created_at: string;
}

export interface UserResponse {
    id: string;
    email: string;
    name: string;
    user_level: number;
    profile_image_url?: string | null;
    is_active: boolean;
    email_verified: boolean;
    last_login_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface SessionListResponse {
    id: string;
    character_name: string;
    scenario_name: string;
    status: 'active' | 'completed' | 'abandoned';
    turn_count: number;
    max_turns: number;
    started_at: string;
    last_activity_at: string;
    ending_type?: string | null;
    character: CharacterResponse;
}

export interface GameSessionResponse {
    id: string;
    character_id: string;
    scenario_id: string;
    current_location: string;
    game_state: GameState;  // 변경: 구체적인 타입 지정
    status: string;
    turn_count: number;
    max_turns: number;  // 추가: max_turns 필드
    ending_type?: string | null;
    started_at: string;
    last_activity_at: string;
    image_url?: string | null;
}

export interface StartGameRequest {
    character_id: string;
    scenario_id: string;
    max_turns?: number | null;
}

export interface GameMessageResponse {
    id: string;
    role: string;
    content: string;
    parsed_response?: Record<string, any> | null;
    created_at: string;
}

export interface MessageHistoryResponse {
    id: string;
    role: string;
    content: string;
    created_at: string;
    parsed_response?: Record<string, any> | null;
}

export interface GameActionRequest {
    action: string;
}

export interface GameActionResponse {
    message: GameMessageResponse;
    narrative: string;
    options: string[];
    turn_count: number;
    max_turns: number;
    is_ending: boolean;
    state_changes?: StateChanges | null;  // 변경: 구체적인 타입 지정
    image_url?: string | null;
}

export interface GameEndingResponse {
    session_id: string;
    ending_type: string;
    narrative: string;
    total_turns: number;
    character_name: string;
    scenario_name: string;
}

export interface CursorPaginatedResponse<T> {
    items: T[];
    next_cursor?: string | null;
    has_more: boolean;
}

export interface ScenarioResponse {
    id: string;
    name: string;
    description: string;
    genre: string;
    difficulty: string;
    max_turns: number;
    world_setting?: string | null;
    initial_location?: string | null;
    is_active: boolean;
}
