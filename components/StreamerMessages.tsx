"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StreamerMessagesProps {
  messages: Record<string, Array<{ body: string; timestamp: string }>> | undefined;
}

export default function StreamerMessages({ messages }: StreamerMessagesProps) {
  const [selectedStreamer, setSelectedStreamer] = useState<string>("");

  if (!messages || Object.keys(messages).length === 0) {
    return <p>No chat messages available</p>;
  }

  // Sort streamers alphabetically
  const streamers = Object.keys(messages).sort();

  // Set default streamer if none selected
  if (!selectedStreamer && streamers.length > 0) {
    setSelectedStreamer(streamers[0]);
  }

  const streamerMessages = selectedStreamer ? messages[selectedStreamer] : [];

  // Format timestamp to a more readable format
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      console.error(e);
      return timestamp;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Chat Messages</h2>
        <Select value={selectedStreamer} onValueChange={setSelectedStreamer}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a streamer" />
          </SelectTrigger>
          <SelectContent>
            {streamers.map((streamer) => (
              <SelectItem key={streamer} value={streamer}>
                {streamer} ({messages[streamer].length})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>First 100 messages for {selectedStreamer}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {streamerMessages.length > 0 ? (
              streamerMessages.map((msg, index) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="text-sm text-muted-foreground mb-1">{formatTimestamp(msg.timestamp)}</div>
                  <div className="whitespace-pre-wrap break-words">{msg.body}</div>
                </div>
              ))
            ) : (
              <p className="text-center py-4">No messages available for this streamer</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
