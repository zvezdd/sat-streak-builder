import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Trophy, Calendar, Users } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

interface StreakRecord {
  id: string;
  user_id: string;
  streak_value: number;
  date_achieved: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  } | null;
}

interface FriendStreak {
  user_id: string;
  username: string;
  avatar_url: string | null;
  current_streak: number;
  longest_streak: number;
}

export default function StreakRecords() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myRecords, setMyRecords] = useState<StreakRecord[]>([]);
  const [friendsRecords, setFriendsRecords] = useState<StreakRecord[]>([]);
  const [friendsStreaks, setFriendsStreaks] = useState<FriendStreak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStreakData();
    }
  }, [user]);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      
      // Get friend IDs
      const { data: friendRequests } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`);

      const friendIds = friendRequests?.map(req => 
        req.sender_id === user?.id ? req.receiver_id : req.sender_id
      ) || [];

      // Load my streak records
      const { data: myRecordsData } = await supabase
        .from('streaks_records')
        .select('*')
        .eq('user_id', user!.id)
        .order('date_achieved', { ascending: false });

      setMyRecords(myRecordsData || []);

      if (friendIds.length > 0) {
        // Load friends' streak records
        const { data: friendsRecordsData, error: recordsError } = await supabase
          .from('streaks_records')
          .select('*')
          .in('user_id', friendIds)
          .order('date_achieved', { ascending: false })
          .limit(20);

        if (recordsError) {
          console.error('Error loading friends records:', recordsError);
        } else {
          // Get profiles for the records
          const recordUserIds = [...new Set(friendsRecordsData?.map(r => r.user_id) || [])];
          const { data: recordProfiles } = await supabase
            .from('profiles')
            .select('user_id, username, avatar_url')
            .in('user_id', recordUserIds);

          const recordsWithProfiles = friendsRecordsData?.map(record => ({
            ...record,
            profile: recordProfiles?.find(p => p.user_id === record.user_id) || null,
          })) || [];

          setFriendsRecords(recordsWithProfiles as StreakRecord[]);
        }

        // Load current friend streaks
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .in('user_id', friendIds);

        const { data: streaks } = await supabase
          .from('streaks')
          .select('user_id, current_streak, longest_streak')
          .in('user_id', friendIds);

        const friendsStreaksData = profiles?.map(profile => {
          const streak = streaks?.find(s => s.user_id === profile.user_id);
          return {
            user_id: profile.user_id,
            username: profile.username || 'Unknown',
            avatar_url: profile.avatar_url,
            current_streak: streak?.current_streak || 0,
            longest_streak: streak?.longest_streak || 0,
          };
        }) || [];

        setFriendsStreaks(friendsStreaksData);
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Рекорды стриков
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="friends" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="friends">Друзья</TabsTrigger>
                  <TabsTrigger value="records">Рекорды друзей</TabsTrigger>
                  <TabsTrigger value="my-records">Мои рекорды</TabsTrigger>
                </TabsList>

                <TabsContent value="friends" className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : friendsStreaks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      У вас пока нет друзей для отслеживания стриков.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {friendsStreaks
                        .sort((a, b) => b.current_streak - a.current_streak)
                        .map(friend => (
                          <div key={friend.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {friend.avatar_url ? (
                                <img
                                  src={friend.avatar_url}
                                  alt={`${friend.username} profile`}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                  {friend.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <h3 className="font-semibold">{friend.username}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Лучший: {friend.longest_streak} дней
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={friend.current_streak > 0 ? "default" : "secondary"}>
                                {friend.current_streak} дней
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                Текущий стрик
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="records" className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : friendsRecords.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Пока нет рекордов друзей для отображения.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {friendsRecords.map(record => (
                        <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {record.profile?.avatar_url ? (
                              <img
                                src={record.profile.avatar_url}
                                alt={`${record.profile.username} profile`}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                {(record.profile?.username || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium">{record.profile?.username || 'Unknown'}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(record.date_achieved).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-lg font-bold">
                            <Trophy className="w-4 h-4 mr-1" />
                            {record.streak_value} дней
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="my-records" className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : myRecords.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      У вас пока нет рекордов стриков.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {myRecords.map(record => (
                        <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <Trophy className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">Личный рекорд</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(record.date_achieved).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                          </div>
                          <Badge className="text-lg font-bold">
                            {record.streak_value} дней
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}