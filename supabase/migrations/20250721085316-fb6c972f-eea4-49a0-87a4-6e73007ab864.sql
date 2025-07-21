-- Drop the restrictive policy for viewing profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a new policy that allows authenticated users to view all profiles (for friend search)
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');