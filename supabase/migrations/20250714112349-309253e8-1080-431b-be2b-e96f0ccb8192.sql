-- Create friend_requests table
CREATE TABLE public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friend_requests
CREATE POLICY "Users can view their own friend requests"
ON public.friend_requests
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create friend requests"
ON public.friend_requests
FOR INSERT
WITH CHECK (auth.uid() = sender_id AND sender_id != receiver_id);

CREATE POLICY "Users can update received friend requests"
ON public.friend_requests
FOR UPDATE
USING (auth.uid() = receiver_id);

-- Create updated_at trigger for friend_requests
CREATE TRIGGER update_friend_requests_updated_at
BEFORE UPDATE ON public.friend_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a view for accepted friends (bidirectional)
CREATE VIEW public.friends AS
SELECT 
  CASE 
    WHEN sender_id = auth.uid() THEN receiver_id 
    ELSE sender_id 
  END as friend_id,
  CASE 
    WHEN sender_id = auth.uid() THEN sender_id 
    ELSE receiver_id 
  END as user_id
FROM public.friend_requests 
WHERE status = 'accepted' 
AND (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Allow users to view the friends view
CREATE POLICY "Users can view their friends"
ON public.friends
FOR SELECT
USING (auth.uid() = user_id);