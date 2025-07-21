-- Add language preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ru'));