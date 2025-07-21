import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StreakCard } from '@/components/StreakCard';
import { DailyChallenge } from '@/components/DailyChallenge';
import { Friends } from '@/components/Friends';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap, LogOut, Loader2, User } from 'lucide-react';
const Index = () => {
  const {
    user,
    signOut,
    loading
  } = useAuth();
  const [streakData, setStreakData] = useState({
    current_streak: 0,
    longest_streak: 0
  });
  const [dailyProgress, setDailyProgress] = useState({
    questionsCorrect: 0,
    questionsTotal: 0,
    completed: false
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{avatar_url: string | null} | null>(null);
  const loadUserData = async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      // Load streak data
      const {
        data: streak,
        error: streakError
      } = await supabase.from('streaks').select('*').eq('user_id', user.id).single();
      if (streakError && streakError.code !== 'PGRST116') {
        console.error('Error loading streak:', streakError);
      } else if (streak) {
        // Check if streak should be reset due to missed days
        const today = new Date().toISOString().split('T')[0];
        const lastCompleted = streak.last_completed_date;
        
        if (lastCompleted) {
          const lastDate = new Date(lastCompleted + 'T00:00:00.000Z');
          const todayDate = new Date(today + 'T00:00:00.000Z');
          const diffTime = todayDate.getTime() - lastDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          // If more than 1 day has passed, reset the streak to 0
          if (diffDays > 1) {
            const { error: resetError } = await supabase
              .from('streaks')
              .update({
                current_streak: 0,
              })
              .eq('user_id', user.id);
            
            if (!resetError) {
              setStreakData({
                ...streak,
                current_streak: 0
              });
            }
          } else {
            setStreakData(streak);
          }
        } else {
          setStreakData(streak);
        }
      }

      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .single();

      if (!profileError && profile) {
        setUserProfile(profile);
      }

      // Load today's progress
      const today = new Date().toISOString().split('T')[0];
      const {
        data: progress,
        error: progressError
      } = await supabase.from('daily_progress').select('*').eq('user_id', user.id).eq('date', today).single();
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
    return <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SATellite</h1>
              <p className="text-sm text-muted-foreground">Welcome back!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/profile">
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                />
              ) : (
                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                  <User className="h-5 w-5 text-primary" />
                </div>
              )}
            </Link>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {dataLoading ? <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading your progress...</span>
          </div> : <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Progress and Friends */}
            <div className="space-y-6">
              <StreakCard currentStreak={streakData.current_streak} longestStreak={streakData.longest_streak} dailyProgress={dailyProgress} />
              <Friends />
            </div>
            
            {/* Right Column - Daily Challenge */}
            <div className="lg:col-span-2">
              <DailyChallenge onProgressUpdate={loadUserData} />
            </div>
          </div>}
      </main>
    </div>;
};
export default Index;