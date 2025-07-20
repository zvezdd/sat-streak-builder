-- First, update existing profiles with default usernames
UPDATE public.profiles 
SET username = 'user_' || substring(id::text, 1, 8)
WHERE username IS NULL;

-- Now make username required and unique
ALTER TABLE public.profiles 
ALTER COLUMN username SET NOT NULL,
ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Update the handle_new_user function to require username from signup metadata  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, username)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'username'
  );
  
  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;