export interface FileInfo {
  path: string;
  type: string;
  headers?: string[];
  data?: Record<string, string>[];
  channelStats?: Record<string, number>;
  minutesWatchedStats?: Record<string, number>;
  wordFrequency?: Record<string, number>;
  streamerMessages?: Record<string, Array<{ body: string; timestamp: string }>>;
  gameStats?: Record<string, number>;
  usernames?: Array<{ username: string; firstSeen: string; lastSeen: string }>;
  platformStats?: Record<string, number>;
  error?: string;
}

export interface WorkerMessageData {
  file: ArrayBuffer;
}

export interface WorkerData {
  files?: FileInfo[];
  chatChannelFrequency?: Record<string, number>;
  minutesWatchedFrequency?: Record<string, number>;
  wordFrequency?: Record<string, number>;
  streamerMessages?: Record<string, Array<{ body: string; timestamp: string }>>;
  gameStats?: Record<string, number>;
  usernames?: Array<{ username: string; firstSeen: string; lastSeen: string }>;
  platformStats?: Record<string, number>;
  lastUpdated?: string;
  error?: string;
}
