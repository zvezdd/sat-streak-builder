-- Update RLS policies to allow friends to view each other's data

-- Allow friends to view each other's streaks
CREATE POLICY "Friends can view each other's streaks" 
ON public.streaks 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.friend_requests fr 
    WHERE fr.status = 'accepted' 
    AND ((fr.sender_id = auth.uid() AND fr.receiver_id = user_id) 
         OR (fr.receiver_id = auth.uid() AND fr.sender_id = user_id))
  )
);

-- Allow friends to view each other's daily progress
CREATE POLICY "Friends can view each other's progress" 
ON public.daily_progress 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.friend_requests fr 
    WHERE fr.status = 'accepted' 
    AND ((fr.sender_id = auth.uid() AND fr.receiver_id = user_id) 
         OR (fr.receiver_id = auth.uid() AND fr.sender_id = user_id))
  )
);