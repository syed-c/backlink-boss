import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, Link2, Calendar, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Campaigns = () => {
  const navigate = useNavigate();

  const campaigns = [
    {
      id: 1,
      name: "Dubai Exhibition Stands Q1",
      website: "explore-dubai.com",
      status: "completed",
      progress: 100,
      indexed: 10,
      total: 10,
      createdAt: "2024-01-15",
    },
    {
      id: 2,
      name: "Oman Booth Builders Campaign",
      website: "oman-booths.com",
      status: "running",
      progress: 70,
      indexed: 7,
      total: 10,
      createdAt: "2024-01-20",
    },
    {
      id: 3,
      name: "Saudi Arabia Contractors SEO",
      website: "sa-contractors.com",
      status: "queued",
      progress: 0,
      indexed: 0,
      total: 15,
      createdAt: "2024-01-22",
    },
  ];

  const getStatusColor = (status: string) => {
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <p className="text-muted-foreground mt-1">Manage your indexing campaigns</p>
          </div>
          <Button onClick={() => navigate("/campaigns/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
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
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {campaign.website}
                        </span>
                        <span className="flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          {campaign.indexed}/{campaign.total} backlinks
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>

                  {campaign.status !== "queued" && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{campaign.progress}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            campaign.status === "completed" ? "bg-success" : "bg-info"
                          }`}
                          style={{ width: `${campaign.progress}%` }}
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
