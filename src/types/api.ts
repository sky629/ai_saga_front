// Generated based on OpenAPI Spec

// Game State Structures
export interface GameState {
    items?: string[];
    visited_locations?: string[];
    met_npcs?: string[];
    discoveries?: string[];
    hp?: number;
    max_hp?: number;
    internal_power?: number;
    external_power?: number;
    manuals?: ProgressionManual[];
    traits?: string[];
    title_candidates?: string[];
    remaining_turns?: number;
}

export interface StateChanges {
    hp_change?: number;
    items_gained?: string[];
    items_lost?: string[];
    location?: string;
    npcs_met?: string[];
    discoveries?: string[];
    internal_power_delta?: number;
    external_power_delta?: number;
    manuals_gained?: ProgressionManual[];
    manual_mastery_updates?: {
        name: string;
        mastery_delta: number;
    }[];
    traits_gained?: string[];
    title_candidates?: string[];
}

export type GameActionType =
    | 'combat'
    | 'social'
    | 'skill'
    | 'movement'
    | 'observation'
    | 'rest'
    | 'exploration'
    | 'progression'
    | 'question';

export type ScenarioGameType = 'trpg' | 'progression';

export interface ProgressionManual {
    name: string;
    category: string;
    mastery: number;
    aura: string;
}

export interface ProgressionStatusPanel {
    hp: number;
    max_hp: number;
    internal_power: number;
    external_power: number;
    manuals: ProgressionManual[];
    remaining_turns: number;
    elapsed_turns: number;
    escape_status: string;
}

export interface ProgressionAchievementBoard {
    character_name: string;
    scenario_name: string;
    title: string;
    escaped: boolean;
    total_score: number;
    hp: number;
    max_hp: number;
    internal_power: number;
    external_power: number;
    manuals: ProgressionManual[];
    remaining_turns: number;
    summary: string;
}

export interface GameActionOption {
    label: string;
    action_type: GameActionType;
    requires_dice: boolean;
}

export interface ParsedGameResponse {
    before_narrative?: string;
    narrative: string;
    options: GameActionOption[];
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
    profile?: CharacterProfile | null;
    stats: CharacterStatsResponse;
    inventory: unknown[];
    is_active: boolean;
    created_at: string;
}

export interface CharacterProfile {
    age: number;
    gender: '남성' | '여성' | '비공개';
    appearance: string;
    goal?: string | null;
}

export interface UserResponse {
    id: string;
    email: string;
    name: string;
    user_level: number;
    game_level: number;
    game_experience: number;
    game_current_experience: number;
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
    status: 'active' | 'paused' | 'completed' | 'ended';
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
    parsed_response?: Record<string, unknown> | null;
    image_url?: string | null;
    created_at: string;
}

export interface MessageHistoryResponse {
    id: string;
    role: string;
    content: string;
    created_at: string;
    parsed_response?: Record<string, unknown> | null;
}

export interface GameActionRequest {
    action: string;
    action_type?: GameActionType;
}

export interface DiceResult {
    roll: number;
    modifier: number;
    total: number;
    dc: number;
    is_success: boolean;
    is_critical: boolean;
    is_fumble: boolean;
    check_type: string;
    damage: number | null;
    display_text: string;
}

export interface GameActionResponse {
    message: GameMessageResponse;
    narrative: string;
    before_roll_narrative?: string | null;
    options: GameActionOption[];
    turn_count: number;
    max_turns: number;
    is_ending: boolean;
    state_changes?: StateChanges | null;  // 변경: 구체적인 타입 지정
    image_url?: string | null;
    dice_result?: DiceResult | null;
    status_panel?: ProgressionStatusPanel | null;
    xp_gained?: number;
    leveled_up?: boolean;
    new_game_level?: number;
}

export interface GameEndingResponse {
    session_id: string;
    ending_type: string;
    narrative: string;
    total_turns: number;
    character_name: string;
    scenario_name: string;
    xp_gained: number;
    new_game_level: number;
    leveled_up: boolean;
    levels_gained: number;
    image_url?: string | null;
    achievement_board?: ProgressionAchievementBoard | null;
    is_ending?: boolean;
}

export type GameTurnResponse = GameActionResponse | GameEndingResponse;

export interface CursorPaginatedResponse<T> {
    items: T[];
    next_cursor?: string | null;
    has_more: boolean;
}

export interface ScenarioResponse {
    id: string;
    name: string;
    description: string;
    game_type: ScenarioGameType;
    genre: string;
    difficulty: string;
    max_turns: number;
    tags: string[];
    thumbnail_url?: string | null;
    hook?: string | null;
    recommended_for?: string | null;
    world_setting?: string | null;
    initial_location?: string | null;
    is_active: boolean;
}

export interface IllustrationResponse {
    message_id: string;
    image_url: string;
}
