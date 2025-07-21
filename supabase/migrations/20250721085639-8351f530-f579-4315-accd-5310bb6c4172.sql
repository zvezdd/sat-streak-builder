-- Add last_seen column to profiles table for tracking user activity
ALTER TABLE public.profiles ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create streaks_records table to track historical streak data
CREATE TABLE public.streaks_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  streak_value INTEGER NOT NULL,
  date_achieved DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for streaks_records
ALTER TABLE public.streaks_records ENABLE ROW LEVEL SECURITY;

-- Create policies for streaks_records
CREATE POLICY "Users can insert their own streak records" 
ON public.streaks_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view streak records of their friends (or anyone for simplicity)
CREATE POLICY "Authenticated users can view all streak records" 
ON public.streaks_records 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create trigger to automatically record streak milestones
CREATE OR REPLACE FUNCTION public.record_streak_milestone()
RETURNS TRIGGER AS $$
BEGIN
  -- Record new longest streak
  IF NEW.longest_streak > OLD.longest_streak THEN
    INSERT INTO public.streaks_records (user_id, streak_value, date_achieved)
    VALUES (NEW.user_id, NEW.longest_streak, CURRENT_DATE);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER record_streak_milestone_trigger
AFTER UPDATE ON public.streaks
FOR EACH ROW
EXECUTE FUNCTION public.record_streak_milestone();