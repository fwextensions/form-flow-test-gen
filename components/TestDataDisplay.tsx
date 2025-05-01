import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { InputField } from "@/lib/schemaParser";

interface TestDataDisplayProps {
  testSets: Array<Record<string, any>>;
  inputFields: InputField[];
  onRegenerate: () => void;
  isRegenerating: boolean;
}

const TestDataDisplay: React.FC<TestDataDisplayProps> = ({
  testSets,
  inputFields,
  onRegenerate,
  isRegenerating,
}) => {
  const [activeTab, setActiveTab] = useState("0");
  const { toast } = useToast();

  if (!testSets || testSets.length === 0) {
    return null;
  }

  const getFieldLabel = (key: string): string => {
    const field = inputFields.find(f => f.key === key);
    return field?.label || key;
  };

  const copyAllData = (testSetIndex: number) => {
    const dataSet = testSets[testSetIndex];
    const dataStr = JSON.stringify(dataSet, null, 2);
    navigator.clipboard.writeText(dataStr);
    toast({
      title: "Copied to clipboard",
      description: `Complete test set ${testSetIndex + 1} has been copied to clipboard.`,
    });
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-sf-navy">
          Generated Test Data
        </h2>
        <Button 
          onClick={onRegenerate} 
          disabled={isRegenerating}
          variant="outline"
          className="border-sf-teal text-sf-teal hover:bg-sf-teal/10"
        >
          {isRegenerating ? "Regenerating..." : "Regenerate Test Data"}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          {testSets.map((_, index) => (
            <TabsTrigger key={index} value={index.toString()} className="relative">
              Test Set {index + 1}
              {index.toString() === activeTab && (
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-sf-blue"></span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {testSets.map((testSet, testIndex) => (
          <TabsContent key={testIndex} value={testIndex.toString()} className="pt-2">
            <div className="mb-4 flex justify-end">
              <Button 
                onClick={() => copyAllData(testIndex)} 
                variant="default"
                className="bg-sf-blue hover:bg-sf-blue/90"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy All Data
              </Button>
            </div>
            
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-700">Test Set {testIndex + 1} Data</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Apply grid to the parent container */}
                <div className="divide-y divide-gray-100 grid grid-cols-[auto,minmax(0,1fr)] gap-x-4">
                  {Object.entries(testSet).map(([key, value]) => (
                    // Render key and value spans directly within the parent grid 
                    // Use React.Fragment for key prop without adding extra DOM element
                    <React.Fragment key={key}>
                      <span className="font-medium text-gray-600 py-1.5 text-sm">
                        {getFieldLabel(key)}:
                      </span>
                      {/* Render value directly, make font semi-bold */}
                      <span className="text-gray-800 break-words py-1.5 text-sm font-semibold">
                        {typeof value === 'boolean' ? value.toString() : value} 
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TestDataDisplay;
