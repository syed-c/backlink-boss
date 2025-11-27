import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Globe, CheckCircle2, XCircle, Edit, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const Websites = () => {
  const [websites, setWebsites] = useState([
    {
      id: 1,
      name: "Explore Dubai",
      url: "https://explore-dubai.com",
      status: "connected",
      campaigns: 8,
      lastUsed: "2 hours ago",
    },
    {
      id: 2,
      name: "Oman Booths",
      url: "https://oman-booths.com",
      status: "connected",
      campaigns: 5,
      lastUsed: "1 day ago",
    },
    {
      id: 3,
      name: "Saudi Contractors",
      url: "https://sa-contractors.com",
      status: "disconnected",
      campaigns: 2,
      lastUsed: "3 days ago",
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Website added successfully!");
    setIsDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setWebsites(websites.filter(w => w.id !== id));
    toast.success("Website deleted");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Websites</h1>
            <p className="text-muted-foreground mt-1">Manage your WordPress websites</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Website
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Website</DialogTitle>
                <DialogDescription>
                  Connect a WordPress website to start indexing backlinks
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddWebsite} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Website Name</Label>
                    <Input id="name" placeholder="My WordPress Site" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">Website URL</Label>
                    <Input id="url" type="url" placeholder="https://example.com" required />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">WordPress Username</Label>
                    <Input id="username" placeholder="admin" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Application Password</Label>
                    <Input id="password" type="password" placeholder="xxxx xxxx xxxx xxxx" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Default Category ID</Label>
                    <Input id="categoryId" type="number" placeholder="1" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sheetId">Google Sheets ID</Label>
                    <Input id="sheetId" placeholder="Sheet ID for headings" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sheetName">Google Sheets Name</Label>
                  <Input id="sheetName" placeholder="Headings" defaultValue="Headings" />
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <h4 className="font-medium">Image Settings</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageModel">Image Model</Label>
                      <select id="imageModel" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="gptimage">GPT Image</option>
                        <option value="flux">Flux</option>
                        <option value="dall-e">DALL-E</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageWidth">Width (px)</Label>
                      <Input id="imageWidth" type="number" defaultValue="1600" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageHeight">Height (px)</Label>
                      <Input id="imageHeight" type="number" defaultValue="900" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1">
                    Test Connection
                  </Button>
                  <Button type="submit" className="flex-1">
                    Save Website
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {websites.map((website) => (
            <Card key={website.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{website.name}</CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      website.status === "connected"
                        ? "bg-success-light text-success border-success/20"
                        : "bg-destructive-light text-destructive border-destructive/20"
                    }
                  >
                    {website.status === "connected" ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {website.status}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  {website.url}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Campaigns</span>
                    <span className="font-medium">{website.campaigns}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last used</span>
                    <span className="font-medium">{website.lastUsed}</span>
                  </div>
                  <div className="flex gap-2 pt-3 border-t">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:bg-destructive-light"
                      onClick={() => handleDelete(website.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Websites;
