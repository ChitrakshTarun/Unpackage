"use client";

import { useState, useEffect } from "react";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadWidget from "@/components/UploadWidget";
import DataTable from "@/components/DataTable";
import StreamerMessages from "@/components/StreamerMessages";
import GeneralStats from "@/components/GeneralStats";
import OverviewStats from "@/components/OverviewStats";
import { Button } from "@/components/ui/button";
import { getWorkerData, clearWorkerData } from "@/lib/db";
import { WorkerData } from "@/lib/types";

export default function TwitchDataViewer() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WorkerData | null>(null);
  const [showUpload, setShowUpload] = useState<boolean>(false);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedData = await getWorkerData();
        if (storedData) {
          setData(storedData);
        } else {
          setShowUpload(true);
        }
      } catch (error) {
        console.error("Error loading stored data:", error);
        setShowUpload(true);
      }
    };

    loadStoredData();
  }, []);

  const handleFileUpload = (file: File): void => {
    setIsLoading(true);
    setError(null);
    setShowUpload(false);

    let worker: Worker | null = null;

    try {
      worker = new Worker(new URL("../public/zipWorker.ts", import.meta.url));

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

  const handleClearData = async () => {
    try {
      await clearWorkerData();
      setData(null);
      setShowUpload(true);
    } catch (error) {
      console.error("Error clearing data:", error);
      setError("Failed to clear data");
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Twitch Data Viewer</h1>
        {data && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowUpload(true)} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload New Data
            </Button>
            <Button variant="destructive" onClick={handleClearData} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Remove Data
            </Button>
          </div>
        )}
      </div>

      {showUpload && <UploadWidget onFileUpload={handleFileUpload} />}

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
        <>
          <GeneralStats
            chatChannelFrequency={data.chatChannelFrequency}
            minutesWatchedFrequency={data.minutesWatchedFrequency}
            wordFrequency={data.wordFrequency}
          />
          <Tabs defaultValue="overview" className="mt-8">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="chat">Chat Channels</TabsTrigger>
              <TabsTrigger value="messages">Chat Messages</TabsTrigger>
              <TabsTrigger value="watched">Minutes Watched</TabsTrigger>
              <TabsTrigger value="words">Word Frequency</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-4">
              <DataTable data={data.chatChannelFrequency} title="Chat Channel Frequency" />
            </TabsContent>

            <TabsContent value="overview" className="mt-4">
              <OverviewStats
                gameStats={data.gameStats || {}}
                usernames={data.usernames || []}
                platformStats={data.platformStats || {}}
              />
            </TabsContent>

            <TabsContent value="messages" className="mt-4">
              <StreamerMessages messages={data.streamerMessages} chatChannelFrequency={data.chatChannelFrequency} />
            </TabsContent>

            <TabsContent value="watched" className="mt-4">
              <DataTable data={data.minutesWatchedFrequency} title="Minutes Watched by Channel" />
            </TabsContent>

            <TabsContent value="words" className="mt-4">
              <DataTable data={data.wordFrequency} title="Word Frequency" isWordFrequency={true} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
