-- Add promotional pricing expiration to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS promo_expires_at TIMESTAMP WITH TIME ZONE;

-- Set promo_expires_at for existing users (7 days from account creation)
UPDATE profiles 
SET promo_expires_at = created_at + INTERVAL '7 days'
WHERE promo_expires_at IS NULL;

-- Set default for new users via trigger
CREATE OR REPLACE FUNCTION set_promo_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.promo_expires_at IS NULL THEN
    NEW.promo_expires_at := NEW.created_at + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_promo_expiration_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_promo_expiration();