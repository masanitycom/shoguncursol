const AirdropButton = ({ nft }: { nft: NFTWithReward }) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const purchaseDate = new Date(nft.purchase_date);
    const operationStartDate = new Date(purchaseDate);
    operationStartDate.setDate(operationStartDate.getDate() + 14);

    // 土日はボタンを無効化
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // 運用開始2週間後の月曜から金曜まで申請可能
    const canClaim = !isWeekend && today >= operationStartDate;

    return (
        <button
            disabled={!canClaim}
            className={`${
                canClaim 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-gray-400 cursor-not-allowed'
            } text-white px-4 py-2 rounded`}
            onClick={() => {/* エアドロップ申請処理 */}}
        >
            エアドロップを受け取る
        </button>
    );
}; 