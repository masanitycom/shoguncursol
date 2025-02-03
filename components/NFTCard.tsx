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

export function NFTCard({ nft }: NFTCardProps) {
  return (
    <div className="bg-gray-700 rounded-lg overflow-hidden">
      <div className="aspect-square relative w-full">
        {nft.image_url ? (
          <img
            src={nft.image_url}
            alt={nft.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
          Active
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-white text-sm mb-1">{nft.name}</h3>
        <div className="space-y-1 text-sm">
          <p className="text-emerald-400">${nft.price.toLocaleString()}</p>
          <p className="text-blue-400">
            日利上限: {(nft.daily_rate * 100).toFixed(2)}%
          </p>
          <p className="text-gray-400">
            購入日: {new Date(nft.created_at).toLocaleDateString('ja-JP')}
          </p>
        </div>
      </div>
    </div>
  );
} 