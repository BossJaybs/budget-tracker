-- This trigger will create a default Cash account when a new user profile is created
CREATE OR REPLACE FUNCTION public.create_default_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.accounts (user_id, name, type, balance, color)
  VALUES (NEW.id, 'Cash', 'cash', 0, '#22c55e');
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_account ON public.profiles;
CREATE TRIGGER on_profile_created_account
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_account();
