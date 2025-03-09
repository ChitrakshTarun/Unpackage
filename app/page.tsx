"use client";

import FileProcessor from "@/components/UploadWidget";

export default function Home() {
  return (
    <div className="flex items-center w-screen justify-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="w-8/12 row-start-1 items-center">
        <FileProcessor />
      </main>
    </div>
  );
}
