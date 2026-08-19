-- Partner badge ON by default for all users (existing + new signups)

UPDATE public.profiles
SET is_partner = true,
    show_partner_badge = true;

ALTER TABLE public.profiles
  ALTER COLUMN is_partner SET DEFAULT true;

-- New self-serve profile writes get partner + badge on by default; users still cannot revoke partner status themselves.
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
