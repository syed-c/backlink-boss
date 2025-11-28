import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, FolderKanban, Link2, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalWebsites: 0,
    activeCampaigns: 0,
    totalBacklinks: 0,
    successRate: 0
  });
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: number;
    campaign: string;
    website: string;
    status: string;
    backlinks: number;
    progress?: number;
    time: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch websites count
      const { count: websitesCount } = await supabase
        .from('websites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch campaigns count
      const { count: campaignsCount } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch backlinks count
      const { count: backlinksCount, error: backlinksError } = await supabase
        .from('backlinks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'indexed');

      // For now, we'll use mock data for recent activity since we need to join tables
      // In a real implementation, this would be a more complex query
      const mockActivity = [
        {
          id: 1,
          campaign: "Dubai Exhibition Stands",
          website: "explore-dubai.com",
          status: "completed",
          backlinks: 10,
          time: "2 hours ago",
        },
        {
          id: 2,
          campaign: "Oman Booth Builders",
          website: "oman-booths.com",
          status: "running",
          backlinks: 7,
          progress: 70,
          time: "4 hours ago",
        },
        {
          id: 3,
          campaign: "Saudi Arabia Contractors",
          website: "sa-contractors.com",
          status: "completed",
          backlinks: 15,
          time: "1 day ago",
        },
      ];

      setStats({
        totalWebsites: websitesCount || 0,
        activeCampaigns: campaignsCount || 0,
        totalBacklinks: backlinksCount || 0,
        successRate: backlinksCount && backlinksCount > 0 ? 94 : 0
      });

      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success-light text-success border-success/20";
      case "running":
        return "bg-info-light text-info border-info/20";
      case "failed":
        return "bg-destructive-light text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/websites")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Website
            </Button>
            <Button onClick={() => navigate("/campaigns/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card key="websites" className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Websites
              </CardTitle>
              <Globe className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalWebsites}</div>
            </CardContent>
          </Card>
          <Card key="campaigns" className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Campaigns
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeCampaigns}</div>
            </CardContent>
          </Card>
          <Card key="backlinks" className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Backlinks
              </CardTitle>
              <Link2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalBacklinks}</div>
            </CardContent>
          </Card>
          <Card key="success" className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.successRate}%</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest indexing campaigns</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/campaigns")}>
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/campaigns/${activity.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{activity.campaign}</h4>
                      <Badge variant="outline" className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {activity.website}
                      </span>
                      <span className="flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        {activity.backlinks} backlinks
                      </span>
                      <span>{activity.time}</span>
                    </div>
                    {activity.status === "running" && activity.progress && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{activity.progress}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-info transition-all"
                            style={{ width: `${activity.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;