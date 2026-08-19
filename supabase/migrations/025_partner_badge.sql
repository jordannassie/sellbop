-- SellBop Partner Badge: admin-granted partner status + user visibility preference

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_partner boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_partner_badge boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.is_partner IS 'Official SellBop Partner — admin only';
COMMENT ON COLUMN public.profiles.show_partner_badge IS 'User preference to display partner badge on public profile';

-- Prevent profile owners from granting themselves partner status via RLS client writes.
CREATE OR REPLACE FUNCTION public.profiles_protect_partner_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL AND auth.uid() = NEW.user_id THEN
      NEW.is_partner := true;
      NEW.show_partner_badge := COALESCE(NEW.show_partner_badge, true);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF auth.uid() IS NOT NULL AND auth.uid() = OLD.user_id THEN
      NEW.is_partner := OLD.is_partner;
      IF OLD.is_partner = false THEN
        NEW.show_partner_badge := OLD.show_partner_badge;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_partner_fields ON public.profiles;
CREATE TRIGGER profiles_protect_partner_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_protect_partner_fields();
