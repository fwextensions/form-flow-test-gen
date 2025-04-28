
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface TestPanelProps {
  title: string;
  testData: Record<string, any>;
  panelIndex: number;
  testIndex: number;
}

const TestPanel: React.FC<TestPanelProps> = ({
  title,
  testData,
  panelIndex,
  testIndex,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = () => {
    const dataStr = JSON.stringify(testData, null, 2);
    navigator.clipboard.writeText(dataStr);
    setHasCopied(true);
    
    toast({
      title: "Copied to clipboard",
      description: `Test data for ${title} has been copied to clipboard.`,
    });
    
    setTimeout(() => setHasCopied(false), 2000);
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
          copyToClipboard();
        }} className={cn(hasCopied ? "text-green-500" : "")}>
          <Copy className="h-4 w-4 mr-1" />
          {hasCopied ? "Copied!" : "Copy"}
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
                  {field}:
                </div>
                <div className="col-span-7 text-sm break-words">
                  {typeof value === "object" 
                    ? JSON.stringify(value) 
                    : String(value)}
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
