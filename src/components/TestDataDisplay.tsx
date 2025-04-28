
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import TestPanel from "./TestPanel";

interface TestDataDisplayProps {
  testSets: Array<{
    panels: Array<{
      title: string;
      fields: Record<string, any>;
    }>;
  }>;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

const TestDataDisplay: React.FC<TestDataDisplayProps> = ({
  testSets,
  onRegenerate,
  isRegenerating,
}) => {
  const [activeTab, setActiveTab] = useState("0");
  const { toast } = useToast();

  if (!testSets || testSets.length === 0) {
    return null;
  }

  const copyAllData = (testSetIndex: number) => {
    const dataSet = testSets[testSetIndex];
    let combinedData: Record<string, any> = {};
    
    dataSet.panels.forEach((panel) => {
      combinedData = { ...combinedData, ...panel.fields };
    });
    
    const dataStr = JSON.stringify(combinedData, null, 2);
    navigator.clipboard.writeText(dataStr);
    
    toast({
      title: "Copied to clipboard",
      description: `Complete test set ${parseInt(testSetIndex.toString()) + 1} has been copied to clipboard.`,
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
            
            <div className="space-y-4">
              {testSet.panels.map((panel, panelIndex) => (
                <TestPanel
                  key={`${testIndex}-${panelIndex}`}
                  title={panel.title}
                  testData={panel.fields}
                  panelIndex={panelIndex}
                  testIndex={testIndex}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TestDataDisplay;
