"use client"; // Required for client-side state and interactions

import React, { useState, useCallback } from "react"; // Import useCallback
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import FileUploader from "@/components/FileUploader";
import TestDataDisplay from "@/components/TestDataDisplay";
import Header from "@/components/Header";
import { parseFormSchema, InputField } from "@/lib/schemaParser"; // Keep if needed for frontend validation/display
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Define a type for the test set structure expected from the API
type TestSet = Record<string, any>;

export default function HomePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentSchema, setCurrentSchema] = useState<any>(null); // Store the schema used for generation
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [inputFields, setInputFields] = useState<InputField[]>([]); // Store parsed fields for display
  const [urlInput, setUrlInput] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [schemaPreview, setSchemaPreview] = useState<string | null>(null); // For displaying fetched/loaded schema
  const [numTestSets, setNumTestSets] = useState<number>(1);
//  const [numTestSets, setNumTestSets] = useState<number>(5);
  const { toast } = useToast();

  // --- Refactored Core Logic: Generate and Stream Test Data ---
  const generateAndStreamTestData = useCallback(async (schema: any, numberOfSets: number) => {
    setIsProcessing(true);
    setTestSets([]); // Clear previous results
    setCurrentSchema(schema); // Store the schema being processed
    setSchemaPreview(JSON.stringify(schema, null, 2)); // Preview the schema

    // Attempt to parse input fields for display purposes (optional frontend step)
    try {
      const { allInputFields } = parseFormSchema(schema); // Use parser just for field list
      setInputFields(allInputFields);
    } catch (parseError) {
      console.warn("Frontend schema parsing for field list failed (API will handle schema):", parseError);
      setInputFields([]); // Clear fields if parsing fails
    }

    try {
      // Call our backend API to generate test data
      const apiResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schema: schema, numTestSets: numberOfSets }), // Send full schema
      });

      if (!apiResponse.ok) {
        let errorBody = 'Unknown API error';
        try {
          errorBody = await apiResponse.text();
        } catch (_) {}
        throw new Error(`API error! status: ${apiResponse.status} - ${errorBody}`);
      }

      // Handle streaming response
      if (!apiResponse.body) {
        throw new Error("API response body is null");
      }

      const reader = apiResponse.body.pipeThrough(new TextDecoderStream()).getReader();
      let fullResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        fullResponse += value;
      }

      // Parse the complete JSON response
      let generatedSets: TestSet[] = [];
      try {
        generatedSets = JSON.parse(fullResponse);
        if (!Array.isArray(generatedSets)) {
          throw new Error("Invalid format received from API. Expected a JSON array.");
        }
        setTestSets(generatedSets);
      } catch (e) {
        console.error("Failed to parse the complete API JSON response:", fullResponse, e);
        throw new Error(`Failed to parse API response: ${e instanceof Error ? e.message : String(e)}`);
      }

      toast({
        title: "Test Data Generated",
        description: `Successfully generated ${generatedSets.length} test sets.`,
      });

    } catch (error) {
      console.error("Error during API call or streaming:", error);
      toast({
        title: "Error Generating Data",
        description: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
      setSchemaPreview(null); // Clear preview on error
      setTestSets([]); // Clear results on error
      setCurrentSchema(null);
      setInputFields([]);
    } finally {
      setIsProcessing(false);
      setIsFetchingUrl(false); // Ensure fetch URL state is reset
    }
  }, [toast]); // Add dependencies for useCallback

  // --- Handlers using the refactored logic ---

  // Handler for loading schema from URL
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
    // Keep setIsProcessing inside generateAndStreamTestData

    try {
      // 1. Fetch schema from URL (client-side)
      const schemaResponse = await fetch(urlInput);
      if (!schemaResponse.ok) {
        throw new Error(`HTTP error fetching schema! status: ${schemaResponse.status}`);
      }
      const schema = await schemaResponse.json();
      setUrlInput(""); // Clear input after successful fetch

      // 2. Call the shared function to generate data
      await generateAndStreamTestData(schema, numTestSets);

    } catch (error) {
      console.error("Error fetching schema from URL:", error);
      toast({
        title: "Error Fetching Schema",
        description: `Failed to fetch or parse schema from URL: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
      setSchemaPreview(null);
      setTestSets([]);
      setCurrentSchema(null);
      setInputFields([]);
      // Ensure processing state is reset even if fetch fails before calling generate
      setIsProcessing(false);
      setIsFetchingUrl(false);
    }
    // No finally block here, as generateAndStreamTestData handles its own finally
  };

  // Updated handler for file loading (used by FileUploader)
  // Accepts the already parsed JSON object from FileUploader
  const handleSchemaLoad = async (content: any) => { 
    if (!content) {
      toast({ title: "Error", description: "No file content received or file empty.", variant: "destructive" });
      return;
    }

    try {
      // Content is already a parsed object, assign directly
      const schema: any = content; 

      // Call the shared function to generate data
      await generateAndStreamTestData(schema, numTestSets);

    } catch (error) {
      // This catch block might now only catch errors from generateAndStreamTestData if it throws
      console.error("Error processing loaded schema:", error);
      toast({
        title: "Error Processing Schema",
        description: `An error occurred after loading the schema: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
      setSchemaPreview(null);
      setTestSets([]);
      setCurrentSchema(null);
      setInputFields([]);
      setIsProcessing(false); // Reset processing state on error
    }
  };

  // Handle Enter key press in URL input
  const handleUrlInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleUrlLoad();
    }
  };

  // Updated Regenerate handler to use stored schema
  const handleRegenerate = async () => {
    if (!currentSchema) {
       toast({
        title: "No Schema Loaded",
        description: "Load a schema first before regenerating.",
        variant: "destructive",
      });
      return;
    }
    
    setIsRegenerating(true); // Keep this specific state for the button
    await generateAndStreamTestData(currentSchema, numTestSets); // Use the stored schema
    setIsRegenerating(false);
  };

  return (
    <>
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="grid gap-8">
          {!testSets.length && !isProcessing ? (
            // Show Uploader/URL input if no results and not processing
            <Card className="w-full max-w-2xl mx-auto shadow-lg animate-fade-in">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-center text-sf-navy">Load Form.io Schema</h2>
                <div className="mb-6">
                  <label htmlFor="urlInput" className="block text-sm font-medium text-gray-700 mb-1">From URL</label>
                  <div className="flex gap-2">
                    <Input 
                      id="urlInput"
                      type="url" 
                      placeholder="Enter Form.io JSON schema URL" 
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={handleUrlInputKeyDown}
                      disabled={isProcessing || isFetchingUrl}
                      className="flex-grow"
                    />
                    <Button 
                      onClick={handleUrlLoad} 
                      disabled={isProcessing || isFetchingUrl || !urlInput}
                      className="bg-sf-teal hover:bg-sf-teal/90 text-white"
                    >
                      {isFetchingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load"}
                    </Button>
                  </div>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>
                
                <FileUploader 
                  onFileLoaded={handleSchemaLoad} // Use the updated handler
                  isProcessing={isProcessing} 
                />
              </CardContent>
            </Card>
          ) : (
            // Show results or processing indicator
            <div className="space-y-8">
              {/* Optional: Show Schema Preview */}
              {schemaPreview && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2 text-sf-charcoal">Loaded Schema Preview</h3>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60 whitespace-pre-wrap"> 
                      <code>{schemaPreview}</code>
                    </pre>
                  </CardContent>
                </Card>
              )}
              
              {isProcessing && !testSets.length ? (
                 <div className="flex justify-center items-center p-10">
                    <Loader2 className="h-8 w-8 animate-spin text-sf-blue" />
                    <span className="ml-2 text-lg text-sf-charcoal">Generating test data...</span>
                 </div>
              ) : (
                <TestDataDisplay 
                  testSets={testSets}
                  inputFields={inputFields} // Pass parsed fields for display labels
                  onRegenerate={handleRegenerate}
                  isRegenerating={isRegenerating}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
