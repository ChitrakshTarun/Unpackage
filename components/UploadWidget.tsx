"use client";

import { Upload, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useCallback, JSX } from "react";

interface FileInfo {
  path: string;
  type: string;
  headers?: string[];
  error?: string;
}

interface WorkerData {
  files?: FileInfo[];
  error?: string;
}

export default function FileProcessor(): JSX.Element {
  const [files, setFiles] = useState<FileInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileProcessed = (result: FileInfo[]): void => {
    setFiles(result);
    setIsLoading(false);
  };

  const handleFileUpload = (file: File): void => {
    setIsLoading(true);
    setFiles(null);
    setError(null);

    let worker: Worker | null = null;

    try {
      worker = new Worker(new URL("../workers/twitch/zipWorker.ts", import.meta.url));

      worker.onmessage = (e: MessageEvent<WorkerData>): void => {
        if (e.data.error) {
          setError(e.data.error);
          setIsLoading(false);
        } else if (e.data.files) {
          handleFileProcessed(e.data.files);
        }
        worker?.terminate();
      };

      worker.onerror = (e: ErrorEvent): void => {
        setError(`Worker error: ${e.message}`);
        setIsLoading(false);
        worker?.terminate();
      };

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>): void => {
        if (e.target?.result && worker) {
          worker.postMessage({
            file: e.target.result,
          });
        }
      };
      reader.onerror = (): void => {
        setError("Error reading file");
        setIsLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Failed to initialize worker: ${errorMessage}`);
      setIsLoading(false);
      worker?.terminate();
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <UploadWidget onFileUpload={handleFileUpload} />

      {isLoading && (
        <div className="flex justify-center items-center mt-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p className="text-xl">Processing your file...</p>
        </div>
      )}

      {error && (
        <div className="mt-8 p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      )}

      {files && <ResultsDisplay files={files} />}
    </div>
  );
}

interface UploadWidgetProps {
  onFileUpload: (file: File) => void;
}

function UploadWidget({ onFileUpload }: UploadWidgetProps): JSX.Element {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
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
    (e: React.DragEvent<HTMLDivElement>): void => {
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
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        setFileName(file.name);
        onFileUpload(file);
      }
    },
    [onFileUpload]
  );

  const handleClick = (): void => {
    document.getElementById("file-upload")?.click();
  };

  return (
    <>
      <Card
        onClick={handleClick}
        className={`w-full cursor-pointer p-12 hover:bg-foreground/1 ${isDragging ? "border-primary" : ""}`}
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
}

// Results Display Component
interface ResultsDisplayProps {
  files: FileInfo[];
}

interface GroupedFiles {
  [folder: string]: FileInfo[];
}

function ResultsDisplay({ files }: ResultsDisplayProps): JSX.Element {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  // Group files by folder
  const groupedFiles: GroupedFiles = files.reduce((acc: GroupedFiles, file) => {
    const parts = file.path.split("/");
    const folder = parts.slice(0, -1).join("/");

    if (!acc[folder]) {
      acc[folder] = [];
    }

    acc[folder].push(file);
    return acc;
  }, {});

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Files Found ({files.length})</h2>

      <div className="space-y-4">
        {Object.entries(groupedFiles).map(([folder, folderFiles]) => (
          <div key={folder} className="border rounded-md overflow-hidden">
            <div className="bg-secondary p-3 font-medium">{folder || "Root"}</div>
            <div className="divide-y">
              {folderFiles.map((file) => (
                <div key={file.path} className="p-4 hover:bg-muted/50">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setExpandedFile(expandedFile === file.path ? null : file.path)}
                  >
                    <p className="font-medium">{file.path.split("/").pop()}</p>
                    <button className="text-primary text-sm">
                      {expandedFile === file.path ? "Hide Details" : "Show Details"}
                    </button>
                  </div>

                  <div className="mt-4">
                    {file.type === "csv" && file.headers && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-2">CSV Headers:</p>
                        <div className="bg-muted p-3 rounded-md overflow-x-auto">
                          <code className="text-sm whitespace-nowrap">{file.headers.join(", ")}</code>
                        </div>
                      </div>
                    )}

                    {file.type === "json" && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-2">JSON File</p>
                      </div>
                    )}

                    {file.type !== "csv" && file.type !== "json" && (
                      <p className="text-sm text-muted-foreground">File type: {file.type || "unknown"}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
