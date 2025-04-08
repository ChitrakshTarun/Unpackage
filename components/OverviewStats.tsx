import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDuration } from "@/lib/utils";

interface OverviewStatsProps {
  gameStats: Record<string, number>;
  usernames: string[];
  platformStats: Record<string, number>;
}

export default function OverviewStats({ gameStats, usernames, platformStats }: OverviewStatsProps) {
  // Sort games by watch time
  const sortedGames = Object.entries(gameStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Sort platforms by usage
  const sortedPlatforms = Object.entries(platformStats).sort(([, a], [, b]) => b - a);

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
                  <TableCell>{game || "Unknown"}</TableCell>
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
          <CardTitle>Usernames</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {usernames.map((username) => (
              <div key={username} className="text-sm">
                {username || "Unknown"}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
