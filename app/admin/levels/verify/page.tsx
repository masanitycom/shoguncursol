'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LevelCalculator, LEVEL_REQUIREMENTS } from '@/lib/services/level-calculator'

interface VerificationError {
    message: string
}

// メタデータを削除（クライアントコンポーネントでは使用不可）
export default function VerifyPage() {
    const [userId, setUserId] = useState('');
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<VerificationError | null>(null);

    const verifyLevel = async () => {
        setLoading(true);
        try {
            // メソッドの存在確認
            console.log('LevelCalculator methods:', {
                checkRequiredNFT: !!LevelCalculator.checkRequiredNFT,
                calculateLines: !!LevelCalculator.calculateLines,
                calculateUserLevel: !!LevelCalculator.calculateUserLevel
            });

            // 各メソッドの実行結果を詳細にログ
            const hasNFT = await LevelCalculator.checkRequiredNFT(userId);
            console.log('NFT check details:', hasNFT);
            
            const lines = await LevelCalculator.calculateLines(userId);
            console.log('Code lines:', lines);
            
            const userLevel = await LevelCalculator.calculateUserLevel(userId);
            console.log('User level:', userLevel);

            setResults({
                hasRequiredNFT: hasNFT,
                lines,
                currentLevel: userLevel,
                nextLevel: userLevel ? LEVEL_REQUIREMENTS.find(l => {
                    const currentLevelReq = LEVEL_REQUIREMENTS.find(req => req.name === userLevel);
                    if (!currentLevelReq) return false;
                    
                    // レベル名の配列でインデックスを比較
                    const levelOrder = ['足軽', '武将', '代官', '奉行', '老中', '大老', '大名', '将軍'];
                    const currentIndex = levelOrder.indexOf(userLevel);
                    const candidateIndex = levelOrder.indexOf(l.name);
                    
                    return (
                        candidateIndex > currentIndex && 
                        l.maxLine > lines.maxLine && 
                        l.otherLines > lines.otherLines
                    );
                }) : null,
                debug: {
                    userId,
                    nftCheck: hasNFT,
                    linesCalc: lines,
                    levelCalc: userLevel
                }
            });
        } catch (error) {
            console.error('Error during verification:', error);
            setError({
                message: 'レベル検証中にエラーが発生しました'
            });
            
            setResults({
                error: error instanceof Error ? error.message :
                       typeof error === 'object' && error && 'message' in error ? (error as VerificationError).message :
                       'エラーが発生しました',
                debug: { error }
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">レベル検証</h1>
            
            <div className="mb-4">
                <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="ユーザーID"
                    className="border p-2 rounded"
                />
                <button
                    onClick={verifyLevel}
                    disabled={loading}
                    className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
                >
                    検証
                </button>
            </div>

            {results && (
                <div className="space-y-4">
                    <div className="bg-gray-100 p-4 rounded">
                        <h2 className="font-bold">NFT要件:</h2>
                        <p>{results.hasRequiredNFT ? '満たしている' : '満たしていない'}</p>
                    </div>

                    <div className="bg-gray-100 p-4 rounded">
                        <h2 className="font-bold">系列状況:</h2>
                        <p>最大系列: ${results.lines.maxLine}</p>
                        <p>他系列合計: ${results.lines.otherLines}</p>
                    </div>

                    <div className="bg-gray-100 p-4 rounded">
                        <h2 className="font-bold">現在のレベル:</h2>
                        <p>{results.currentLevel || 'レベルなし'}</p>
                        {results.nextLevel && (
                            <div className="mt-2">
                                <h3 className="font-bold">次のレベルまでの要件:</h3>
                                <p>最大系列: ${results.nextLevel.maxLine}</p>
                                <p>他系列必要額: ${results.nextLevel.otherLines}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
} 