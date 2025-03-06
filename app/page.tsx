"use client";

import UploadWidget from "@/components/UploadWidget";

export default function Home() {
  const handleFileUpload = async (file: File) => {
    if (!file) console.log("No file");
    console.log("Hello");
  };
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col row-start-2 items-center">
        <UploadWidget onFileUpload={handleFileUpload} />
      </main>
    </div>
  );
}
