'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Header from '../../components/Header'

interface Member {
    id: string
    user_id: string
    investment_amount: number
    total_team_investment: number
    children: Member[]
    level: number
}

export default function OrganizationPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [organization, setOrganization] = useState<Member | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }
        setUser(session.user)
        await fetchOrganization(session.user.id)
    }

    const fetchOrganization = async (userId: string, level: number = 0) => {
        try {
            // 直接の紹介者を取得
            const { data: directReferrals, error } = await supabase
                .from('users')
                .select('id, user_id, investment_amount')
                .eq('referrer_id', userId)

            if (error) throw error

            // 各紹介者の傘下メンバーを再帰的に取得
            const members: Member[] = []
            for (const referral of directReferrals || []) {
                const children = await fetchOrganization(referral.id, level + 1)
                const totalTeamInvestment = calculateTotalInvestment(children)

                members.push({
                    id: referral.id,
                    user_id: referral.user_id,
                    investment_amount: referral.investment_amount || 0,
                    total_team_investment: totalTeamInvestment,
                    children,
                    level: level + 1
                })
            }

            if (level === 0) {
                // ルートユーザーの情報を設定
                const { data: userData } = await supabase
                    .from('users')
                    .select('user_id, investment_amount')
                    .eq('id', userId)
                    .single()

                const rootMember: Member = {
                    id: userId,
                    user_id: userData?.user_id || '',
                    investment_amount: userData?.investment_amount || 0,
                    total_team_investment: calculateTotalInvestment(members),
                    children: members,
                    level: 0
                }
                setOrganization(rootMember)
                setLoading(false)
            }

            return members
        } catch (error) {
            console.error('Error fetching organization:', error)
            return []
        }
    }

    const calculateTotalInvestment = (members: Member[]): number => {
        return members.reduce((total, member) => {
            return total + member.investment_amount + member.total_team_investment
        }, 0)
    }

    const renderMember = (member: Member) => {
        const paddingLeft = member.level * 40
        
        return (
            <div key={member.id}>
                <div 
                    className="bg-gray-800 p-4 rounded-lg mb-2 flex items-center justify-between"
                    style={{ marginLeft: `${paddingLeft}px` }}
                >
                    <div>
                        <span className="text-white font-medium">ID: {member.user_id}</span>
                        <span className="text-gray-400 mx-4">|</span>
                        <span className="text-green-400">
                            投資額: ${member.investment_amount.toLocaleString()}
                        </span>
                    </div>
                    <div className="text-blue-400">
                        チーム総投資額: ${member.total_team_investment.toLocaleString()}
                    </div>
                </div>
                {member.children.map(child => renderMember(child))}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-white mb-8">組織図</h1>
                
                <div className="bg-gray-900 p-4 rounded-lg">
                    {organization && renderMember(organization)}
                </div>

                <div className="mt-4 text-gray-400">
                    <p>※ チーム総投資額には、直接の投資額と傘下メンバーの投資額が含まれます</p>
                </div>
            </main>
        </div>
    )
} 