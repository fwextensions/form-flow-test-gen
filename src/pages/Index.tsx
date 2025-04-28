
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import FileUploader from "@/components/FileUploader";
import TestDataDisplay from "@/components/TestDataDisplay";
import Header from "@/components/Header";
import { parseFormSchema, InputField } from "@/lib/schemaParser";
import { generateTestData } from "@/lib/testDataGenerator";

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [formSchema, setFormSchema] = useState<any>(null);
  const [testSets, setTestSets] = useState<any[]>([]);
  const [inputFields, setInputFields] = useState<InputField[]>([]);
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
        description: "An error occurred while processing the form schema.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
      
      <main className="flex-1 container py-6 px-4 md:px-6">
        <div className="grid gap-6">
          {!testSets.length ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2 text-center mb-6">
                  <h2 className="text-2xl font-bold text-sf-navy">Upload Form.io Schema</h2>
                  <p className="text-muted-foreground">
                    Upload your form.io JSON schema to generate test data sets
                  </p>
                </div>
                <FileUploader
                  onFileLoaded={handleFileLoaded}
                  isProcessing={isProcessing}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
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
                    isProcessing={isProcessing}
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
