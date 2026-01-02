-- Add defensive validation to handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Defensive validation: ensure user ID is valid
  IF new.id IS NULL THEN
    RAISE EXCEPTION 'Invalid user ID: cannot be null';
  END IF;
  
  -- Check if profile already exists to prevent duplicates
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = new.id) THEN
    -- Profile already exists, skip insert
    RETURN new;
  END IF;
  
  -- Insert new profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle race condition where profile was created between check and insert
    RETURN new;
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Add comment documenting why SECURITY DEFINER is necessary
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a profile when a new user signs up. Uses SECURITY DEFINER because it runs as a trigger on auth.users (a protected Supabase Auth table) and needs elevated privileges to insert into public.profiles.';