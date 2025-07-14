import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StreakCard } from '@/components/StreakCard';
import { DailyChallenge } from '@/components/DailyChallenge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap, LogOut, Loader2 } from 'lucide-react';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const [streakData, setStreakData] = useState({ current_streak: 0, longest_streak: 0 });
  const [dailyProgress, setDailyProgress] = useState({ questionsCorrect: 0, questionsTotal: 0, completed: false });
  const [dataLoading, setDataLoading] = useState(true);

  const loadUserData = async () => {
    if (!user) return;
    
    setDataLoading(true);
    try {
      // Load streak data
      const { data: streak, error: streakError } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (streakError && streakError.code !== 'PGRST116') {
        console.error('Error loading streak:', streakError);
      } else if (streak) {
        setStreakData(streak);
      }

      // Load today's progress
      const today = new Date().toISOString().split('T')[0];
      const { data: progress, error: progressError } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        console.error('Error loading progress:', progressError);
      } else if (progress) {
        setDailyProgress({
          questionsCorrect: progress.questions_correct,
          questionsTotal: progress.questions_solved,
          completed: progress.completed
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SAT Prep Master</h1>
              <p className="text-sm text-muted-foreground">Welcome back!</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {dataLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading your progress...</span>
          </div>
        ) : (
          <div className="space-y-8">
            <StreakCard 
              currentStreak={streakData.current_streak}
              longestStreak={streakData.longest_streak}
              dailyProgress={dailyProgress}
            />
            
            <DailyChallenge onProgressUpdate={loadUserData} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
