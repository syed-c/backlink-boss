import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink, Calendar, Link2 } from "lucide-react";

const History = () => {
  const history = [
    {
      id: 1,
      heading: "Top Exhibition Stand Builders in Dubai",
      website: "explore-dubai.com",
      indexedUrl: "https://explore-dubai.com/blog/top-exhibition-stands",
      backlinksCount: 5,
      createdAt: "2024-01-20",
    },
    {
      id: 2,
      heading: "How to Choose an Exhibition Stand Contractor in Oman",
      website: "oman-booths.com",
      indexedUrl: "https://oman-booths.com/blog/choose-contractor",
      backlinksCount: 7,
      createdAt: "2024-01-19",
    },
    {
      id: 3,
      heading: "Exhibition Booth Design Trends in Saudi Arabia",
      website: "sa-contractors.com",
      indexedUrl: "https://sa-contractors.com/blog/design-trends",
      backlinksCount: 3,
      createdAt: "2024-01-18",
    },
  ];

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
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((item) => (
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
                            {item.website}
                          </Badge>
                        </span>
                        <span className="flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          {item.backlinksCount} backlinks
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={item.indexedUrl}
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
