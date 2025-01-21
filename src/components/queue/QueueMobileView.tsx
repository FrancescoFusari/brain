import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { extractSenderName } from "@/utils/emailUtils";

interface QueueMobileViewProps {
  items: any[];
  onProcess: (id: string) => void;
  isProcessing: boolean;
  processingId?: string;
}

export const QueueMobileView = ({ items, onProcess, isProcessing, processingId }: QueueMobileViewProps) => {
  const navigate = useNavigate();

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "processing":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "completed":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "error":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card 
          key={item.id}
          className="mb-4 hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => navigate(`/email/${item.id}`)}
        >
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium line-clamp-2">{item.subject}</h3>
                <Badge className={getStatusBadgeColor(item.status)}>
                  {item.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                From: {extractSenderName(item.sender)}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(item.received_at), "PPp")}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onProcess(item.id);
                }}
                disabled={
                  item.status === 'completed' || 
                  isProcessing && 
                  processingId === item.id
                }
                className="w-full"
              >
                {isProcessing && processingId === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Process Email
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};