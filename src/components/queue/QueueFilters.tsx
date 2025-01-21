import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SenderStat {
  sender: string;
  count: number;
}

interface QueueFiltersProps {
  senderStats: SenderStat[];
  selectedSender: string | null;
  setSelectedSender: (sender: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const QueueFilters = ({
  senderStats,
  selectedSender,
  setSelectedSender,
  searchQuery,
  setSearchQuery,
}: QueueFiltersProps) => {
  return (
    <div className="space-y-4">
      {/* Sender Statistics */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Senders</h2>
        <div className="flex flex-wrap gap-2">
          {senderStats.slice(0, 5).map(({ sender, count }) => (
            <Badge 
              key={sender} 
              variant={selectedSender === sender ? "default" : "secondary"}
              className="text-sm py-1 cursor-pointer"
              onClick={() => setSelectedSender(sender)}
            >
              {sender} ({count})
            </Badge>
          ))}
          {senderStats.length > 5 && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 px-2 text-sm"
                >
                  +{senderStats.length - 5} more
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="flex flex-wrap gap-2">
                  {senderStats.slice(5).map(({ sender, count }) => (
                    <Badge 
                      key={sender} 
                      variant={selectedSender === sender ? "default" : "secondary"}
                      className="text-sm py-1 cursor-pointer"
                      onClick={() => setSelectedSender(sender)}
                    >
                      {sender} ({count})
                    </Badge>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>

      {/* Active Filter Display */}
      {selectedSender && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtering by sender:</span>
          <Badge 
            variant="outline" 
            className="flex items-center gap-1"
          >
            {selectedSender}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => setSelectedSender(null)}
            />
          </Badge>
        </div>
      )}

      {/* Search Bar */}
      <div>
        <Input
          type="text"
          placeholder="Search by sender, subject, or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>
    </div>
  );
};