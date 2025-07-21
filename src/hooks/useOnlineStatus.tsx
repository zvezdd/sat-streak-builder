import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useOnlineStatus = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Update last_seen when user becomes active
    const updateLastSeen = async () => {
      try {
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error updating last seen:', error);
      }
    };

    // Update immediately
    updateLastSeen();

    // Update every 30 seconds while user is active
    const interval = setInterval(updateLastSeen, 30000);

    // Update when tab becomes visible/hidden
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateLastSeen();
      }
    };

    // Update on user activity
    const handleActivity = () => {
      updateLastSeen();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [user]);
};

export const formatLastSeen = (lastSeen: string | null): string => {
  if (!lastSeen) return 'давно не был в сети';

  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Более строгая проверка онлайн статуса - только если был активен в последние 2 минуты
  if (diffMinutes < 2) {
    return 'онлайн';
  } else if (diffMinutes < 5) {
    return 'недавно был в сети';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} мин назад`;
  } else if (diffHours < 24) {
    return `${diffHours} ч назад`;
  } else if (diffDays === 1) {
    return 'вчера';
  } else if (diffDays < 7) {
    return `${diffDays} дн назад`;
  } else {
    return lastSeenDate.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });
  }
};

export const isOnline = (lastSeen: string | null): boolean => {
  if (!lastSeen) return false;
  
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  // Считаем онлайн только если был активен в последние 2 минуты
  return diffMinutes < 2;
};