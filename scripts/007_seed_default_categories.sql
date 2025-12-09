-- This trigger will create default categories when a new user profile is created
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Default expense categories
  INSERT INTO public.categories (user_id, name, type, color, icon, is_default) VALUES
    (NEW.id, 'Food & Dining', 'expense', '#ef4444', 'utensils', true),
    (NEW.id, 'Transportation', 'expense', '#f97316', 'car', true),
    (NEW.id, 'Shopping', 'expense', '#eab308', 'shopping-bag', true),
    (NEW.id, 'Entertainment', 'expense', '#a855f7', 'gamepad-2', true),
    (NEW.id, 'Bills & Utilities', 'expense', '#3b82f6', 'receipt', true),
    (NEW.id, 'Healthcare', 'expense', '#ec4899', 'heart-pulse', true),
    (NEW.id, 'Housing', 'expense', '#14b8a6', 'home', true),
    (NEW.id, 'Personal Care', 'expense', '#8b5cf6', 'sparkles', true),
    (NEW.id, 'Education', 'expense', '#06b6d4', 'graduation-cap', true),
    (NEW.id, 'Travel', 'expense', '#10b981', 'plane', true),
    (NEW.id, 'Other Expense', 'expense', '#6b7280', 'more-horizontal', true);
  
  -- Default income categories
  INSERT INTO public.categories (user_id, name, type, color, icon, is_default) VALUES
    (NEW.id, 'Salary', 'income', '#22c55e', 'briefcase', true),
    (NEW.id, 'Freelance', 'income', '#10b981', 'laptop', true),
    (NEW.id, 'Investments', 'income', '#14b8a6', 'trending-up', true),
    (NEW.id, 'Gifts', 'income', '#f59e0b', 'gift', true),
    (NEW.id, 'Other Income', 'income', '#6b7280', 'plus-circle', true);
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_categories ON public.profiles;
CREATE TRIGGER on_profile_created_categories
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_categories();
