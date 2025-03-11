"use client";

import JSZip from "jszip";
interface FileInfo {
  path: string;
  type: string;
  headers?: string[];
  data?: Record<string, string>[];
  channelStats?: Record<string, number>;
  minutesWatchedStats?: Record<string, number>;
  wordFrequency?: Record<string, number>;
  streamerMessages?: Record<string, Array<{ body: string; timestamp: string }>>;
  error?: string;
}

interface WorkerMessageData {
  file: ArrayBuffer;
}

interface WorkerResponseData {
  files?: FileInfo[];
  chatChannelFrequency?: Record<string, number>;
  minutesWatchedFrequency?: Record<string, number>;
  wordFrequency?: Record<string, number>;
  streamerMessages?: Record<string, Array<{ body: string; timestamp: string }>>;
  error?: string;
}

self.onmessage = async function (e: MessageEvent<WorkerMessageData>): Promise<void> {
  try {
    const zipData = e.data.file;
    const files = await processZip(zipData);
    const chatMessagesFile = files.find((f) => f.path.includes("request/site_history/chat_messages.csv"));
    const minutesWatchedFile = files.find((f) => f.path.includes("request/site_history/minute_watched.csv"));

    const chatChannelFrequency = chatMessagesFile?.channelStats || {};
    const minutesWatchedFrequency = minutesWatchedFile?.minutesWatchedStats || {};
    const wordFrequency = chatMessagesFile?.wordFrequency || {};
    const streamerMessages = chatMessagesFile?.streamerMessages || {};

    self.postMessage({
      files,
      chatChannelFrequency,
      minutesWatchedFrequency,
      wordFrequency,
      streamerMessages,
    } as WorkerResponseData);
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
      if (path.includes("request/site_history/chat_messages.csv")) {
        await processChatMessagesFile(zipEntry, fileInfo);
      } else if (path.includes("request/site_history/minute_watched.csv")) {
        await processMinutesWatchedFile(zipEntry, fileInfo);
      } else {
        await processRegularCsvFile(zipEntry, fileInfo);
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

async function processChatMessagesFile(zipEntry: JSZip.JSZipObject, fileInfo: FileInfo): Promise<void> {
  console.time("processChatMessages");
  const content = await zipEntry.async("string");

  const CHUNK_SIZE = 10000;
  const lines = content.split("\n").filter((line) => line.trim() !== "");

  if (lines.length === 0) return;

  const headers = parseCSVLine(lines[0]);
  fileInfo.headers = headers;

  const channelIndex = headers.findIndex((h) => h.toLowerCase() === "channel");
  const channelColIndex = channelIndex !== -1 ? channelIndex : 10;

  // Find the body column index
  const bodyIndex = headers.findIndex((h) => h.toLowerCase() === "body");
  const bodyColIndex = bodyIndex !== -1 ? bodyIndex : -1;

  // Find the timestamp column index
  const timestampIndex = headers.findIndex((h) => h.toLowerCase() === "timestamp");
  const timestampColIndex = timestampIndex !== -1 ? timestampIndex : 0;

  // Find the server_timestamp column index
  const serverTimestampIndex = headers.findIndex((h) => h.toLowerCase() === "server_timestamp");
  const serverTimestampColIndex = serverTimestampIndex !== -1 ? serverTimestampIndex : timestampColIndex;

  // Track channels and their counts
  const channelCounts: Record<string, number> = {};

  // Track word frequencies
  const wordCounts: Record<string, number> = {};

  // Track chat messages per streamer (collect all messages first, then sort and limit)
  const allStreamerMessages: Record<string, Array<{ body: string; timestamp: string; serverTimestamp: string }>> = {};

  // Process the file in chunks
  for (let i = 0; i < Math.ceil(lines.length / CHUNK_SIZE); i++) {
    const start = i * CHUNK_SIZE + 1;
    const end = Math.min((i + 1) * CHUNK_SIZE + 1, lines.length);

    for (let j = start; j < end; j++) {
      try {
        const values = parseCSVLine(lines[j]);
        if (values.length <= channelColIndex) continue;

        const channel = values[channelColIndex] || "unknown";
        channelCounts[channel] = (channelCounts[channel] || 0) + 1;

        // Process body text for word frequency if the column exists
        if (bodyColIndex !== -1 && values.length > bodyColIndex) {
          const bodyText = values[bodyColIndex] || "";
          processTextForWordFrequency(bodyText, wordCounts);

          // Initialize array for this streamer if it doesn't exist
          if (!allStreamerMessages[channel]) {
            allStreamerMessages[channel] = [];
          }

          const timestamp =
            timestampColIndex !== -1 && values.length > timestampColIndex ? values[timestampColIndex] || "" : "";

          const serverTimestamp =
            serverTimestampColIndex !== -1 && values.length > serverTimestampColIndex
              ? values[serverTimestampColIndex] || ""
              : timestamp;

          // Collect all messages for sorting later
          allStreamerMessages[channel].push({
            body: bodyText,
            timestamp: timestamp,
            serverTimestamp: serverTimestamp,
          });
        }
      } catch (e) {
        console.error(`Error processing line ${j}:`, e);
      }
    }

    // Allow other tasks to run between chunks
    if (i < Math.ceil(lines.length / CHUNK_SIZE) - 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // Sort and limit messages for each streamer
  const streamerMessages: Record<string, Array<{ body: string; timestamp: string }>> = {};

  for (const channel in allStreamerMessages) {
    // Sort messages by server_timestamp in ascending order (earliest to latest)
    allStreamerMessages[channel].sort((a, b) => {
      return a.serverTimestamp.localeCompare(b.serverTimestamp);
    });

    // Take the first 100 messages after sorting
    streamerMessages[channel] = allStreamerMessages[channel]
      .slice(0, 100)
      .map(({ body, timestamp }) => ({ body, timestamp }));
  }

  // Store the channel counts in the file info
  fileInfo.channelStats = channelCounts;

  // Store the word frequency in the file info
  fileInfo.wordFrequency = wordCounts;

  // Store the sorted streamer messages in the file info
  fileInfo.streamerMessages = streamerMessages;

  console.timeEnd("processChatMessages");
}

function processTextForWordFrequency(text: string, wordCounts: Record<string, number>): void {
  if (!text) return;

  const cleanText = text.toLowerCase().trim();

  const words = cleanText
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter((word) => word.length > 0);

  for (const word of words) {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  }
}

async function processMinutesWatchedFile(zipEntry: JSZip.JSZipObject, fileInfo: FileInfo): Promise<void> {
  console.time("processMinutesWatched");
  const content = await zipEntry.async("string");

  const CHUNK_SIZE = 10000;
  const lines = content.split("\n").filter((line) => line.trim() !== "");

  if (lines.length === 0) return;

  const headers = parseCSVLine(lines[0]);
  fileInfo.headers = headers;

  const channelNameIndex = headers.findIndex((h) => h.toLowerCase() === "channel_name");
  const channelNameColIndex = channelNameIndex !== -1 ? channelNameIndex : -1;

  const minutesWatchedIndex = headers.findIndex((h) => h.toLowerCase() === "minutes_watched_unadjusted");
  const minutesWatchedColIndex = minutesWatchedIndex !== -1 ? minutesWatchedIndex : -1;

  if (channelNameColIndex === -1 || minutesWatchedColIndex === -1) {
    console.error("Could not find required columns in minute_watched.csv");
    fileInfo.error = "Missing required columns: channel_name and/or minutes_watched_unadjusted";
    return;
  }

  const minutesWatchedCounts: Record<string, number> = {};

  for (let i = 0; i < Math.ceil(lines.length / CHUNK_SIZE); i++) {
    const start = i * CHUNK_SIZE + 1;
    const end = Math.min((i + 1) * CHUNK_SIZE + 1, lines.length);

    for (let j = start; j < end; j++) {
      try {
        const values = parseCSVLine(lines[j]);
        if (values.length <= Math.max(channelNameColIndex, minutesWatchedColIndex)) continue;

        const channelName = values[channelNameColIndex] || "unknown";
        const minutesWatchedStr = values[minutesWatchedColIndex] || "0";

        let minutesWatched = 0;
        try {
          minutesWatched = parseFloat(minutesWatchedStr);
          if (isNaN(minutesWatched)) minutesWatched = 0;
        } catch (e) {
          minutesWatched = 0;
          console.error(e);
        }

        minutesWatchedCounts[channelName] = (minutesWatchedCounts[channelName] || 0) + minutesWatched;
      } catch (e) {
        console.error(`Error processing line ${j}:`, e);
      }
    }

    if (i < Math.ceil(lines.length / CHUNK_SIZE) - 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  fileInfo.minutesWatchedStats = minutesWatchedCounts;

  console.timeEnd("processMinutesWatched");
}

async function processRegularCsvFile(zipEntry: JSZip.JSZipObject, fileInfo: FileInfo): Promise<void> {
  const content = await zipEntry.async("string");
  const lines = content.split("\n").filter((line) => line.trim() !== "");

  if (lines.length > 0) {
    const headers = parseCSVLine(lines[0]);
    fileInfo.headers = headers;

    if (lines.length > 1) {
      const sampleData: Record<string, string>[] = [];
      const maxSampleRows = Math.min(3, lines.length - 1);

      for (let i = 1; i <= maxSampleRows; i++) {
        if (lines[i]) {
          const values = parseCSVLine(lines[i]);
          const rowObject: Record<string, string> = {};

          headers.forEach((header, index) => {
            const value = values[index] || "";
            if (/^-?\d+(\.\d+)?$/.test(value)) {
              rowObject[header] = parseFloat(value).toString();
            } else {
              rowObject[header] = value;
            }
          });

          sampleData.push(rowObject);
        }
      }

      fileInfo.data = sampleData;
    }
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (i < line.length - 1 && line[i + 1] === '"' && inQuotes) {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
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
