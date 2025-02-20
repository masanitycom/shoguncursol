export const fetchUserNFTs = async (userId: string) => {
    try {
        const { data: nftData, error } = await supabase
            .from('nft_purchase_requests')
            .select(`
                id,
                status,
                created_at,
                approved_at,
                nft_settings (
                    name,
                    price,
                    daily_rate,
                    image_url
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'approved');

        if (error) throw error;

        return nftData?.map(nft => ({
            id: nft.id,
            name: nft.nft_settings.name,
            price: Number(nft.nft_settings.price),
            daily_rate: Number(nft.nft_settings.daily_rate),
            purchase_date: nft.approved_at || nft.created_at,
            reward_claimed: false,
            image_url: nft.nft_settings.image_url || '/images/nft3000.png'
        })) || [];

    } catch (error) {
        console.error('Error fetching NFTs:', error);
        return [];
    }
}; 