-- Enable realtime for streaks table
ALTER TABLE public.streaks REPLICA IDENTITY FULL;

-- Add streaks table to realtime publication
ALTER publication supabase_realtime ADD TABLE public.streaks;