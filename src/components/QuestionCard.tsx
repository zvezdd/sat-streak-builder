import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, BookOpen, Calculator } from 'lucide-react';
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

interface QuestionCardProps {
  question: Question;
  onAnswer: (questionId: string, selectedAnswer: string, isCorrect: boolean) => void;
  showResult?: boolean;
  selectedAnswer?: string;
  isCorrect?: boolean;
}

export function QuestionCard({ 
  question, 
  onAnswer, 
  showResult = false, 
  selectedAnswer, 
  isCorrect 
}: QuestionCardProps) {
  const [selected, setSelected] = useState<string>('');
  const { t } = useLanguage();

  const handleSubmit = () => {
    if (selected) {
      const correct = selected === question.correct_answer;
      onAnswer(question.id, selected, correct);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    return t(`question.${difficulty}` as any) || difficulty;
  };

  const SubjectIcon = question.subject === 'math' ? Calculator : BookOpen;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SubjectIcon className="h-5 w-5" />
            <CardTitle className="text-lg capitalize">{t(`question.${question.subject}` as any)}</CardTitle>
          </div>
          <Badge className={getDifficultyColor(question.difficulty)}>
            {getDifficultyText(question.difficulty)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-medium leading-relaxed">{question.question_text}</p>
        
        <div className="space-y-3">
          {Object.entries(question.options).map(([key, value]) => {
            let buttonClass = "w-full justify-start text-left h-auto p-4 whitespace-normal";
            
            if (showResult) {
              if (key === question.correct_answer) {
                buttonClass += " bg-green-100 border-green-500 text-green-800";
              } else if (key === selectedAnswer && key !== question.correct_answer) {
                buttonClass += " bg-red-100 border-red-500 text-red-800";
              }
            } else {
              if (selected === key) {
                buttonClass += " bg-primary text-primary-foreground";
              } else {
                buttonClass += " bg-background hover:bg-accent";
              }
            }

            return (
              <Button
                key={key}
                variant="outline"
                className={buttonClass}
                onClick={() => !showResult && setSelected(key)}
                disabled={showResult}
              >
                <div className="flex items-center w-full">
                  <span className="font-semibold mr-3 min-w-[2rem]">{key}.</span>
                  <span className="flex-1">{value}</span>
                  {showResult && key === question.correct_answer && (
                    <CheckCircle className="h-5 w-5 ml-2" />
                  )}
                  {showResult && key === selectedAnswer && key !== question.correct_answer && (
                    <XCircle className="h-5 w-5 ml-2" />
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {!showResult && (
          <Button 
            onClick={handleSubmit} 
            disabled={!selected}
            className="w-full"
          >
            {t('challenge.submitAnswer')}
          </Button>
        )}

        {showResult && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              {isCorrect ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-semibold">
                {isCorrect ? t('challenge.correct') : t('challenge.incorrect')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}