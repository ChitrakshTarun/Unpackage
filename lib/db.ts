const DB_NAME = "twitchData";
const VERSION = 1;

// Store names
const CHAT_MESSAGES_STORE = "chatMessages";
const STATS_STORE = "stats";

interface WorkerData {
  chatChannelFrequency?: Record<string, number>;
  minutesWatchedFrequency?: Record<string, number>;
  wordFrequency?: Record<string, number>;
  streamerMessages?: Record<string, Array<{ body: string; timestamp: string }>>;
  lastUpdated?: string;
}

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create chat messages store if it doesn't exist
      if (!db.objectStoreNames.contains(CHAT_MESSAGES_STORE)) {
        const store = db.createObjectStore(CHAT_MESSAGES_STORE, { keyPath: ["channel", "timestamp"] });
        store.createIndex("channel", "channel", { unique: false });
      }

      // Create stats store if it doesn't exist
      if (!db.objectStoreNames.contains(STATS_STORE)) {
        db.createObjectStore(STATS_STORE, { keyPath: "id" });
      }
    };
  });
}

export async function storeWorkerData(data: WorkerData): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction([CHAT_MESSAGES_STORE, STATS_STORE], "readwrite");
  const chatStore = transaction.objectStore(CHAT_MESSAGES_STORE);
  const statsStore = transaction.objectStore(STATS_STORE);

  // Clear existing data
  await Promise.all([
    new Promise<void>((resolve) => {
      const clearRequest = chatStore.clear();
      clearRequest.onsuccess = () => resolve();
    }),
    new Promise<void>((resolve) => {
      const clearRequest = statsStore.clear();
      clearRequest.onsuccess = () => resolve();
    }),
  ]);

  // Store chat messages
  if (data.streamerMessages) {
    for (const [channel, messages] of Object.entries(data.streamerMessages)) {
      for (const message of messages) {
        chatStore.put({ ...message, channel });
      }
    }
  }

  // Store stats
  const statsData = {
    id: "current",
    chatChannelFrequency: data.chatChannelFrequency,
    minutesWatchedFrequency: data.minutesWatchedFrequency,
    wordFrequency: data.wordFrequency,
    lastUpdated: new Date().toISOString(),
  };
  statsStore.put(statsData);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getWorkerData(): Promise<WorkerData | null> {
  const db = await initDB();
  const transaction = db.transaction([CHAT_MESSAGES_STORE, STATS_STORE], "readonly");
  const chatStore = transaction.objectStore(CHAT_MESSAGES_STORE);
  const statsStore = transaction.objectStore(STATS_STORE);

  return new Promise((resolve, reject) => {
    const statsRequest = statsStore.get("current");
    statsRequest.onsuccess = () => {
      const stats = statsRequest.result;
      if (!stats) {
        resolve(null);
        return;
      }

      const messagesRequest = chatStore.index("channel").openCursor();
      const streamerMessages: Record<string, Array<{ body: string; timestamp: string }>> = {};

      messagesRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const { channel, body, timestamp } = cursor.value;
          if (!streamerMessages[channel]) {
            streamerMessages[channel] = [];
          }
          streamerMessages[channel].push({ body, timestamp });
          cursor.continue();
        } else {
          resolve({
            chatChannelFrequency: stats.chatChannelFrequency,
            minutesWatchedFrequency: stats.minutesWatchedFrequency,
            wordFrequency: stats.wordFrequency,
            streamerMessages,
            lastUpdated: stats.lastUpdated,
          });
        }
      };

      messagesRequest.onerror = () => reject(messagesRequest.error);
    };

    statsRequest.onerror = () => reject(statsRequest.error);
  });
}

export async function getMessages(
  channel: string,
  limit: number = 100,
  offset: number = 0
): Promise<Array<{ body: string; timestamp: string }>> {
  console.log("[getMessages] Starting with params:", { channel, limit, offset });

  const db = await initDB();
  console.log("[getMessages] DB initialized");

  const transaction = db.transaction(CHAT_MESSAGES_STORE, "readonly");
  const store = transaction.objectStore(CHAT_MESSAGES_STORE);
  const index = store.index("channel");
  console.log("[getMessages] Got store and index");

  return new Promise((resolve, reject) => {
    const request = index.openCursor(IDBKeyRange.only(channel));
    const messages: Array<{ body: string; timestamp: string }> = [];
    let count = 0;
    console.log("[getMessages] Request:", request);

    request.onsuccess = (event) => {
      //   console.log("[getMessages] Event:", event);
      const cursor = (event.target as IDBRequest).result;
      //   console.log("[getMessages] Cursor:", cursor);

      if (!cursor) {
        console.log("[getMessages] No more records");
        resolve(messages);
        return;
      }

      // Skip messages until we reach the offset
      if (count < offset) {
        console.log("[getMessages] Skipping message until offset", offset);
        count++;
        cursor.continue();
        return;
      }

      // If we've reached our limit, resolve with what we have
      if (messages.length >= limit) {
        console.log("[getMessages] Reached limit");
        resolve(messages);
        return;
      }

      // Add the current message
      const { body, timestamp } = cursor.value;
      messages.push({ body, timestamp });
      console.log("[getMessages] Added message:", { count, body: body.substring(0, 50) + "..." });

      // Move to next record
      count++;
      cursor.continue();
    };

    request.onerror = (error) => {
      console.error("[getMessages] Error:", error);
      reject(request.error);
    };
  });
}

export async function getMessageCount(channel: string): Promise<number> {
  const db = await initDB();
  const transaction = db.transaction(CHAT_MESSAGES_STORE, "readonly");
  const store = transaction.objectStore(CHAT_MESSAGES_STORE);
  const index = store.index("channel");

  return new Promise((resolve, reject) => {
    const request = index.count(IDBKeyRange.only(channel));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
