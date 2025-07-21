import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, Check, X, Users } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  email: string;
  avatar_url: string | null;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_profile?: Profile;
  receiver_profile?: Profile;
}

interface FriendProgress {
  user_id: string;
  username: string;
  avatar_url: string | null;
  completed_today: boolean;
  current_streak: number;
}

export function Friends() {
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<FriendProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadFriendRequests();
      loadFriends();
    }
  }, [user]);

  const searchUsers = async () => {
    if (!searchUsername.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${searchUsername}%`)
        .neq('user_id', user?.id)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error searching users",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user?.id,
          receiver_id: receiverId,
        });

      if (error) throw error;

      toast({
        title: "Friend request sent!",
        description: "Your friend request has been sent.",
      });

      setSearchResults([]);
      setSearchUsername('');
      loadFriendRequests();
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      if (error.code === '23505') {
        toast({
          title: "Request already exists",
          description: "You've already sent a request to this user.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error sending request",
          description: "Please try again",
          variant: "destructive",
        });
      }
    }
  };

  const loadFriendRequests = async () => {
    try {
      // Get friend requests
      const { data: requests, error: requestError } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (requestError) throw requestError;

      // Get profiles for the requests
      const userIds = new Set<string>();
      requests?.forEach(req => {
        userIds.add(req.sender_id);
        userIds.add(req.receiver_id);
      });

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', Array.from(userIds));

      if (profileError) throw profileError;

      // Combine the data
      const requestsWithProfiles = requests?.map(request => ({
        ...request,
        sender_profile: profiles?.find(p => p.user_id === request.sender_id),
        receiver_profile: profiles?.find(p => p.user_id === request.receiver_id),
      })) || [];

      setFriendRequests(requestsWithProfiles as FriendRequest[]);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const respondToRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: status === 'accepted' ? "Friend request accepted!" : "Friend request rejected",
        description: status === 'accepted' ? "You are now friends!" : "Request has been rejected.",
      });

      loadFriendRequests();
      if (status === 'accepted') {
        loadFriends();
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      toast({
        title: "Error responding to request",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const loadFriends = async () => {
    try {
      // Get accepted friend requests
      const { data: friendRequests, error: friendError } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`);

      if (friendError) throw friendError;

      const friendIds = friendRequests?.map(req => 
        req.sender_id === user?.id ? req.receiver_id : req.sender_id
      ) || [];

      if (friendIds.length === 0) {
        setFriends([]);
        return;
      }

      // Get friends' profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', friendIds);

      if (profileError) throw profileError;

      // Get friends' streaks
      const { data: streaks, error: streakError } = await supabase
        .from('streaks')
        .select('user_id, current_streak')
        .in('user_id', friendIds);

      if (streakError) throw streakError;

      // Get today's progress
      const today = new Date().toISOString().split('T')[0];
      const { data: todayProgress, error: progressError } = await supabase
        .from('daily_progress')
        .select('user_id, completed')
        .in('user_id', friendIds)
        .eq('date', today);

      if (progressError) throw progressError;

      // Combine the data
      const friendsProgress = profiles?.map(profile => {
        const streak = streaks?.find(s => s.user_id === profile.user_id);
        const progress = todayProgress?.find(p => p.user_id === profile.user_id);
        
        return {
          user_id: profile.user_id,
          username: profile.username || 'Unknown',
          avatar_url: profile.avatar_url,
          completed_today: progress?.completed || false,
          current_streak: streak?.current_streak || 0,
        };
      }) || [];

      setFriends(friendsProgress);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const pendingSent = friendRequests.filter(req => req.sender_id === user?.id && req.status === 'pending');
  const pendingReceived = friendRequests.filter(req => req.receiver_id === user?.id && req.status === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
            <TabsTrigger value="find">Find Friends</TabsTrigger>
            <TabsTrigger value="requests">
              Requests ({pendingReceived.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            {friends.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No friends yet. Find some friends to track progress together!
              </p>
            ) : (
              <div className="space-y-3">
                {friends.map(friend => (
                  <div key={friend.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={`${friend.username} profile`}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          {friend.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{friend.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {friend.current_streak} day streak
                        </p>
                      </div>
                    </div>
                    <Badge variant={friend.completed_today ? "default" : "secondary"}>
                      {friend.completed_today ? "✓ Completed Today" : "Not Done Today"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="find" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by username..."
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              />
              <Button onClick={searchUsers} disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map(profile => (
                  <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={`${profile.username} profile`}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          {(profile.username || profile.email || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{profile.username || 'No username'}</p>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => sendFriendRequest(profile.user_id)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Friend
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {pendingReceived.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Received Requests</h3>
                <div className="space-y-2">
                  {pendingReceived.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {request.sender_profile?.avatar_url ? (
                          <img
                            src={request.sender_profile.avatar_url}
                            alt={`${request.sender_profile.username} profile`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            {(request.sender_profile?.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{request.sender_profile?.username || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            Sent {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => respondToRequest(request.id, 'accepted')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => respondToRequest(request.id, 'rejected')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingSent.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Sent Requests</h3>
                <div className="space-y-2">
                  {pendingSent.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {request.receiver_profile?.avatar_url ? (
                          <img
                            src={request.receiver_profile.avatar_url}
                            alt={`${request.receiver_profile.username} profile`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            {(request.receiver_profile?.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{request.receiver_profile?.username || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            Sent {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingReceived.length === 0 && pendingSent.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No pending friend requests.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}