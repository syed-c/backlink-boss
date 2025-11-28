import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink, Calendar, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";

const History = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<Tables<"index_history">[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<Tables<"index_history">[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('index_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching history:', error);
    } else {
      setHistory(data || []);
      setFilteredHistory(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, fetchHistory]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = history.filter(item => 
        item.heading.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.indexed_url.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHistory(filtered);
    } else {
      setFilteredHistory(history);
    }
  }, [searchTerm, history]);

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
        <div>
          <h1 className="text-3xl font-bold">History</h1>
          <p className="text-muted-foreground mt-1">View all indexed content</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Search History</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by heading or URL..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{item.heading}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            Website ID: {item.website_id}
                          </Badge>
                        </span>
                        <span className="flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          {item.backlinks_count} backlinks
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.created_at 
                            ? new Date(item.created_at).toLocaleDateString()
                            : 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={item.indexed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View indexed page
                      </a>
                    </div>
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

export default History;