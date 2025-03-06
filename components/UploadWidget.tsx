"use client";

import type React from "react";
import { Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useCallback } from "react";

interface UploadWidgetProps {
  onFileUpload: (file: File) => void;
}

const UploadWidget = ({ onFileUpload }: UploadWidgetProps) => {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    if (!file.name.endsWith(".zip")) {
      setError("Please upload a ZIP file");
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        setFileName(file.name);
        onFileUpload(file);
      }
    },
    [onFileUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        setFileName(file.name);
        onFileUpload(file);
      }
    },
    [onFileUpload]
  );

  const handleClick = () => {
    document.getElementById("file-upload")?.click();
  };

  return (
    <>
      <Card
        onClick={handleClick}
        className={`w-full min-w-2xl cursor-pointer p-12 hover:bg-foreground/1 ${isDragging ? "border-primary" : ""}`}
      >
        <CardContent className="flex flex-col items-center justify-center gap-6">
          <div
            className={`w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 transition-colors
            ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upload Your Data</h2>
            <p className="text-muted-foreground text-center mb-4">Click or drag & drop your ZIP file.</p>
            <input type="file" id="file-upload" className="hidden" accept=".zip" onChange={handleFileChange} />
          </div>
        </CardContent>
      </Card>
      {error && <p className="text-destructive mt-4 text-xl">{error}</p>}
      {fileName && <p className="mt-4 text-xl">Uploaded file: {fileName}</p>}
    </>
  );
};

export default UploadWidget;
