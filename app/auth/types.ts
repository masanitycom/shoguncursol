import { User } from '@supabase/supabase-js'

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    handleLogout: () => Promise<void>;
} 