import { useState, useEffect, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Globe, CheckCircle2, XCircle, Edit, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";

const Websites = () => {
  const [websites, setWebsites] = useState<Tables<"websites">[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [editingWebsite, setEditingWebsite] = useState<Tables<"websites"> | null>(null);
  const { user } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  const fetchWebsites = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to fetch websites");
      console.error(error);
    } else {
      setWebsites(data || []);
    }
    setLoading(false);
  }, [user]);

  const resetForm = useCallback(() => {
    setEditingWebsite(null);
    setConnectionTestResult(null);
    if (formRef.current) {
      formRef.current.reset();
    }
  }, []);

  const populateFormForEdit = useCallback(() => {
    if (editingWebsite && formRef.current) {
      const form = formRef.current;
      (form.elements.namedItem('name') as HTMLInputElement).value = editingWebsite.name;
      (form.elements.namedItem('url') as HTMLInputElement).value = editingWebsite.url;
      (form.elements.namedItem('username') as HTMLInputElement).value = editingWebsite.wp_username;
      (form.elements.namedItem('password') as HTMLInputElement).value = editingWebsite.wp_app_password;
      (form.elements.namedItem('categoryId') as HTMLInputElement).value = editingWebsite.category_id.toString();
      (form.elements.namedItem('sheetId') as HTMLInputElement).value = editingWebsite.heading_sheet_id || '';
      (form.elements.namedItem('sheetName') as HTMLInputElement).value = editingWebsite.heading_sheet_name || 'Headings';
      (form.elements.namedItem('imageModel') as HTMLSelectElement).value = editingWebsite.image_model || 'gptimage';
      (form.elements.namedItem('imageWidth') as HTMLInputElement).value = (editingWebsite.image_width || 1600).toString();
      (form.elements.namedItem('imageHeight') as HTMLInputElement).value = (editingWebsite.image_height || 900).toString();
    }
  }, [editingWebsite]);

  useEffect(() => {
    if (user) {
      fetchWebsites();
    }
  }, [user, fetchWebsites]);

  const handleOpenDialog = (website?: Tables<"websites">) => {
    if (website) {
      setEditingWebsite(website);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const testWordPressConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    setIsTestingConnection(true);
    setConnectionTestResult(null);

    const formData = new FormData(formRef.current);
    const url = formData.get('url') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    // Validate required fields
    if (!url || !username || !password) {
      toast.error("Please fill in all WordPress connection fields");
      setIsTestingConnection(false);
      return;
    }

    try {
      // Call the Supabase function to test the connection
      console.log("Testing WordPress connection to:", url);
      const { data, error } = await supabase.functions.invoke('test-wp-connection', {
        body: JSON.stringify({ url, username, password })
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(`Function error: ${error.message || 'Unknown error'}`);
      }

      setConnectionTestResult({
        success: data.success,
        message: data.message
      });

      if (data.success) {
        toast.success("WordPress connection successful!");
      } else {
        toast.error("WordPress connection failed: " + data.message);
      }
    } catch (error: unknown) {
      console.error("Connection test error:", error);
      const errorMessage = (error as Error).message || "Failed to test connection";
      setConnectionTestResult({
        success: false,
        message: errorMessage
      });
      toast.error("Connection test failed: " + errorMessage);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSubmitWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formRef.current) return;

    const formData = new FormData(formRef.current);
    
    // Validate required fields
    const name = formData.get('name') as string;
    const url = formData.get('url') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const categoryId = formData.get('categoryId') as string;

    if (!name || !url || !username || !password || !categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }

    const websiteData = {
      user_id: user.id,
      name: name,
      url: url,
      wp_username: username,
      wp_app_password: password,
      category_id: parseInt(categoryId),
      heading_sheet_id: formData.get('sheetId') as string || null,
      heading_sheet_name: formData.get('sheetName') as string || 'Headings',
      image_model: formData.get('imageModel') as string || 'gptimage',
      image_width: parseInt(formData.get('imageWidth') as string) || 1600,
      image_height: parseInt(formData.get('imageHeight') as string) || 900,
      status: 'connected'
    };

    try {
      let error;
      
      if (editingWebsite) {
        // Update existing website
        const { error: updateError } = await supabase
          .from('websites')
          .update(websiteData)
          .eq('id', editingWebsite.id);
        error = updateError;
      } else {
        // Create new website
        const { error: insertError } = await supabase
          .from('websites')
          .insert(websiteData);
        error = insertError;
      }

      if (error) {
        throw new Error(error.message);
      }

      toast.success(editingWebsite ? "Website updated successfully!" : "Website added successfully!");
      handleCloseDialog();
      fetchWebsites();
    } catch (error: unknown) {
      console.error("Website operation error:", error);
      toast.error((editingWebsite ? "Failed to update website: " : "Failed to add website: ") + ((error as Error).message || "Unknown error"));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('websites')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete website");
      console.error(error);
    } else {
      toast.success("Website deleted");
      setWebsites(websites.filter(w => w.id !== id));
    }
  };

  useEffect(() => {
    if (isDialogOpen && editingWebsite) {
      // Small delay to ensure DOM is ready
      setTimeout(populateFormForEdit, 100);
    }
  }, [isDialogOpen, editingWebsite, populateFormForEdit]);

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
            <h1 className="text-3xl font-bold">Websites</h1>
            <p className="text-muted-foreground mt-1">Manage your WordPress websites</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Website
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingWebsite ? "Edit Website" : "Add New Website"}</DialogTitle>
                <DialogDescription>
                  {editingWebsite 
                    ? "Update your WordPress website configuration" 
                    : "Connect a WordPress website to start indexing backlinks"}
                </DialogDescription>
              </DialogHeader>
              <form ref={formRef} onSubmit={handleSubmitWebsite} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Website Name *</Label>
                    <Input id="name" name="name" placeholder="My WordPress Site" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">Website URL *</Label>
                    <Input id="url" name="url" type="url" placeholder="https://example.com" required />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">WordPress Username *</Label>
                    <Input id="username" name="username" placeholder="admin" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Application Password *</Label>
                    <Input id="password" name="password" type="password" placeholder="xxxx xxxx xxxx xxxx" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Default Category ID *</Label>
                    <Input id="categoryId" name="categoryId" type="number" placeholder="1" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sheetId">Google Sheets ID</Label>
                    <Input id="sheetId" name="sheetId" placeholder="Sheet ID for headings" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sheetName">Google Sheets Name</Label>
                  <Input id="sheetName" name="sheetName" placeholder="Headings" defaultValue="Headings" />
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <h4 className="font-medium">Image Settings</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageModel">Image Model</Label>
                      <select id="imageModel" name="imageModel" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="gptimage">GPT Image</option>
                        <option value="flux">Flux</option>
                        <option value="dall-e">DALL-E</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageWidth">Width (px)</Label>
                      <Input id="imageWidth" name="imageWidth" type="number" defaultValue="1600" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageHeight">Height (px)</Label>
                      <Input id="imageHeight" name="imageHeight" type="number" defaultValue="900" />
                    </div>
                  </div>
                </div>

                {connectionTestResult && (
                  <div className={`p-3 rounded-md ${connectionTestResult.success ? 'bg-success-light' : 'bg-destructive-light'}`}>
                    <p className={`text-sm ${connectionTestResult.success ? 'text-success' : 'text-destructive'}`}>
                      {connectionTestResult.message}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={testWordPressConnection}
                    disabled={isTestingConnection}
                  >
                    {isTestingConnection ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingWebsite ? "Update Website" : "Save Website"}
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
                  <a 
                    href={website.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {website.url}
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Category ID</span>
                    <span className="font-medium">{website.category_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last updated</span>
                    <span className="font-medium">
                      {website.updated_at 
                        ? new Date(website.updated_at).toLocaleDateString() 
                        : 'Never'}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleOpenDialog(website)}
                    >
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