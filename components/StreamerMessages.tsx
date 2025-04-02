"use client";

import React from "react";
import { useMemo, useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface StreamerMessagesProps {
  messages: Record<string, Array<{ body: string; timestamp: string }>> | undefined;
  chatChannelFrequency?: Record<string, number>;
}

const StreamerSelector = ({
  streamers,
  selectedStreamer,
  setSelectedStreamer,
  messageCount,
}: {
  streamers: string[];
  selectedStreamer: string;
  setSelectedStreamer: (streamer: string) => void;
  messageCount: Record<string, number>;
}) => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const sortedStreamers = streamers.sort((a, b) => messageCount[b] - messageCount[a]);

  const scrollToTop = () => {
    if (popoverRef.current) {
      popoverRef.current.scrollTop = 0;
    }
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[200px] justify-between">
          {selectedStreamer || "Select streamer..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput onValueChange={scrollToTop} placeholder="Search streamer..." />
          <CommandList ref={popoverRef}>
            <CommandEmpty>No streamer found.</CommandEmpty>
            <CommandGroup>
              {sortedStreamers.map((streamer) => (
                <CommandItem
                  key={streamer}
                  value={streamer}
                  onSelect={(currentValue) => {
                    setSelectedStreamer(currentValue === selectedStreamer ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selectedStreamer === streamer ? "opacity-100" : "opacity-0")} />
                  {streamer} ({messageCount[streamer]})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

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

export default function StreamerMessages({ messages, chatChannelFrequency }: StreamerMessagesProps) {
  const [selectedStreamer, setSelectedStreamer] = useState<string>("");

  // memoize sorting streamers and counting messages
  const streamersData = useMemo(() => {
    if (!messages || Object.keys(messages).length === 0) {
      return { streamers: [], messageCount: {} };
    }

    const streamers = Object.keys(messages).sort();
    const messageCount = streamers.reduce((acc, streamer) => {
      acc[streamer] = chatChannelFrequency?.[streamer] || 0;
      return acc;
    }, {} as Record<string, number>);

    return { streamers, messageCount };
  }, [messages, chatChannelFrequency]);

  // Set streamer 1 as default streamer on first render
  useEffect(() => {
    if (!selectedStreamer && streamersData.streamers.length > 0) {
      setSelectedStreamer(streamersData.streamers[0]);
    }
  }, [selectedStreamer, streamersData.streamers]);

  if (!messages || Object.keys(messages).length === 0) {
    return <p>No chat messages available</p>;
  }

  const streamerMessages = selectedStreamer ? messages[selectedStreamer] : [];
  const totalMessages = chatChannelFrequency?.[selectedStreamer] || 0;
  const displayedMessages = streamerMessages;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Chat Messages</h2>
        <StreamerSelector
          streamers={streamersData.streamers}
          selectedStreamer={selectedStreamer}
          setSelectedStreamer={setSelectedStreamer}
          messageCount={streamersData.messageCount}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {totalMessages > 100 ? (
              <>
                First 100 of {totalMessages.toLocaleString()} messages for {selectedStreamer}
              </>
            ) : (
              <>
                All {totalMessages.toLocaleString()} messages for {selectedStreamer}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {displayedMessages.length > 0 ? (
              displayedMessages.map((msg, index) => (
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
