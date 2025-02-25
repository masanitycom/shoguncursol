'use client'

import { useEffect, useState } from 'react'
import { Tree } from 'react-d3-tree'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { OrganizationMember } from '@/types/organization'
import { getLevelLabel } from '@/lib/userLevel'
import Header from '@/components/Header'
import { getUserProfile } from '@/lib/userProfile'
import { calculateUserLevel } from '@/lib/userLevel'
import { useRouter } from 'next/navigation'

export default function OrganizationPage() {
    const [organizationData, setOrganizationData] = useState<OrganizationMember[]>([])
    const [error, setError] = useState<string | null>(null)
    const { user, signOut } = useAuth()
    const router = useRouter()

    // 傘下全体の投資額を計算する関数
    const calculateTotalTeamInvestment = (members: any[]): number => {
        return members.reduce((total, member) => {
            return total + (member.investment_amount || 0) + calculateTotalTeamInvestment(member.children || [])
        }, 0)
    }

    const buildOrganizationData = (profile: any, children: any[]): OrganizationMember[] => {
        // 傘下メンバーの投資額を計算
        const totalTeamInvestment = calculateTotalTeamInvestment(children)

        return [{
            ...profile,
            total_team_investment: totalTeamInvestment, // 傘下全体の投資額を設定
            level: calculateUserLevel({
                ...profile,
                total_team_investment: totalTeamInvestment // レベル計算時にも反映
            }),
            children: children.map(member => ({
                ...member,
                total_team_investment: calculateTotalTeamInvestment(member.children || []),
                level: calculateUserLevel(member),
                children: []
            }))
        }]
    }

    useEffect(() => {
        const loadOrganizationData = async () => {
            try {
                if (!user?.id) {
                    router.push('/login')
                    return
                }

                // ユーザー自身のプロフィールを取得
                const { data: rootProfile, error: rootError } = await supabase
                    .from('profiles')
                    .select(`
                        id,
                        user_id,
                        name,
                        display_id,
                        referrer_id,
                        investment_amount,
                        max_line_investment,
                        other_lines_investment,
                        total_team_investment,
                        nft_purchase_requests (
                            id,
                            status,
                            nft_master (
                                id,
                                name,
                                price,
                                daily_rate
                            )
                        )
                    `)
                    .eq('user_id', user.id)
                    .single()

                if (rootError) throw rootError

                // 直接の紹介メンバーを取得
                const { data: members, error: membersError } = await supabase
                    .from('profiles')
                    .select(`
                        id,
                        user_id,
                        name,
                        display_id,
                        referrer_id,
                        investment_amount,
                        max_line_investment,
                        other_lines_investment,
                        total_team_investment,
                        nft_purchase_requests (
                            id,
                            status,
                            nft_master (
                                id,
                                name,
                                price,
                                daily_rate
                            )
                        )
                    `)
                    .eq('referrer_id', user.id)

                if (membersError) throw membersError

                setOrganizationData(buildOrganizationData(rootProfile, members || []))

            } catch (error) {
                console.error('Error loading organization data:', error)
                setError('データの読み込みに失敗しました')
            }
        }

        loadOrganizationData()
    }, [user, router])

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            router.push('/login')
        } catch (error) {
            console.error('ログアウトエラー:', error)
            setError('ログアウトに失敗しました')
        }
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} onLogout={handleLogout} />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-white mb-6">組織図</h1>
                {error ? (
                    <div className="text-red-500">{error}</div>
                ) : (
                    <div>
                        {organizationData.map((member, index) => (
                            <div key={member.id} className={`mb-4 ${index === 0 ? '' : 'ml-8'}`}>
                                <div className={`bg-gray-800 p-4 rounded-lg ${index === 0 ? 'border border-blue-500' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            {index === 0 ? (
                                                <>
                                                    <span className="text-white font-medium">{member.name}</span>
                                                    <span className="text-gray-400 ml-2">({member.display_id})</span>
                                                </>
                                            ) : (
                                                <span className="text-white font-medium">{member.display_id}</span>
                                            )}
                                            <span className="px-2 py-1 bg-red-600 rounded text-xs text-white ml-2">
                                                {getLevelLabel(member)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-400 mt-2">
                                        <div>投資額: ${member.investment_amount.toLocaleString()}</div>
                                        <div>最大系列: ${member.max_line_investment.toLocaleString()}</div>
                                        <div>他系列: ${member.other_lines_investment.toLocaleString()}</div>
                                        <div>傘下全体: ${member.total_team_investment.toLocaleString()}</div>
                                    </div>
                                </div>
                                {member.children.length > 0 && (
                                    <div className="mt-2">
                                        {member.children.map(child => (
                                            <div key={child.id} className="ml-8">
                                                <div className="bg-gray-800 p-4 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <span className="text-white font-medium">{child.display_id}</span>
                                                            <span className="px-2 py-1 bg-red-600 rounded text-xs text-white ml-2">
                                                                {getLevelLabel(child)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-400 mt-2">
                                                        <div>投資額: ${child.investment_amount.toLocaleString()}</div>
                                                        <div>最大系列: ${child.max_line_investment.toLocaleString()}</div>
                                                        <div>他系列: ${child.other_lines_investment.toLocaleString()}</div>
                                                        <div>傘下全体: ${child.total_team_investment.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}