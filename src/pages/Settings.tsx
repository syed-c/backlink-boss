import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Tables<"user_profiles"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      // If profile doesn't exist, we might need to create one
      // We'll handle this in the useEffect
    } else {
      setProfile(data);
    }
    setLoading(false);
  }, [user]);

  const createProfile = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        display_name: user.email?.split('@')[0] || '',
        notification_email: true,
        notification_failure: true
      });

    if (error) {
      console.error('Error creating profile:', error);
    } else {
      // Refetch the newly created profile
      fetchProfile();
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // If profile is still null after fetching, create one
    if (user && !profile && !loading) {
      createProfile();
    }
  }, [user, profile, loading, createProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSaving(true);
    const formData = new FormData(e.target as HTMLFormElement);
    
    const updates = {
      display_name: formData.get('name') as string,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } else {
      toast.success("Profile updated successfully");
      // Update local state
      setProfile({ ...profile, ...updates });
    }
    setSaving(false);
  };

  const handleNotificationChange = async (field: 'notification_email' | 'notification_failure', checked: boolean) => {
    if (!user || !profile) return;

    const updates = {
      [field]: checked,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      toast.error("Failed to update notification settings");
      console.error(error);
    } else {
      toast.success("Notification settings updated");
      setProfile({ ...profile, ...updates });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={profile?.display_name || ''} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue={user?.email || ''} 
                  disabled 
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Manage your email notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Campaign Completion</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a campaign completes
                </p>
              </div>
              <Switch
                checked={profile?.notification_email ?? true}
                onCheckedChange={(checked) => handleNotificationChange('notification_email', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Campaign Failures</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a campaign fails
                </p>
              </div>
              <Switch
                checked={profile?.notification_failure ?? true}
                onCheckedChange={(checked) => handleNotificationChange('notification_failure', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;