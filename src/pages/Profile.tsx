import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Calendar, Camera, ArrowLeft, Trophy, Flame } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Streak {
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if viewing own profile or another user's profile
  const isOwnProfile = !userId || userId === user?.id;
  const profileUserId = userId || user?.id;

  useEffect(() => {
    if (user && profileUserId) {
      loadProfile();
      loadStreak();
    }
  }, [user, profileUserId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', profileUserId)
        .single();

      if (error) throw error;
      
      setProfile(data);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить профиль",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStreak = async () => {
    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('current_streak, longest_streak, last_completed_date')
        .eq('user_id', profileUserId)
        .single();

      if (error) throw error;
      
      setStreak(data);
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Ошибка",
          description: "Файл слишком большой. Максимальный размер: 5MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, выберите изображение",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const filePath = `${user!.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        await supabase.storage.from('avatars').remove([`${user!.id}/${oldPath}`]);
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('user_id', user!.id);

      if (updateError) throw updateError;

      await loadProfile();

      toast({
        title: "Успешно",
        description: "Фото профиля обновлено",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить фото",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="relative mx-auto w-20 h-20 mb-4">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                )}
                {isOwnProfile && (
                  <Button
                    size="sm"
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                )}
                {isOwnProfile && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                )}
              </div>
              <CardTitle className="text-2xl">
                {isOwnProfile ? 'Мой профиль' : `Профиль ${profile?.username}`}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Имя пользователя</p>
                    <p className="font-medium">{profile?.username}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Дата регистрации</p>
                    <p className="font-medium">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU') : 'Не указана'}
                    </p>
                  </div>
                </div>
                
                {/* Streak Information */}
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Trophy className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Лучший стрик</p>
                    <p className="font-medium">{streak?.longest_streak || 0} {(streak?.longest_streak || 0) === 1 ? 'день' : 'дней'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Flame className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Текущий стрик</p>
                    <p className="font-medium">{streak?.current_streak || 0} {(streak?.current_streak || 0) === 1 ? 'день' : 'дней'}</p>
                  </div>
                </div>
              </div>
              
              {isOwnProfile && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={signOut}
                    variant="destructive"
                    className="w-full"
                  >
                    Выйти из аккаунта
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}