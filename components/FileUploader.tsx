
import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface FileUploaderProps {
  onFileLoaded: (content: any) => void;
  isProcessing: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileLoaded, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const processFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          setFileName(file.name);
          onFileLoaded(content);
          toast({
            title: "File loaded successfully",
            description: `${file.name} has been loaded and is being processed.`,
          });
        } catch (error) {
          console.error("Error parsing JSON file:", error);
          toast({
            title: "Error loading file",
            description: "Please ensure the file is a valid JSON document.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    },
    [onFileLoaded, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === "application/json" || file.name.endsWith(".json")) {
          processFile(file);
        } else {
          toast({
            title: "Invalid file type",
            description: "Please upload a JSON file.",
            variant: "destructive",
          });
        }
      }
    },
    [processFile, toast]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (file.type === "application/json" || file.name.endsWith(".json")) {
          processFile(file);
        } else {
          toast({
            title: "Invalid file type",
            description: "Please upload a JSON file.",
            variant: "destructive",
          });
        }
      }
    },
    [processFile, toast]
  );

  const handleButtonClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  return (
    <div
      className={cn(
        "drop-area border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
        isDragging ? "border-primary bg-primary/5" : "border-gray-300",
        isProcessing ? "opacity-50 pointer-events-none" : ""
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleButtonClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".json"
        className="hidden"
        disabled={isProcessing}
      />
      
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          {fileName ? (
            <FileText className="w-8 h-8 text-primary" />
          ) : (
            <Upload className="w-8 h-8 text-primary" />
          )}
        </div>
        
        {fileName ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">File loaded: {fileName}</p>
            <p className="text-xs text-muted-foreground">
              {isProcessing ? "Processing..." : "Processing complete. Generating test data..."}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-lg font-medium">Drag & drop your form.io JSON file here</p>
            <p className="text-sm text-muted-foreground">or click to browse files</p>
          </div>
        )}

        {!fileName && (
          <Button variant="outline" className="mt-2" disabled={isProcessing}>
            <Upload className="mr-2 h-4 w-4" /> Select JSON File
          </Button>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
