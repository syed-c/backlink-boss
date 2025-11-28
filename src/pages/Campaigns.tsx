import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, Link2, Calendar, Eye, Play, Square, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

const Campaigns = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Tables<"campaigns">[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
    } else {
      setCampaigns(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user, fetchCampaigns]);

  const startCampaignProcessing = async (campaignId: string) => {
    setProcessing(campaignId);
    try {
      // First, verify the campaign exists
      const { data: campaignData, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (fetchError || !campaignData) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      console.log('Found campaign:', campaignData);

      // Update campaign status to running
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ status: 'running' })
        .eq('id', campaignId);

      if (updateError) throw new Error(updateError.message);

      console.log('Calling process-campaign function with campaignId:', campaignId);
      // Trigger the process-campaign function using Supabase client
      const functionParams = {
        body: JSON.stringify({ campaignId })
      };
      console.log('Function params:', functionParams);
      
      // Add a small delay to ensure the update is processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data, error } = await supabase.functions.invoke('process-campaign', functionParams);
      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function invocation error:', error);
        // Log more details about the error
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          
          // Check if it's a conflict error (campaign already running)
          if (error.message.includes('Edge Function returned a non-2xx status code')) {
            // Try to get more details from the response if available
            if (error.message.includes('409')) {
              throw new Error(`Campaign is already running. If you believe this is incorrect, please reset the campaign.`);
            } else if (error.message.includes('500')) {
              throw new Error(`Server error occurred. Please try again or reset the campaign if it's stuck.`);
            } else {
              throw new Error(`Campaign processing failed. Please try again or reset the campaign if it's stuck.`);
            }
          }
        }
        throw new Error(`Failed to start campaign processing: ${error.message}`);
      }

      if (data && !data.success) {
        console.error('Function execution error:', data.error);
        // Check if it's specifically a "campaign already running" error
        if (data.error && data.error.includes('already running')) {
          throw new Error(`Campaign is already running. If you believe this is incorrect, please reset the campaign.`);
        }
        // Show more detailed error message if available
        const errorMessage = data.error || 'Unknown error occurred during campaign processing';
        throw new Error(`Campaign processing failed: ${errorMessage}`);
      }

      // If there are more backlinks to process, continue processing
      if (data && data.remaining > 0) {
        // Automatically trigger the next batch after a short delay
        setTimeout(() => {
          startCampaignProcessing(campaignId);
        }, 1000);
      }

      toast.success("Campaign processing started!");
      fetchCampaigns(); // Refresh the campaign list
    } catch (error) {
      console.error('Error starting campaign processing:', error);
      let errorMessage = "Failed to start campaign processing";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        // Check if it's a response error with more details
        const errorDetails = error as { message: string; details?: unknown; context?: unknown; response?: unknown };
        if (errorDetails.details) {
          console.error('Error details:', errorDetails.details);
        }
        
        // If it's a FunctionsHttpError, log additional details
        if (errorDetails.context) {
          console.error('HTTP error context:', errorDetails.context);
          console.error('HTTP error response:', errorDetails.response);
        }
      }
      
      toast.error(errorMessage);
    } finally {
      // Only clear processing state if we're not continuing to process more backlinks
      // This is a simplification - in a real app you might want more sophisticated state management
      setProcessing(null);
    }
  };

  const stopCampaignProcessing = async (campaignId: string) => {
    setProcessing(campaignId);
    try {
      // Call the reset-campaign function
      const { data, error } = await supabase.functions.invoke('reset-campaign', {
        body: JSON.stringify({ campaignId })
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw new Error(error.message || "Failed to invoke reset function");
      }
      
      if (data) {
        if (!data.success) {
          throw new Error(data.error || "Failed to stop campaign processing");
        }
        toast.success("Campaign processing stopped and backlinks reset!");
      } else {
        throw new Error("No response data from reset function");
      }
      
      fetchCampaigns(); // Refresh the campaign list
    } catch (error) {
      console.error('Error stopping campaign processing:', error);
      let errorMessage = "Failed to stop campaign processing";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setProcessing(null);
    }
  };

  const resetStuckCampaign = async (campaignId: string) => {
    setProcessing(campaignId);
    try {
      // Call the reset-campaign function
      const { data, error } = await supabase.functions.invoke('reset-campaign', {
        body: JSON.stringify({ campaignId })
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw new Error(error.message || "Failed to invoke reset function");
      }
      
      if (data) {
        if (!data.success) {
          throw new Error(data.error || "Failed to reset campaign");
        }
        toast.success("Campaign and backlinks reset successfully!");
      } else {
        throw new Error("No response data from reset function");
      }
      
      fetchCampaigns(); // Refresh the campaign list
    } catch (error) {
      console.error('Error resetting campaign:', error);
      let errorMessage = "Failed to reset campaign";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setProcessing(null);
    }
  };



  


  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-muted text-muted-foreground";
    
    switch (status) {
      case "completed":
        return "bg-success-light text-success border-success/20";
      case "running":
        return "bg-info-light text-info border-info/20";
      case "queued":
        return "bg-warning-light text-warning border-warning/20";
      case "failed":
        return "bg-destructive-light text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const calculateProgress = (campaign: Tables<"campaigns">) => {
    if (!campaign.total_backlinks || campaign.total_backlinks === 0) return 0;
    if (!campaign.indexed_backlinks) return 0;
    return Math.round((campaign.indexed_backlinks / campaign.total_backlinks) * 100);
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
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <p className="text-muted-foreground mt-1">Manage your indexing campaigns</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/campaigns/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>

          </div>
        </div>

        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold">{campaign.name}</h3>
                        <Badge variant="outline" className={getStatusColor(campaign.status)}>
                          {campaign.status || "unknown"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {/* We would need to join with websites table to get the URL */}
                          Website ID: {campaign.website_id}
                        </span>
                        <span className="flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          {campaign.indexed_backlinks || 0}/{campaign.total_backlinks || 0} backlinks
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {campaign.created_at 
                            ? new Date(campaign.created_at).toLocaleDateString()
                            : 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(campaign.status === "queued" || campaign.status === "failed") && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => startCampaignProcessing(campaign.id)}
                          disabled={processing === campaign.id}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {processing === campaign.id ? "Starting..." : "Start Processing"}
                        </Button>
                      )}
                      {campaign.status === "running" && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => stopCampaignProcessing(campaign.id)}
                          disabled={processing === campaign.id}
                        >
                          <Square className="h-4 w-4 mr-2" />
                          {processing === campaign.id ? "Stopping..." : "Stop Processing"}
                        </Button>
                      )}
                      {campaign.status === "failed" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => resetStuckCampaign(campaign.id)}
                          disabled={processing === campaign.id}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          {processing === campaign.id ? "Resetting..." : "Reset Campaign"}
                        </Button>
                      )}
                      {campaign.status === "running" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => resetStuckCampaign(campaign.id)}
                          disabled={processing === campaign.id}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          {processing === campaign.id ? "Resetting..." : "Reset Stuck"}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>

                  {campaign.status !== "queued" && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{calculateProgress(campaign)}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            campaign.status === "completed" ? "bg-success" : "bg-info"
                          }`}
                          style={{ width: `${calculateProgress(campaign)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Campaigns;