interface NFTCardProps {
    nft: {
        id: string;
        name: string;
        price: number;
        daily_rate: number;
        image_url: string | null;
        created_at: string;
    };
}

export const NFTCard: React.FC<NFTCardProps> = ({ nft }) => {
    return (
        <div className="bg-gray-700 rounded-lg overflow-hidden">
            <div className="aspect-w-1 aspect-h-1">
                <img
                    src={nft.image_url || '/images/default-nft.png'}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/default-nft.png';
                    }}
                />
            </div>
            <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-2">{nft.name}</h3>
                <p className="text-gray-300">${nft.price.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Daily Rate: {nft.daily_rate}%</p>
            </div>
        </div>
    );
}; 