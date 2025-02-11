-- Supabaseのメールテンプレート設定
INSERT INTO auth.email_templates (
    template_id,
    template,
    subject
) VALUES (
    'reset_password',
    '以下のリンクからパスワードをリセットできます：
    {{ .ConfirmationURL }}
    
    このメールに心当たりがない場合は無視してください。',
    'パスワードリセットのお知らせ'
); 