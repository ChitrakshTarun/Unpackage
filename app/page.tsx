"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadWidget from "@/components/UploadWidget";
import DataTable from "@/components/DataTable";

interface FileInfo {
  path: string;
  type: string;
  headers?: string[];
  error?: string;
}

interface WorkerData {
  files?: FileInfo[];
  chatChannelFrequency?: Record<string, number>;
  minutesWatchedFrequency?: Record<string, number>;
  wordFrequency?: Record<string, number>;
  error?: string;
}

export default function TwitchDataViewer() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WorkerData | null>(null);

  const handleFileUpload = (file: File): void => {
    setIsLoading(true);
    setError(null);
    setData(null);

    let worker: Worker | null = null;

    try {
      worker = new Worker(new URL("../public/workers/zipWorker.ts", import.meta.url));

      worker.onmessage = (e: MessageEvent<WorkerData>): void => {
        if (e.data.error) {
          setError(e.data.error);
        } else {
          setData(e.data);
        }
        setIsLoading(false);
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
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Twitch Data Viewer</h1>

      {!isLoading && !data && <UploadWidget onFileUpload={handleFileUpload} />}

      {isLoading && (
        <div className="flex flex-col justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-xl">Processing your file...</p>
        </div>
      )}

      {error && (
        <div className="mt-8 p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      )}

      {data && (
        <Tabs defaultValue="chat" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">Chat Channels</TabsTrigger>
            <TabsTrigger value="watched">Minutes Watched</TabsTrigger>
            <TabsTrigger value="words">Word Frequency</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-4">
            <DataTable data={data.chatChannelFrequency} title="Chat Channel Frequency" />
          </TabsContent>

          <TabsContent value="watched" className="mt-4">
            <DataTable data={data.minutesWatchedFrequency} title="Minutes Watched by Channel" />
          </TabsContent>

          <TabsContent value="words" className="mt-4">
            <DataTable data={data.wordFrequency} title="Word Frequency" isWordFrequency={true} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
