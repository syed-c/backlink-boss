import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, ExternalLink, CheckCircle2, Clock, XCircle, Play, Square } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

const CampaignDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Tables<"campaigns"> | null>(null);
  const [backlinks, setBacklinks] = useState<Tables<"backlinks">[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchCampaignDetails = useCallback(async () => {
    if (!user || !id) return;

    setLoading(true);
    
    // Fetch campaign details
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (campaignError) {
      console.error('Error fetching campaign:', campaignError);
      setLoading(false);
      return;
    }

    setCampaign(campaignData);

    // Fetch backlinks for this campaign
    const { data: backlinksData, error: backlinksError } = await supabase
      .from('backlinks')
      .select('*')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false });

    if (backlinksError) {
      console.error('Error fetching backlinks:', backlinksError);
    } else {
      setBacklinks(backlinksData || []);
    }

    setLoading(false);
  }, [user, id]);

  useEffect(() => {
    if (user && id) {
      fetchCampaignDetails();
    }
  }, [user, id, fetchCampaignDetails]);

  const startCampaignProcessing = async () => {
    if (!id) return;
    
    setProcessing(true);
    try {
      // Update campaign status to running
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ status: 'running' })
        .eq('id', id);

      if (updateError) throw new Error(updateError.message);

      // Trigger the process-campaign function using Supabase client
      const { data, error } = await supabase.functions.invoke('process-campaign', {
        body: { campaignId: id }
      });

      if (error) throw new Error(error.message);

      // If there are more backlinks to process, continue processing
      if (data && data.remaining > 0) {
        // Automatically trigger the next batch after a short delay
        setTimeout(() => {
          startCampaignProcessing();
        }, 1000);
      }

      toast.success("Campaign processing started!");
      fetchCampaignDetails(); // Refresh the campaign details
    } catch (error) {
      console.error('Error starting campaign processing:', error);
      toast.error((error as Error).message || "Failed to start campaign processing");
    } finally {
      // Only clear processing state if we're not continuing to process more backlinks
      setProcessing(false);
    }
  };

  const stopCampaignProcessing = async () => {
    if (!id) return;
    
    setProcessing(true);
    try {
      // Update campaign status to queued
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ status: 'queued' })
        .eq('id', id);

      if (updateError) throw new Error(updateError.message);

      toast.success("Campaign processing stopped!");
      fetchCampaignDetails(); // Refresh the campaign details
    } catch (error) {
      console.error('Error stopping campaign processing:', error);
      toast.error((error as Error).message || "Failed to stop campaign processing");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string | null) => {
    if (!status) return <Clock className="h-4 w-4 text-muted-foreground" />;
    
    switch (status) {
      case "indexed":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "processing":
        return <Clock className="h-4 w-4 text-info" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-muted text-muted-foreground";
    
    switch (status) {
      case "indexed":
        return "bg-success-light text-success border-success/20";
      case "processing":
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

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-2xl font-bold mb-4">Campaign Not Found</h2>
          <Button onClick={() => navigate("/campaigns")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const calculateProgress = () => {
    if (!campaign.total_backlinks || campaign.total_backlinks === 0) return 0;
    if (!campaign.indexed_backlinks) return 0;
    return Math.round((campaign.indexed_backlinks / campaign.total_backlinks) * 100);
  };

  const progress = calculateProgress();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/campaigns")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{campaign.name}</h1>
              <p className="text-muted-foreground mt-1">Campaign ID: {campaign.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {campaign.status === "queued" && (
              <Button onClick={startCampaignProcessing} disabled={processing}>
                <Play className="h-4 w-4 mr-2" />
                {processing ? "Starting..." : "Start Processing"}
              </Button>
            )}
            {campaign.status === "running" && (
              <Button onClick={stopCampaignProcessing} disabled={processing} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                {processing ? "Stopping..." : "Stop Processing"}
              </Button>
            )}
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Campaign Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className={getStatusColor(campaign.status)}>
                    {campaign.status || "unknown"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-info transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Indexed</p>
                  <p className="text-2xl font-bold text-success">{campaign.indexed_backlinks || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-2xl font-bold">
                    {(campaign.total_backlinks || 0) - (campaign.indexed_backlinks || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{campaign.location}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Page Type</p>
                  <p className="font-medium">{campaign.page_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{campaign.category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Company</p>
                  <p className="font-medium">{campaign.company_name}</p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground mb-2">Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {[campaign.keyword_1, campaign.keyword_2, campaign.keyword_3, campaign.keyword_4, campaign.keyword_5]
                    .filter(keyword => keyword)
                    .map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                </div>
              </div>
              {campaign.headings_file_path && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Headings File</p>
                  <p className="font-medium text-sm break-all">{campaign.headings_file_path}</p>
                  <Badge variant="outline" className="mt-1">Custom headings uploaded</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Backlinks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {backlinks.map((backlink) => (
                <div
                  key={backlink.id}
                  className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(backlink.status)}
                      <Badge variant="outline" className={getStatusColor(backlink.status)}>
                        {backlink.status || "pending"}
                      </Badge>
                    </div>
                    {backlink.created_at && (
                      <span className="text-sm text-muted-foreground">
                        {new Date(backlink.created_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Source:</span>
                      <a
                        href={backlink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {backlink.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {backlink.heading_generated && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Heading:</span>
                        <span className="ml-2 font-medium">{backlink.heading_generated}</span>
                      </div>
                    )}
                    {backlink.indexed_blog_url && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Indexed:</span>
                        <a
                          href={backlink.indexed_blog_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-success hover:underline flex items-center gap-1"
                        >
                          View Blog Post
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {backlink.error_message && (
                      <div className="text-sm text-destructive">
                        <span className="text-muted-foreground">Error:</span>
                        <span className="ml-2">{backlink.error_message}</span>
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

export default CampaignDetails;