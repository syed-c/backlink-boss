import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, ExternalLink, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const CampaignDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const campaign = {
    name: "Dubai Exhibition Stands Q1",
    website: "explore-dubai.com",
    status: "running",
    progress: 70,
    location: "Dubai",
    category: "Exhibition stand builders",
    companyName: "Stands Bay",
    pageType: "Blog",
    keywords: [
      "Exhibition stand builders in Dubai",
      "Exhibition stand contractors in Dubai",
      "Exhibition stand design company in Dubai",
    ],
  };

  const backlinks = [
    {
      id: 1,
      url: "https://example.com/backlink-1",
      status: "indexed",
      indexedUrl: "https://explore-dubai.com/blog/article-1",
      heading: "Top Exhibition Stand Builders in Dubai",
      timestamp: "2024-01-20 14:30",
    },
    {
      id: 2,
      url: "https://example.com/backlink-2",
      status: "indexed",
      indexedUrl: "https://explore-dubai.com/blog/article-2",
      heading: "How to Choose an Exhibition Stand Contractor",
      timestamp: "2024-01-20 15:45",
    },
    {
      id: 3,
      url: "https://example.com/backlink-3",
      status: "processing",
      indexedUrl: null,
      heading: null,
      timestamp: "2024-01-20 16:20",
    },
    {
      id: 4,
      url: "https://example.com/backlink-4",
      status: "pending",
      indexedUrl: null,
      heading: null,
      timestamp: null,
    },
  ];

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
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
              <p className="text-muted-foreground mt-1">{campaign.website}</p>
            </div>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
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
                    {campaign.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{campaign.progress}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-info transition-all"
                    style={{ width: `${campaign.progress}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Indexed</p>
                  <p className="text-2xl font-bold text-success">7</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-2xl font-bold">3</p>
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
                  <p className="font-medium">{campaign.pageType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{campaign.category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Company</p>
                  <p className="font-medium">{campaign.companyName}</p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground mb-2">Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {campaign.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
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
                        {backlink.status}
                      </Badge>
                    </div>
                    {backlink.timestamp && (
                      <span className="text-sm text-muted-foreground">{backlink.timestamp}</span>
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
                    {backlink.heading && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Heading:</span>
                        <span className="ml-2 font-medium">{backlink.heading}</span>
                      </div>
                    )}
                    {backlink.indexedUrl && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Indexed:</span>
                        <a
                          href={backlink.indexedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-success hover:underline flex items-center gap-1"
                        >
                          {backlink.indexedUrl}
                          <ExternalLink className="h-3 w-3" />
                        </a>
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
