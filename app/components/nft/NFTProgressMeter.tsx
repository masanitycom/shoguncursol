interface NFTProgressMeterProps {
    initialAmount: number;     // NFT購入額
    currentProfit: number;     // 現在の累積報酬
    maxProfitPercentage: number; // 300%
}

export const NFTProgressMeter: React.FC<NFTProgressMeterProps> = ({
    initialAmount,
    currentProfit,
    maxProfitPercentage = 300
}) => {
    const progressPercentage = (currentProfit / (initialAmount * (maxProfitPercentage / 100))) * 100;
    
    return (
        <div className="w-full bg-gray-800 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                <span className="text-sm text-gray-300 mb-2 sm:mb-0">報酬進捗</span>
                <span className="text-sm text-gray-300">
                    {progressPercentage.toFixed(1)}% / {maxProfitPercentage}%
                </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 sm:h-3">
                <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
            </div>
            <div className="mt-4 text-sm sm:text-base text-gray-400 text-center sm:text-left">
                累積報酬: ${currentProfit.toLocaleString()}
            </div>
        </div>
    );
}; 