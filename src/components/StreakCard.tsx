import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  dailyProgress: {
    questionsCorrect: number;
    questionsTotal: number;
    completed: boolean;
  };
}

export function StreakCard({ currentStreak, longestStreak, dailyProgress }: StreakCardProps) {
  const progressPercentage = dailyProgress.questionsTotal > 0 
    ? (dailyProgress.questionsCorrect / dailyProgress.questionsTotal) * 100 
    : 0;

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              {currentStreak === 1 ? 'day' : 'days'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Streak</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{longestStreak}</div>
            <p className="text-xs text-muted-foreground">
              {longestStreak === 1 ? 'day' : 'days'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-blue-600">
                {dailyProgress.questionsCorrect}/5
              </div>
              {dailyProgress.completed && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Complete!
                </Badge>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min((dailyProgress.questionsCorrect / 5) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Link to="/streak-records">
        <Button variant="outline" size="sm" className="w-full">
          <Trophy className="w-4 h-4 mr-2" />
          Посмотреть рекорды стриков
        </Button>
      </Link>
    </div>
  );
}