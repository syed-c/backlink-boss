import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Rocket, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";

const NewCampaign = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [headingsFile, setHeadingsFile] = useState<File | null>(null);
  const [websites, setWebsites] = useState<Tables<"websites">[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state to persist data across steps
  const [formData, setFormData] = useState({
    campaignName: "",
    location: "",
    category: "",
    companyName: "",
    pageType: "",
    keyword1: "",
    keyword2: "",
    keyword3: "",
    keyword4: "",
    keyword5: ""
  });

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
      if (data && data.length > 0) {
        setSelectedWebsite(data[0].id);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchWebsites();
    }
  }, [user, fetchWebsites]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      toast.success("CSV file selected successfully");
    }
  };

  const handleHeadingsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setHeadingsFile(e.target.files[0]);
      toast.success("Headings file selected successfully");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedWebsite || !csvFile) return;

    setSubmitting(true);
    
    try {
      // Validate required fields
      if (!formData.campaignName || !formData.location || !formData.category || 
          !formData.companyName || !formData.pageType ||
          !formData.keyword1 || !formData.keyword2 || !formData.keyword3 || 
          !formData.keyword4 || !formData.keyword5) {
        toast.error("Please fill in all required fields");
        console.log("Missing fields:", formData);
        setSubmitting(false);
        return;
      }

      // Upload CSV file to Supabase storage (simplified for now)
      // In a real implementation, you would upload to Supabase Storage
      const filePath = `campaigns/${user.id}/${Date.now()}-${csvFile.name}`;
      
      // Upload headings file if provided
      let headingsFilePath = null;
      if (headingsFile) {
        headingsFilePath = `headings/${user.id}/${Date.now()}-${headingsFile.name}`;
      }

      // Try to create campaign with headings_file_path first
      try {
        const campaignDataWithHeadings = {
          user_id: user.id,
          website_id: selectedWebsite,
          name: formData.campaignName,
          location: formData.location,
          category: formData.category,
          company_name: formData.companyName,
          page_type: formData.pageType,
          keyword_1: formData.keyword1,
          keyword_2: formData.keyword2,
          keyword_3: formData.keyword3,
          keyword_4: formData.keyword4,
          keyword_5: formData.keyword5,
          status: 'queued' as const,
          total_backlinks: 0,
          csv_file_path: filePath,
          headings_file_path: headingsFilePath
        };

        const { data: campaignDataResponse, error: campaignError } = await supabase
          .from('campaigns')
          .insert([campaignDataWithHeadings])
          .select()
          .single();

        if (campaignError) throw campaignError;

        // Parse CSV file and create backlink records
        const backlinks = await parseCsvFile(csvFile);
        
        // Create backlink records
        if (backlinks.length > 0) {
          const backlinkRecords = backlinks.map(url => ({
            campaign_id: campaignDataResponse.id,
            url: url,
            status: 'pending'
          }));
          
          const { error: backlinkError } = await supabase
            .from('backlinks')
            .insert(backlinkRecords);
            
          if (backlinkError) {
            throw new Error(`Failed to create backlinks: ${backlinkError.message}`);
          }
          
          // Update campaign with total backlinks count
          await supabase
            .from('campaigns')
            .update({ total_backlinks: backlinks.length })
            .eq('id', campaignDataResponse.id);
        }

        // Automatically start campaign processing
        try {
          const { data, error } = await supabase.functions.invoke('process-campaign', {
            body: JSON.stringify({ campaignId: campaignDataResponse.id })
          });

          if (error) throw new Error(error.message);

          toast.success("Campaign created and processing started!");
        } catch (processingError) {
          console.error('Error starting campaign processing:', processingError);
          toast.error("Campaign created but failed to start processing automatically. You can start it manually.");
        }

        toast.success("Campaign created successfully!");
        navigate("/campaigns");
        return;
      } catch (insertError) {
        // If the error is about the headings_file_path column not existing,
        // try again without that field
        if (insertError instanceof Error && (insertError.message.includes('headings_file_path') || insertError.message.includes('column'))) {
          console.log("Retrying without headings_file_path column");
          
          const campaignDataWithoutHeadings = {
            user_id: user.id,
            website_id: selectedWebsite,
            name: formData.campaignName,
            location: formData.location,
            category: formData.category,
            company_name: formData.companyName,
            page_type: formData.pageType,
            keyword_1: formData.keyword1,
            keyword_2: formData.keyword2,
            keyword_3: formData.keyword3,
            keyword_4: formData.keyword4,
            keyword_5: formData.keyword5,
            status: 'queued' as const,
            total_backlinks: 0,
            csv_file_path: filePath
          };

          const { data: retryData, error: retryError } = await supabase
            .from('campaigns')
            .insert([campaignDataWithoutHeadings])
            .select()
            .single();
            
          if (retryError) {
            throw new Error(retryError.message);
          }
          
          // Parse CSV file and create backlink records
          const backlinks = await parseCsvFile(csvFile);
          
          // Create backlink records
          if (backlinks.length > 0) {
            const backlinkRecords = backlinks.map(url => ({
              campaign_id: retryData.id,
              url: url,
              status: 'pending'
            }));
            
            const { error: backlinkError } = await supabase
              .from('backlinks')
              .insert(backlinkRecords);
              
            if (backlinkError) {
              throw new Error(`Failed to create backlinks: ${backlinkError.message}`);
            }
            
            // Update campaign with total backlinks count
            await supabase
              .from('campaigns')
              .update({ total_backlinks: backlinks.length })
              .eq('id', retryData.id);
          }
          
          // Automatically start campaign processing
          try {
            const { data, error } = await supabase.functions.invoke('process-campaign', {
              body: JSON.stringify({ campaignId: retryData.id })
            });

            if (error) throw new Error(error.message);

            toast.success("Campaign created and processing started!");
          } catch (processingError) {
            console.error('Error starting campaign processing:', processingError);
            toast.error("Campaign created but failed to start processing automatically. You can start it manually.");
          }
          
          toast.success("Campaign created successfully!");
          navigate("/campaigns");
          return;
        }
        throw new Error(insertError instanceof Error ? insertError.message : "Unknown error");
      }
    } catch (error: unknown) {
      console.error("Error creating campaign:", error);
      toast.error((error as Error).message || "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  // Function to parse CSV file and extract links
  const parseCsvFile = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const lines = content.split('\n');
          
          if (lines.length <= 1) {
            resolve([]);
            return;
          }
          
          // Find the header row and locate the 'Link' column
          const headerRow = lines[0];
          const headers = headerRow.split(',').map(h => h.trim().toLowerCase());
          const linkColumnIndex = headers.indexOf('link');
          
          // If we can't find a 'Link' column, try other common names
          let columnIndex = linkColumnIndex;
          if (columnIndex === -1) {
            columnIndex = headers.indexOf('url');
          }
          if (columnIndex === -1) {
            columnIndex = headers.indexOf('backlink');
          }
          if (columnIndex === -1) {
            columnIndex = headers.indexOf('href');
          }
          
          // If still not found, assume first column contains URLs
          if (columnIndex === -1) {
            columnIndex = 0;
          }
          
          // Extract URLs from the specified column
          const urls: string[] = [];
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
              // Handle quoted values and escaped commas
              const columns = parseCsvLine(line);
              if (columns.length > columnIndex && columns[columnIndex].trim()) {
                const url = columns[columnIndex].trim().replace(/^"(.*)"$/, '$1'); // Remove surrounding quotes
                if (isValidUrl(url)) {
                  urls.push(url);
                }
              }
            }
          }
          
          resolve(urls);
        } catch (error) {
          reject(new Error('Failed to parse CSV file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };
  
  // Function to parse headings file (CSV or TXT)
  const parseHeadingsFile = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const lines = content.split('\n');
          
          // Extract headings from each line
          const headings: string[] = [];
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
              // For CSV files, take the first column
              // For TXT files, take the whole line
              const columns = parseCsvLine(line);
              const heading = columns[0].trim().replace(/^"(.*)"$/, '$1'); // Remove surrounding quotes
              if (heading) {
                headings.push(heading);
              }
            }
          }
          
          resolve(headings);
        } catch (error) {
          reject(new Error('Failed to parse headings file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };
  
  // Helper function to parse a CSV line handling quoted values
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          // Double quotes inside quoted field
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current);
    return result;
  };
  
  // Helper function to validate URLs
  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/campaigns")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Campaign</h1>
            <p className="text-muted-foreground mt-1">Set up your backlink indexing campaign</p>
          </div>
        </div>

        <div className="flex justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className={`flex items-center justify-center h-10 w-10 rounded-full border-2 transition-colors ${
                  step >= s
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-colors ${
                    step > s ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Step 1: Select Website</CardTitle>
              <CardDescription>Choose the WordPress website for this campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <select
                  id="website"
                  value={selectedWebsite}
                  onChange={(e) => setSelectedWebsite(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {websites.map((website) => (
                    <option key={website.id} value={website.id}>
                      {website.name} - {website.url}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={() => setStep(2)} className="w-full" disabled={!selectedWebsite}>
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Step 2: Upload Files</CardTitle>
              <CardDescription>Upload CSV file with backlinks and optional headings file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Backlinks CSV File *</h3>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    CSV must contain 'Link' column with backlink URLs
                  </p>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="max-w-xs mx-auto"
                  />
                </div>
                {csvFile && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">File selected: {csvFile.name}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">Headings File (Optional)</h3>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload a text file with one heading per line
                  </p>
                  <Input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleHeadingsFileChange}
                    className="max-w-xs mx-auto"
                  />
                </div>
                {headingsFile && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">File selected: {headingsFile.name}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  className="flex-1" 
                  disabled={!csvFile}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Step 3: Configure Campaign</CardTitle>
              <CardDescription>Set up campaign details and targeting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaignName">Campaign Name *</Label>
                <Input 
                  id="campaignName" 
                  name="campaignName" 
                  value={formData.campaignName}
                  onChange={handleInputChange}
                  placeholder="Dubai Exhibition Stands Q1" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input 
                    id="location" 
                    name="location" 
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Dubai" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input 
                    id="category" 
                    name="category" 
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="Exhibition stand builders" 
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input 
                    id="companyName" 
                    name="companyName" 
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Stands Bay" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pageType">Page Type *</Label>
                  <select
                    id="pageType"
                    name="pageType"
                    value={formData.pageType}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select page type</option>
                    <option value="blog">Blog</option>
                    <option value="service">Service Page</option>
                    <option value="landing">Landing Page</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Step 4: Add Keywords</CardTitle>
              <CardDescription>Enter keywords for anchor text interlinking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Label htmlFor={`keyword${i}`}>
                    Keyword {i} {i === 1 && "(Primary)"} *
                  </Label>
                  <Input 
                    id={`keyword${i}`} 
                    name={`keyword${i}`} 
                    value={formData[`keyword${i}` as keyof typeof formData]}
                    onChange={handleInputChange}
                    placeholder={`Enter keyword ${i}`} 
                    required 
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleLaunch} className="flex-1" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Campaign...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Launch Campaign
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NewCampaign;