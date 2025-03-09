import JSZip from "jszip";

interface FileInfo {
  path: string;
  type: string;
  headers?: string[];
  error?: string;
}

interface WorkerMessageData {
  file: ArrayBuffer;
}

interface WorkerResponseData {
  files?: FileInfo[];
  error?: string;
}

self.onmessage = async function (e: MessageEvent<WorkerMessageData>): Promise<void> {
  try {
    const zipData = e.data.file;
    const files = await processZip(zipData);
    self.postMessage({ files } as WorkerResponseData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    self.postMessage({ error: errorMessage } as WorkerResponseData);
  }
};

async function processZip(zipData: ArrayBuffer): Promise<FileInfo[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipData);
  const filePromises: Promise<FileInfo | null>[] = [];

  loadedZip.forEach((relativePath: string, zipEntry: JSZip.JSZipObject) => {
    if (!zipEntry.dir) {
      filePromises.push(processZipEntry(zipEntry, relativePath));
    }
  });

  const processedFiles = await Promise.all(filePromises);
  return processedFiles.filter((file): file is FileInfo => file !== null);
}

async function processZipEntry(zipEntry: JSZip.JSZipObject, path: string): Promise<FileInfo | null> {
  if (zipEntry.dir) return null;

  const extension = path.split(".").pop()?.toLowerCase() || "";

  const fileInfo: FileInfo = {
    path: path,
    type: extension,
  };

  try {
    if (extension === "csv") {
      const content = await zipEntry.async("string");
      const lines = content.split("\n");
      if (lines.length > 0) {
        const headers = parseCSVLine(lines[0]);
        fileInfo.headers = headers;
      }
    } else if (extension === "json") {
      fileInfo.type = "json";
    } else {
      fileInfo.type = extension || "unknown";
    }

    return fileInfo;
  } catch (error) {
    console.error(`Error processing ${path}:`, error);
    fileInfo.error = error instanceof Error ? error.message : String(error);
    return fileInfo;
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(currentField.trim());
      currentField = "";
    } else {
      currentField += char;
    }
  }

  if (currentField) {
    result.push(currentField.trim());
  }

  return result;
}

export {};
