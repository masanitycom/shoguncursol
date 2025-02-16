-- profilesテーブルの挿入時のポリシー
CREATE POLICY "Must have corresponding auth user"
ON public.profiles
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = user_id
    )
); 