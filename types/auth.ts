import { User } from '@supabase/supabase-js';

export interface AuthState {
    user: User | null;
    loading: boolean;
    handleLogout: () => Promise<void>;
} 