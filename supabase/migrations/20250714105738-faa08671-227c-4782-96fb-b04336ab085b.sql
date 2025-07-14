-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table for SAT questions
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL CHECK (subject IN ('math', 'english')),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_progress table for tracking daily question solving
CREATE TABLE public.daily_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_solved INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create streaks table for tracking user streaks
CREATE TABLE public.streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for questions (public read access)
CREATE POLICY "Questions are viewable by authenticated users" 
ON public.questions FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create policies for daily_progress
CREATE POLICY "Users can view their own progress" 
ON public.daily_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.daily_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.daily_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for streaks
CREATE POLICY "Users can view their own streak" 
ON public.streaks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak" 
ON public.streaks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak" 
ON public.streaks FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at
  BEFORE UPDATE ON public.streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample SAT questions
INSERT INTO public.questions (subject, question_text, options, correct_answer, explanation, difficulty) VALUES
('math', 'If x + 5 = 12, what is the value of x?', '{"A": "5", "B": "7", "C": "12", "D": "17"}', 'B', 'Subtract 5 from both sides: x = 12 - 5 = 7', 'easy'),
('math', 'What is 15% of 80?', '{"A": "10", "B": "12", "C": "15", "D": "20"}', 'B', '15% of 80 = 0.15 × 80 = 12', 'easy'),
('math', 'If y = 2x + 3 and x = 4, what is y?', '{"A": "8", "B": "9", "C": "11", "D": "13"}', 'C', 'Substitute x = 4: y = 2(4) + 3 = 8 + 3 = 11', 'medium'),
('english', 'Choose the correct form: "The team ___ playing well."', '{"A": "is", "B": "are", "C": "were", "D": "have"}', 'A', 'Team is a collective noun treated as singular, so use "is"', 'easy'),
('english', 'Which sentence is grammatically correct?', '{"A": "Me and him went to the store", "B": "Him and I went to the store", "C": "He and I went to the store", "D": "I and he went to the store"}', 'C', 'Use subject pronouns "He and I" when they are the subject of the sentence', 'medium'),
('math', 'If a triangle has angles of 45° and 60°, what is the third angle?', '{"A": "75°", "B": "85°", "C": "90°", "D": "95°"}', 'A', 'Sum of angles in a triangle is 180°. 180° - 45° - 60° = 75°', 'medium'),
('english', 'Identify the error: "Between you and I, this is difficult."', '{"A": "Between", "B": "you", "C": "I", "D": "No error"}', 'C', 'Should be "between you and me" - use object pronoun after preposition', 'medium'),
('math', 'What is the slope of the line passing through (2,3) and (6,9)?', '{"A": "1", "B": "1.5", "C": "2", "D": "3"}', 'B', 'Slope = (y2-y1)/(x2-x1) = (9-3)/(6-2) = 6/4 = 1.5', 'medium');