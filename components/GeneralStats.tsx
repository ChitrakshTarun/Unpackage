"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";

interface GeneralStatsProps {
  chatChannelFrequency?: Record<string, number>;
  minutesWatchedFrequency?: Record<string, number>;
  wordFrequency?: Record<string, number>;
}

export default function GeneralStats({
  chatChannelFrequency = {},
  minutesWatchedFrequency = {},
  wordFrequency = {},
}: GeneralStatsProps) {
  // Calculate total watch time in minutes
  const totalWatchTime = Object.values(minutesWatchedFrequency).reduce((sum, minutes) => sum + minutes, 0);

  // Find most active chat channel
  const mostActiveChannel = Object.entries(chatChannelFrequency).reduce((a, b) => (a[1] > b[1] ? a : b), ["", 0]);

  // Calculate total messages
  const totalMessages = Object.values(chatChannelFrequency).reduce((sum, count) => sum + count, 0);

  // Find most used word
  const mostUsedWord = Object.entries(wordFrequency).reduce((a, b) => (a[1] > b[1] ? a : b), ["", 0]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Watch Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatDuration(totalWatchTime)}</div>
          <p className="text-xs text-muted-foreground">Across all channels</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Active Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mostActiveChannel[0] || "N/A"}</div>
          <p className="text-xs text-muted-foreground">{mostActiveChannel[1].toLocaleString()} messages</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMessages.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Across all channels</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Used Word</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mostUsedWord[0] || "N/A"}</div>
          <p className="text-xs text-muted-foreground">Used {mostUsedWord[1].toLocaleString()} times</p>
        </CardContent>
      </Card>
    </div>
  );
}
