export interface User {
    id: string;
    email: string;
    name: string;
    picture?: string;
    level?: number;
    game_level?: number;
    game_experience?: number;
    game_current_experience?: number;
}
