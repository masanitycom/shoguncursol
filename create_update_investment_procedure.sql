CREATE OR REPLACE FUNCTION update_investment_amount(
    p_user_id UUID,
    p_amount NUMERIC
) RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET 
        investment_amount = COALESCE(investment_amount, 0) + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found for user_id: %', p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql; 