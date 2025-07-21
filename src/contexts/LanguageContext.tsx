import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface LanguageContextType {
  language: 'en' | 'ru';
  setLanguage: (lang: 'en' | 'ru') => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translation objects
const translations = {
  en: {
    // Header
    'header.welcome': 'Welcome back!',
    'header.signOut': 'Sign Out',
    
    // Loading
    'loading.progress': 'Loading your progress...',
    'loading.questions': 'Loading questions...',
    
    // Streak Card
    'streak.current': 'Current Streak',
    'streak.best': 'Best Streak',
    'streak.todayProgress': "Today's Progress",
    'streak.complete': 'Complete!',
    'streak.viewRecords': 'View Streak Records',
    'streak.day': 'day',
    'streak.days': 'days',
    
    // Daily Challenge
    'challenge.title': 'Daily Challenge',
    'challenge.question': 'Question',
    'challenge.of': 'of',
    'challenge.complete': 'Challenge Complete! 🎉',
    'challenge.gotCorrect': 'You got {count} questions correct!',
    'challenge.accuracy': 'Accuracy: {percent}%',
    'challenge.tryAgain': 'Try Again',
    'challenge.submitAnswer': 'Submit Answer',
    'challenge.correct': 'Correct!',
    'challenge.incorrect': 'Incorrect',
    'challenge.noQuestions': 'No questions available. Please try again later.',
    'challenge.retry': 'Retry',
    'challenge.completeToast': 'Daily Challenge Complete!',
    'challenge.progressToast': 'Progress Saved',
    'challenge.completeDesc': 'Great job! You got {correct} out of {total} correct.',
    'challenge.progressDesc': 'Progress saved: {correct}/{total} correct',
    
    // Question Card
    'question.math': 'math',
    'question.english': 'english',
    'question.easy': 'easy',
    'question.medium': 'medium',
    'question.hard': 'hard',
    
    // Friends
    'friends.title': 'Friends',
    'friends.addFriend': 'Add Friend',
    'friends.search': 'Search by username...',
    'friends.noResults': 'No users found',
    'friends.sendRequest': 'Send Request',
    'friends.requestSent': 'Request Sent',
    'friends.accept': 'Accept',
    'friends.decline': 'Decline',
    'friends.completedToday': 'Completed Today',
    'friends.notDoneToday': 'Not Done Today',
    'friends.noFriends': 'No friends yet',
    'friends.addFirst': 'Add some friends to see their progress!',
    'friends.friendRequests': 'Friend Requests',
    'friends.from': 'from',
    'friends.requestAlreadySent': 'Friend request already sent!',
    'friends.requestSentSuccess': 'Friend request sent!',
    'friends.cannotAddSelf': 'You cannot add yourself as a friend!',
    'friends.alreadyFriends': 'You are already friends with this user!',
    'friends.requestAccepted': 'Friend request accepted!',
    'friends.requestDeclined': 'Friend request declined!',
    
    // Auth
    'auth.title': 'SAT Prep Master',
    'auth.subtitle': 'Build your streak, master the SAT',
    'auth.welcome': 'Welcome',
    'auth.welcomeDesc': 'Sign in to your account or create a new one to start your SAT prep journey',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.continueGoogle': 'Continue with Google',
    'auth.continueEmail': 'Or continue with email',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.username': 'Username',
    'auth.enterEmail': 'Enter your email',
    'auth.enterPassword': 'Enter your password',
    'auth.createPassword': 'Create a password',
    'auth.chooseUsername': 'Choose a unique username',
    'auth.usernamePattern': 'Username can only contain letters, numbers and underscores',
    'auth.signingIn': 'Signing in...',
    'auth.creatingAccount': 'Creating account...',
    'auth.createAccount': 'Create Account',
    'auth.errorSignIn': 'Error signing in',
    'auth.errorSignUp': 'Error signing up',
    'auth.errorGoogle': 'Error with Google sign in',
    'auth.checkEmail': 'Check your email',
    'auth.confirmationSent': 'We sent you a confirmation link!',
    
    // Profile
    'profile.title': 'Profile',
    'profile.username': 'Username',
    'profile.email': 'Email',
    'profile.memberSince': 'Member since',
    'profile.currentStreak': 'Current Streak',
    'profile.longestStreak': 'Longest Streak',
    'profile.uploadAvatar': 'Upload Avatar',
    'profile.signOut': 'Sign Out',
    'profile.uploading': 'Uploading...',
    'profile.language': 'Language',
    'profile.languageEn': 'English',
    'profile.languageRu': 'Русский',
    'profile.fileTooLarge': 'File too large',
    'profile.fileTooLargeDesc': 'Please select a file smaller than 5MB',
    'profile.invalidFileType': 'Invalid file type',
    'profile.invalidFileTypeDesc': 'Please select a JPG, PNG, or WebP image',
    'profile.uploadSuccess': 'Success',
    'profile.uploadSuccessDesc': 'Avatar updated successfully!',
    'profile.uploadError': 'Upload failed',
    'profile.uploadErrorDesc': 'Failed to upload avatar. Please try again.',
    'profile.languageUpdated': 'Language updated',
    'profile.languageUpdatedDesc': 'Your language preference has been saved.',
    
    // Streak Records
    'streakRecords.title': 'Streak Records',
    'streakRecords.back': 'Back',
    'streakRecords.friends': 'Friends',
    'streakRecords.friendsRecords': 'Friends Records',
    'streakRecords.myRecords': 'My Records',
    'streakRecords.noFriendsText': 'You have no friends to track streaks yet.',
    'streakRecords.noFriendsRecords': 'No friends records to display yet.',
    'streakRecords.noMyRecords': 'You have no streak records yet.',
    'streakRecords.best': 'Best: {days} days',
    'streakRecords.currentStreak': 'Current Streak',
    'streakRecords.personalRecord': 'Personal Record',
    
    // NotFound
    'notFound.title': '404',
    'notFound.subtitle': 'Oops! Page not found',
    'notFound.home': 'Return to Home',
    
    // Errors
    'error.loadingQuestions': 'Error loading questions',
    'error.tryAgain': 'Please try again',
    'error.savingProgress': 'Error saving progress',
  },
  ru: {
    // Header
    'header.welcome': 'Добро пожаловать!',
    'header.signOut': 'Выйти',
    
    // Loading
    'loading.progress': 'Загрузка вашего прогресса...',
    'loading.questions': 'Загрузка вопросов...',
    
    // Streak Card
    'streak.current': 'Текущий стрик',
    'streak.best': 'Лучший стрик',
    'streak.todayProgress': 'Прогресс сегодня',
    'streak.complete': 'Завершено!',
    'streak.viewRecords': 'Посмотреть рекорды стриков',
    'streak.day': 'день',
    'streak.days': 'дней',
    
    // Daily Challenge
    'challenge.title': 'Ежедневное задание',
    'challenge.question': 'Вопрос',
    'challenge.of': 'из',
    'challenge.complete': 'Задание завершено! 🎉',
    'challenge.gotCorrect': 'Вы ответили правильно на {count} вопросов!',
    'challenge.accuracy': 'Точность: {percent}%',
    'challenge.tryAgain': 'Попробовать еще раз',
    'challenge.submitAnswer': 'Отправить ответ',
    'challenge.correct': 'Правильно!',
    'challenge.incorrect': 'Неправильно',
    'challenge.noQuestions': 'Вопросы недоступны. Попробуйте позже.',
    'challenge.retry': 'Повторить',
    'challenge.completeToast': 'Ежедневное задание завершено!',
    'challenge.progressToast': 'Прогресс сохранен',
    'challenge.completeDesc': 'Отличная работа! Вы правильно ответили на {correct} из {total}.',
    'challenge.progressDesc': 'Прогресс сохранен: {correct}/{total} правильно',
    
    // Question Card
    'question.math': 'математика',
    'question.english': 'английский',
    'question.easy': 'легкий',
    'question.medium': 'средний',
    'question.hard': 'сложный',
    
    // Friends
    'friends.title': 'Друзья',
    'friends.addFriend': 'Добавить друга',
    'friends.search': 'Поиск по имени пользователя...',
    'friends.noResults': 'Пользователи не найдены',
    'friends.sendRequest': 'Отправить запрос',
    'friends.requestSent': 'Запрос отправлен',
    'friends.accept': 'Принять',
    'friends.decline': 'Отклонить',
    'friends.completedToday': 'Выполнено сегодня',
    'friends.notDoneToday': 'Не выполнено сегодня',
    'friends.noFriends': 'Пока нет друзей',
    'friends.addFirst': 'Добавьте друзей, чтобы видеть их прогресс!',
    'friends.friendRequests': 'Запросы в друзья',
    'friends.from': 'от',
    'friends.requestAlreadySent': 'Запрос в друзья уже отправлен!',
    'friends.requestSentSuccess': 'Запрос в друзья отправлен!',
    'friends.cannotAddSelf': 'Вы не можете добавить себя в друзья!',
    'friends.alreadyFriends': 'Вы уже друзья с этим пользователем!',
    'friends.requestAccepted': 'Запрос в друзья принят!',
    'friends.requestDeclined': 'Запрос в друзья отклонен!',
    
    // Auth
    'auth.title': 'SAT Prep Master',
    'auth.subtitle': 'Развивайте стрик, осваивайте SAT',
    'auth.welcome': 'Добро пожаловать',
    'auth.welcomeDesc': 'Войдите в свой аккаунт или создайте новый, чтобы начать подготовку к SAT',
    'auth.signIn': 'Войти',
    'auth.signUp': 'Регистрация',
    'auth.continueGoogle': 'Продолжить с Google',
    'auth.continueEmail': 'Или продолжить с email',
    'auth.email': 'Email',
    'auth.password': 'Пароль',
    'auth.username': 'Имя пользователя',
    'auth.enterEmail': 'Введите ваш email',
    'auth.enterPassword': 'Введите ваш пароль',
    'auth.createPassword': 'Создайте пароль',
    'auth.chooseUsername': 'Выберите уникальное имя пользователя',
    'auth.usernamePattern': 'Имя пользователя может содержать только буквы, цифры и подчеркивания',
    'auth.signingIn': 'Вход...',
    'auth.creatingAccount': 'Создание аккаунта...',
    'auth.createAccount': 'Создать аккаунт',
    'auth.errorSignIn': 'Ошибка входа',
    'auth.errorSignUp': 'Ошибка регистрации',
    'auth.errorGoogle': 'Ошибка входа через Google',
    'auth.checkEmail': 'Проверьте ваш email',
    'auth.confirmationSent': 'Мы отправили вам ссылку для подтверждения!',
    
    // Profile
    'profile.title': 'Профиль',
    'profile.username': 'Имя пользователя',
    'profile.email': 'Email',
    'profile.memberSince': 'Участник с',
    'profile.currentStreak': 'Текущий стрик',
    'profile.longestStreak': 'Лучший стрик',
    'profile.uploadAvatar': 'Загрузить аватар',
    'profile.signOut': 'Выйти',
    'profile.uploading': 'Загрузка...',
    'profile.language': 'Язык',
    'profile.languageEn': 'English',
    'profile.languageRu': 'Русский',
    'profile.fileTooLarge': 'Файл слишком большой',
    'profile.fileTooLargeDesc': 'Пожалуйста, выберите файл размером менее 5МБ',
    'profile.invalidFileType': 'Неверный тип файла',
    'profile.invalidFileTypeDesc': 'Пожалуйста, выберите изображение JPG, PNG или WebP',
    'profile.uploadSuccess': 'Успех',
    'profile.uploadSuccessDesc': 'Аватар успешно обновлен!',
    'profile.uploadError': 'Ошибка загрузки',
    'profile.uploadErrorDesc': 'Не удалось загрузить аватар. Попробуйте еще раз.',
    'profile.languageUpdated': 'Язык обновлен',
    'profile.languageUpdatedDesc': 'Ваши языковые предпочтения сохранены.',
    
    // Streak Records
    'streakRecords.title': 'Рекорды стриков',
    'streakRecords.back': 'Назад',
    'streakRecords.friends': 'Друзья',
    'streakRecords.friendsRecords': 'Рекорды друзей',
    'streakRecords.myRecords': 'Мои рекорды',
    'streakRecords.noFriendsText': 'У вас пока нет друзей для отслеживания стриков.',
    'streakRecords.noFriendsRecords': 'Пока нет рекордов друзей для отображения.',
    'streakRecords.noMyRecords': 'У вас пока нет рекордов стриков.',
    'streakRecords.best': 'Лучший: {days} дней',
    'streakRecords.currentStreak': 'Текущий стрик',
    'streakRecords.personalRecord': 'Личный рекорд',
    
    // NotFound
    'notFound.title': '404',
    'notFound.subtitle': 'Упс! Страница не найдена',
    'notFound.home': 'Вернуться на главную',
    
    // Errors
    'error.loadingQuestions': 'Ошибка загрузки вопросов',
    'error.tryAgain': 'Пожалуйста, попробуйте еще раз',
    'error.savingProgress': 'Ошибка сохранения прогресса',
  },
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<'en' | 'ru'>('en');
  const { user } = useAuth();

  // Load user's language preference
  useEffect(() => {
    const loadLanguagePreference = async () => {
      if (user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('language')
            .eq('user_id', user.id)
            .single();

          if (profile?.language) {
            setLanguageState(profile.language as 'en' | 'ru');
          }
        } catch (error) {
          console.error('Error loading language preference:', error);
        }
      }
    };

    loadLanguagePreference();
  }, [user]);

  const setLanguage = async (lang: 'en' | 'ru') => {
    setLanguageState(lang);
    
    // Save to database if user is logged in
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ language: lang })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language]?.[key] || translations.en[key] || key;
    
    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{${paramKey}}`, String(paramValue));
      });
    }
    
    return translation;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};