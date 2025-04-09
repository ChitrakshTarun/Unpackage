import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDuration, toTitleCase } from "@/lib/utils";

interface OverviewStatsProps {
  gameStats: Record<string, number>;
  usernames: Array<{ username: string; firstSeen: string; lastSeen: string }>;
  platformStats: Record<string, number>;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString();
}

export default function OverviewStats({ gameStats, usernames, platformStats }: OverviewStatsProps) {
  // Sort games by watch time
  const sortedGames = Object.entries(gameStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Sort platforms by usage
  const sortedPlatforms = Object.entries(platformStats).sort(([, a], [, b]) => b - a);

  // Sort usernames by first seen date
  const sortedUsernames = [...usernames].sort((a, b) => a.firstSeen.localeCompare(b.firstSeen));

  return (
    <div className="grid gap-4 grid-cols-2">
      <Card className="row-span-2">
        <CardHeader>
          <CardTitle>Top Game Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game</TableHead>
                <TableHead className="text-right">Time Watched</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedGames.map(([game, minutes]) => (
                <TableRow key={game}>
                  <TableCell>{game ? toTitleCase(game) : "Unknown"}</TableCell>
                  <TableCell className="text-right">{formatDuration(minutes)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlatforms.map(([platform, count]) => (
                <TableRow key={platform}>
                  <TableCell>{platform || "Unknown"}</TableCell>
                  <TableCell className="text-right">{count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Previous Usernames</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>First Used</TableHead>
                <TableHead>Last Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsernames.map((user) => (
                <TableRow key={user.username}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{formatDate(user.firstSeen)}</TableCell>
                  <TableCell>{formatDate(user.lastSeen)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
