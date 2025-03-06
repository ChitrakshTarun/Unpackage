"use client";

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import UploadWidget from "@/components/UploadWidget";

enum UnpackageState {
  Idle,
  Processing,
  Completed,
}

export default function Home() {
  const [status, setStatus] = useState<UnpackageState>(UnpackageState.Idle);
  const [progress, setProgress] = useState<number>(0);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setStatus(UnpackageState.Processing);
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          setStatus(UnpackageState.Completed);
          return 100;
        }
        return prevProgress + 10;
      });
    }, 300);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col row-start-2 items-center">
        {/* IDLE */}
        {status == UnpackageState.Idle && (
          <>
            <UploadWidget onFileUpload={handleFileUpload} />
          </>
        )}
        {/* PROCESSING */}
        {status == UnpackageState.Processing && (
          <div className="flex flex-col items-center w-100 gap-8">
            <h1 className="text-2xl">Processing</h1>
            <Progress value={progress} />
          </div>
        )}
        {/* PROCESSED */}
        {status == UnpackageState.Completed && (
          <div className="flex flex-col items-center w-100 gap-8">
            <h1 className="text-2xl">Completed nice</h1>
            <h1 className="text-2xl">{`Data: {peepo: true}`}</h1>
            <Progress value={progress} />
          </div>
        )}
      </main>
    </div>
  );
}
