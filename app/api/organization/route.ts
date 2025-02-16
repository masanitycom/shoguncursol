import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createRouteHandlerClient({ cookies });

    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select(`
                id,
                user_id,
                display_id,
                name,
                email,
                investment_amount,
                total_team_investment,
                referrer_id,
                active,
                created_at
            `)
            .neq('display_id', 'ADMIN001')
            .eq('active', true)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // デバッグ情報
        console.log('Fetched profiles:', profiles.map(p => ({
            name: p.name,
            user_id: p.user_id,
            referrer_id: p.referrer_id
        })));

        // データ構造を構築
        const organizationMap = new Map();
        const rootNodes = [];

        // プロフィールをマップに追加（user_idをキーとして使用）
        profiles.forEach(profile => {
            organizationMap.set(profile.user_id, {
                ...profile,
                children: []
            });
        });

        // 親子関係を構築（referrer_idはuser_idを参照）
        profiles.forEach(profile => {
            const node = organizationMap.get(profile.user_id);
            
            if (profile.referrer_id && organizationMap.has(profile.referrer_id)) {
                // 紹介者が存在する場合
                const parent = organizationMap.get(profile.referrer_id);
                parent.children.push(node);
            } else {
                // 紹介者がいない、または見つからない場合
                rootNodes.push(node);
            }
        });

        // デバッグ情報
        console.log('Organization structure:', {
            totalProfiles: profiles.length,
            mappedNodes: organizationMap.size,
            rootNodes: rootNodes.map(node => ({
                name: node.name,
                user_id: node.user_id,
                children: node.children.map(child => ({
                    name: child.name,
                    user_id: child.user_id,
                    referrer_id: child.referrer_id
                }))
            }))
        });

        return NextResponse.json(rootNodes);

    } catch (error) {
        console.error('Organization error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch organization data' },
            { status: 500 }
        );
    }
} 