// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

declare global {
    const Deno: {
        env: {
            get(key: string): string | undefined;
        };
    };
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { email, password, metadata } = await req.json();

        const { data, error } = await supabaseClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: metadata
        });

        if (error) throw error;

        // ユーザー作成後、初期データを設定
        const { error: insertError } = await supabaseClient
            .from('users')
            .insert({
                id: data.user.id,
                email: data.user.email,
                level: 'ASHIGARU',
                investment_amount: 0,
                referrer_id: metadata?.referrer_id || null,
                username: metadata?.username || null,
                wallet: null
            });

        if (insertError) {
            console.error('Error inserting user data:', insertError);
            throw insertError;
        }

        return new Response(
            JSON.stringify({
                message: 'User created successfully',
                user: data.user
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        );

    } catch (error: unknown) {
        console.error('Error creating user:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        );
    }
};

serve(handler, { port: 8080 });
