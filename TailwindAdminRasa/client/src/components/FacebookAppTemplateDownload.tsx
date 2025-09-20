import React from "react";
import { Download, FileText, Info, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { generateCSVTemplate, generateJSONTemplate } from "@/utils/facebookAppParser";
import { useToast } from "@/hooks/use-toast";

interface FacebookAppTemplateDownloadProps {
  className?: string;
  variant?: "default" | "compact";
}

export function FacebookAppTemplateDownload({ 
  className = "",
  variant = "default" 
}: FacebookAppTemplateDownloadProps) {
  const { toast } = useToast();

  // 📄 Download CSV template
  const downloadCSVTemplate = () => {
    try {
      const csvContent = generateCSVTemplate();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'facebook-apps-template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "CSV Template Downloaded",
        description: "The CSV template has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Failed to download CSV template. Please try again.",
      });
    }
  };

  // 📋 Download JSON template
  const downloadJSONTemplate = () => {
    try {
      const jsonContent = generateJSONTemplate();
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'facebook-apps-template.json';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "JSON Template Downloaded",
        description: "The JSON template has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive", 
        title: "Download Failed",
        description: "Failed to download JSON template. Please try again.",
      });
    }
  };

  // 📋 Copy JSON template to clipboard
  const copyJSONTemplate = async () => {
    try {
      const jsonContent = generateJSONTemplate();
      await navigator.clipboard.writeText(jsonContent);
      
      toast({
        title: "JSON Copied",
        description: "The JSON template has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy Failed", 
        description: "Failed to copy JSON template. Please try downloading instead.",
      });
    }
  };

  // Compact variant for toolbar/inline use
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCSVTemplate}
                className="h-8"
              >
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download CSV template for bulk import</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadJSONTemplate}
                className="h-8"
              >
                <Download className="h-4 w-4 mr-1" />
                JSON
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download JSON template for bulk import</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Info className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>📥 Facebook Apps Import Format Guide</DialogTitle>
              <DialogDescription>
                Learn how to format your CSV or JSON files for bulk Facebook app import
              </DialogDescription>
            </DialogHeader>
            <FormatGuideContent />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Default variant - full card
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Download Import Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CSV Template */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                📄 CSV Template
                <Badge variant="secondary">Recommended</Badge>
              </h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Excel-compatible CSV format with headers and sample data
            </p>
            <Button onClick={downloadCSVTemplate} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
          </div>

          {/* JSON Template */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                📋 JSON Template
                <Badge variant="outline">Advanced</Badge>
              </h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Structured JSON format for programmatic use
            </p>
            <div className="flex gap-2">
              <Button onClick={downloadJSONTemplate} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={copyJSONTemplate} variant="outline" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Format Guide Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full">
              <Info className="h-4 w-4 mr-2" />
              View Format Guide & Examples
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>📥 Facebook Apps Import Format Guide</DialogTitle>
              <DialogDescription>
                Learn how to format your CSV or JSON files for bulk Facebook app import
              </DialogDescription>
            </DialogHeader>
            <FormatGuideContent />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Format guide content component
function FormatGuideContent() {
  return (
    <div className="space-y-6">
      {/* Required Fields */}
      <div>
        <h3 className="text-lg font-semibold mb-3">📋 Required Fields</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Required</Badge>
              <code className="text-sm">appName</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Friendly name for your Facebook app (2-100 characters)
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Required</Badge>
              <code className="text-sm">appId</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Facebook App ID (10-20 digit number)
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Required</Badge>
              <code className="text-sm">appSecret</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Facebook App Secret (minimum 32 characters)
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Optional</Badge>
              <code className="text-sm">environment</code>
            </div>
            <p className="text-sm text-muted-foreground">
              development, production, or staging (default: development)
            </p>
          </div>
        </div>
      </div>

      {/* CSV Format */}
      <div>
        <h3 className="text-lg font-semibold mb-3">📄 CSV Format Example</h3>
        <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm">
          <pre>{`appName,appId,appSecret,environment,description
"My Facebook App","1234567890123456","abcd1234567890abcd1234567890abcd","development","Development app for testing"
"Production App","9876543210987654","zyxw9876543210zyxw9876543210zyxw","production","Main production application"`}</pre>
        </div>
      </div>

      {/* JSON Format */}
      <div>
        <h3 className="text-lg font-semibold mb-3">📋 JSON Format Example</h3>
        <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm">
          <pre>{`{
  "apps": [
    {
      "appName": "My Facebook App",
      "appId": "1234567890123456", 
      "appSecret": "abcd1234567890abcd1234567890abcd",
      "environment": "development",
      "description": "Development app for testing"
    }
  ]
}`}</pre>
        </div>
      </div>

      {/* Validation Rules */}
      <div>
        <h3 className="text-lg font-semibold mb-3">✅ Validation Rules</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5" />
            <span><strong>App Name:</strong> 2-100 characters, must be unique</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5" />
            <span><strong>App ID:</strong> 10-20 digits, numeric only, must be unique</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5" />
            <span><strong>App Secret:</strong> Minimum 32 characters (Facebook requirement)</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5" />
            <span><strong>Environment:</strong> Must be "development", "production", or "staging"</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5" />
            <span><strong>Description:</strong> Optional, maximum 500 characters</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5" />
            <span><strong>Limit:</strong> Maximum 50 apps per import batch</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div>
        <h3 className="text-lg font-semibold mb-3">💡 Tips for Success</h3>
        <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
          <p>• Download the template first and follow the exact format</p>
          <p>• Test with a small batch (1-2 apps) before importing large files</p>
          <p>• Ensure App IDs and secrets are from your Facebook Developer Console</p>
          <p>• Use unique App Names and IDs to avoid conflicts</p>
          <p>• Keep app secrets secure and never share them publicly</p>
        </div>
      </div>
    </div>
  );
}