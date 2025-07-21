import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuestionCard } from './QuestionCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Question {
  id: string;
  subject: 'math' | 'english';
  question_text: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface DailyChallengeProps {
  onProgressUpdate: () => void;
}

export function DailyChallenge({ onProgressUpdate }: DailyChallengeProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{questionId: string, answer: string, correct: boolean}[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [challengeComplete, setChallengeComplete] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const loadQuestions = async () => {
    setLoading(true);
    try {
      // Get all questions and randomize on client side
      const { data, error } = await supabase
        .from('questions')
        .select('*');

      if (error) throw error;
      
      // Shuffle and take 5 random questions
      const shuffled = (data || []).sort(() => 0.5 - Math.random());
      const randomQuestions = shuffled.slice(0, 5);
      setQuestions(randomQuestions as Question[]);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: t('error.loadingQuestions'),
        description: t('error.tryAgain'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleAnswer = async (questionId: string, selectedAnswer: string, isCorrect: boolean) => {
    const newAnswer = { questionId, answer: selectedAnswer, correct: isCorrect };
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    setShowResult(true);

    // Update progress after showing result
    setTimeout(async () => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setShowResult(false);
      } else {
        // Challenge complete - update database
        setChallengeComplete(true);
        await updateDailyProgress(updatedAnswers);
      }
    }, 2000);
  };

  const updateDailyProgress = async (finalAnswers: {questionId: string, answer: string, correct: boolean}[]) => {
    if (!user) return;

    const correctAnswers = finalAnswers.filter(a => a.correct).length;
    const totalQuestions = finalAnswers.length;
    const isCompleted = totalQuestions >= 5;

    try {
      // Update daily progress
      const { error: progressError } = await supabase
        .from('daily_progress')
        .upsert({
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          questions_solved: totalQuestions,
          questions_correct: correctAnswers,
          completed: isCompleted,
        });

      if (progressError) throw progressError;

      // Update streak if completed
      if (isCompleted) {
        const { data: streakData, error: streakFetchError } = await supabase
          .from('streaks')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (streakFetchError) throw streakFetchError;

        const today = new Date().toISOString().split('T')[0];
        const lastCompleted = streakData.last_completed_date;
        
        let newCurrentStreak = 1;
        
        if (lastCompleted) {
          // Don't update if already completed today
          if (lastCompleted === today) {
            return;
          }
          
          const lastDate = new Date(lastCompleted + 'T00:00:00.000Z');
          const todayDate = new Date(today + 'T00:00:00.000Z');
          const diffTime = todayDate.getTime() - lastDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            // Consecutive day - increment streak
            newCurrentStreak = streakData.current_streak + 1;
          } else if (diffDays > 1) {
            // Streak broken - reset to 1
            newCurrentStreak = 1;
          }
        }

        const newLongestStreak = Math.max(newCurrentStreak, streakData.longest_streak);

        const { error: streakUpdateError } = await supabase
          .from('streaks')
          .update({
            current_streak: newCurrentStreak,
            longest_streak: newLongestStreak,
            last_completed_date: today,
          })
          .eq('user_id', user.id);

        if (streakUpdateError) throw streakUpdateError;
      }

      onProgressUpdate();
      
      toast({
        title: isCompleted ? t('challenge.completeToast') : t('challenge.progressToast'),
        description: isCompleted 
          ? t('challenge.completeDesc', { correct: correctAnswers.toString(), total: totalQuestions.toString() })
          : t('challenge.progressDesc', { correct: correctAnswers.toString(), total: totalQuestions.toString() }),
      });

    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: t('error.savingProgress'),
        description: t('error.tryAgain'),
        variant: "destructive",
      });
    }
  };

  const resetChallenge = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowResult(false);
    setChallengeComplete(false);
    loadQuestions();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('loading.questions')}</span>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p>{t('challenge.noQuestions')}</p>
          <Button onClick={loadQuestions} className="mt-4">
            {t('challenge.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (challengeComplete) {
    const correctCount = answers.filter(a => a.correct).length;
    const accuracy = Math.round((correctCount / answers.length) * 100);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">{t('challenge.complete')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-6xl font-bold text-primary">{correctCount}/5</div>
          <p className="text-lg">{t('challenge.gotCorrect', { count: correctCount.toString() })}</p>
          <p className="text-muted-foreground">{t('challenge.accuracy', { percent: accuracy.toString() })}</p>
          
          <div className="flex justify-center space-x-4 pt-4">
            <Button onClick={resetChallenge} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('challenge.tryAgain')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('challenge.title')}</h2>
        <div className="text-sm text-muted-foreground">
          {t('challenge.question')} {currentQuestionIndex + 1} {t('challenge.of')} {questions.length}
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300" 
          style={{ width: `${((currentQuestionIndex + (showResult ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <QuestionCard
        question={currentQuestion}
        onAnswer={handleAnswer}
        showResult={showResult}
        selectedAnswer={currentAnswer?.answer}
        isCorrect={currentAnswer?.correct}
      />
    </div>
  );
}