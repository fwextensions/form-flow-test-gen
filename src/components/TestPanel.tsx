
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { InputField } from "@/lib/schemaParser";

interface TestPanelProps {
  title: string;
  testData: Record<string, any>;
  panelIndex: number;
  testIndex: number;
  inputFields: InputField[]; // Add inputFields prop to access labels
}

const TestPanel: React.FC<TestPanelProps> = ({
  title,
  testData,
  panelIndex,
  testIndex,
  inputFields,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [copiedFields, setCopiedFields] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Helper function to get the label for a field key
  const getFieldLabel = (fieldKey: string): string => {
    // Find the input field with the matching key
    const field = inputFields.find(f => {
      const key = f.key.includes('.') ? f.key.split('.').pop() || f.key : f.key;
      return key === fieldKey;
    });
    
    // Return the label if found, otherwise return the original key
    return field?.label || fieldKey;
  };

  const copyToClipboard = (data: any, label: string) => {
    const dataStr = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(dataStr);
    
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied to clipboard.`,
    });
    
    return true;
  };

  const copyPanelData = () => {
    setHasCopied(copyToClipboard(testData, `Test data for ${title}`));
    setTimeout(() => setHasCopied(false), 2000);
  };

  const copyFieldData = (field: string, value: any) => {
    const success = copyToClipboard(value, `Value for ${getFieldLabel(field)}`);
    if (success) {
      setCopiedFields(prev => ({ ...prev, [field]: true }));
      setTimeout(() => {
        setCopiedFields(prev => ({ ...prev, [field]: false }));
      }, 2000);
    }
  };

  return (
    <Card className={cn("mb-4 overflow-hidden transition-all", 
      isCollapsed ? "max-h-16" : "max-h-[1000px]")}>
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer bg-muted/50" 
        onClick={() => setIsCollapsed(!isCollapsed)}>
        <CardTitle className="text-base font-medium flex items-center">
          <span className="inline-block w-6 h-6 rounded-full bg-sf-blue text-white flex items-center justify-center text-xs mr-2">
            {panelIndex + 1}
          </span>
          {title}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            (Test Set {testIndex + 1})
          </span>
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={(e) => {
          e.stopPropagation();
          copyPanelData();
        }} className={cn(hasCopied ? "text-green-500" : "")}>
          <Copy className="h-4 w-4 mr-1" />
          {hasCopied ? "Copied!" : "Copy Panel"}
        </Button>
      </CardHeader>
      <CardContent 
        className={cn("transition-all duration-300 ease-in-out", 
          isCollapsed ? "p-0 h-0" : "p-4")}
      >
        {!isCollapsed && (
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(testData).map(([field, value]) => (
              <div key={field} className="grid grid-cols-12 gap-2 p-2 rounded-md hover:bg-muted/40">
                <div className="col-span-5 font-medium text-sm text-muted-foreground">
                  {getFieldLabel(field)}:
                </div>
                <div className="col-span-6 text-sm break-words">
                  {typeof value === "object" 
                    ? JSON.stringify(value) 
                    : String(value)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn("h-6 w-6 p-0", copiedFields[field] ? "text-green-500" : "")}
                    onClick={() => copyFieldData(field, value)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestPanel;
