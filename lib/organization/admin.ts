import { supabase } from '../supabase';
import { OrganizationMember } from './types';

export const buildOrganizationTree = async () => {
    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select(`
                *,
                nft_purchase_requests (
                    id,
                    status,
                    nft_id,
                    nft_settings (
                        id,
                        price,
                        name
                    )
                )
            `)
            .eq('status', 'active');

        if (!profiles || error) return null;

        return profiles;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}; 