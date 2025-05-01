import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import FileUploader from "@/components/FileUploader";
import TestDataDisplay from "@/components/TestDataDisplay";
import Header from "@/components/Header";
import { parseFormSchema, InputField } from "@/lib/schemaParser";
import { generateTestData } from "@/lib/testDataGenerator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [formSchema, setFormSchema] = useState<any>(null);
  const [testSets, setTestSets] = useState<any[]>([]);
  const [inputFields, setInputFields] = useState<InputField[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const { toast } = useToast();

  const handleFileLoaded = async (content: any) => {
    try {
      setIsProcessing(true);
      setFormSchema(content);
      
      const { panels, allInputFields } = parseFormSchema(content);
      setInputFields(allInputFields);
      
      if (panels.length === 0) {
        toast({
          title: "Error parsing schema",
          description: "No panels or input fields found in the schema.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      // Generate test data
      const generatedData = await generateTestData(panels, allInputFields, 5);
      setTestSets(generatedData);
      
      toast({
        title: "Test data generated",
        description: `${generatedData.length} test sets created successfully.`,
      });
    } catch (error) {
      console.error("Error processing schema:", error);
      toast({
        title: "Error processing schema",
        description: `An error occurred while processing the form schema: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsFetchingUrl(false);
    }
  };

  // Function to handle loading schema from URL
  const handleUrlLoad = async () => {
    if (!urlInput) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to load the schema.",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingUrl(true);
    try {
      const response = await fetch(urlInput);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const content = await response.json();
      setUrlInput("");
      await handleFileLoaded(content);
    } catch (error) {
      console.error("Error fetching or parsing URL:", error);
      toast({
        title: "Error Loading URL",
        description: `Failed to load or parse JSON from URL: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
      setIsFetchingUrl(false);
    }
  };

  // Handle Enter key press in URL input
  const handleUrlInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleUrlLoad();
    }
  };

  const handleRegenerate = async () => {
    if (!formSchema) return;
    
    try {
      setIsRegenerating(true);
      
      const { panels, allInputFields } = parseFormSchema(formSchema);
      const newTestData = await generateTestData(panels, allInputFields, 5);
      setTestSets(newTestData);
      
      toast({
        title: "Test data regenerated",
        description: `${newTestData.length} new test sets created successfully.`,
      });
    } catch (error) {
      console.error("Error regenerating test data:", error);
      toast({
        title: "Error regenerating data",
        description: "An error occurred while regenerating test data.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="grid gap-8">
          {!testSets.length ? (
            <div>
              <Card>
                <CardContent className="pt-6">
                  {/* URL Input Section */}
                  <div className="mb-6 space-y-2">
                    <label htmlFor="schema-url" className="text-sm font-medium">Load Schema from URL</label>
                    <div className="flex space-x-2">
                      <Input
                        id="schema-url"
                        type="url"
                        placeholder="https://example.com/schema.json"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={handleUrlInputKeyDown}
                        disabled={isProcessing || isFetchingUrl}
                        className="text-base md:text-sm"
                      />
                      <Button onClick={handleUrlLoad} disabled={isProcessing || isFetchingUrl}>
                        {isFetchingUrl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Load Schema
                      </Button>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or Upload File
                      </span>
                    </div>
                  </div>

                  {/* File Uploader Section */}
                  <FileUploader
                    onFileLoaded={handleFileLoaded}
                    isProcessing={isProcessing || isFetchingUrl}
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-8">
              {!isProcessing && (
                <TestDataDisplay
                  testSets={testSets}
                  inputFields={inputFields}
                  onRegenerate={handleRegenerate}
                  isRegenerating={isRegenerating}
                />
              )}
              
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-center mb-6">
                    <h2 className="text-xl font-bold text-sf-navy">Upload a different form schema</h2>
                  </div>
                  <FileUploader
                    onFileLoaded={handleFileLoaded}
                    isProcessing={isProcessing || isFetchingUrl}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      
      <footer className="py-6 border-t">
        <div className="container flex flex-col items-center justify-center gap-2 text-center md:flex-row md:gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} City of San Francisco. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
