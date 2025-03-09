"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface UploadWidgetProps {
  onFileUpload: (file: File) => void;
}

export default function UploadWidget({ onFileUpload }: UploadWidgetProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const validateFile = (file: File): boolean => {
    if (!file.name.endsWith(".zip")) {
      setError("Please upload a ZIP file");
      return false;
    }
    setError(null);
    return true;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      onFileUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onFileUpload(file);
    }
  };

  const handleClick = (): void => {
    document.getElementById("file-upload")?.click();
  };

  return (
    <>
      <Card
        onClick={handleClick}
        className={`w-full cursor-pointer hover:bg-foreground/1 ${isDragging ? "border-primary" : ""}`}
      >
        <CardContent className="pt-6">
          <div
            className={`w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 transition-colors
            ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mb-4 rounded-full">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upload Your Twitch Data</h2>
            <p className="text-muted-foreground text-center mb-4">Click or drag & drop your Twitch data ZIP file</p>
            <input type="file" id="file-upload" className="hidden" accept=".zip" onChange={handleFileChange} />
          </div>
        </CardContent>
      </Card>
      {error && <p className="text-destructive mt-4 text-center">{error}</p>}
    </>
  );
}
