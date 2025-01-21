import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { extractSenderName } from "@/utils/emailUtils";

interface QueueTableProps {
  items: any[];
  onProcess: (id: string) => void;
  isProcessing: boolean;
  processingId?: string;
}

export const QueueTable = ({ items, onProcess, isProcessing, processingId }: QueueTableProps) => {
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
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>From</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Received At</TableHead>
            <TableHead>Processed At</TableHead>
            <TableHead>Error</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow 
              key={item.id}
              className="hover:bg-muted/50"
            >
              <TableCell 
                className="font-medium cursor-pointer" 
                onClick={() => navigate(`/email/${item.id}`)}
              >
                {item.subject}
              </TableCell>
              <TableCell>{extractSenderName(item.sender)}</TableCell>
              <TableCell>
                <Badge className={getStatusBadgeColor(item.status)}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(item.received_at), "PPp")}
              </TableCell>
              <TableCell>
                {item.processed_at
                  ? format(new Date(item.processed_at), "PPp")
                  : "-"}
              </TableCell>
              <TableCell className="max-w-[300px] truncate">
                {item.error_message || "-"}
              </TableCell>
              <TableCell>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onProcess(item.id)}
                  disabled={
                    item.status === 'completed' || 
                    isProcessing && 
                    processingId === item.id
                  }
                >
                  {isProcessing && processingId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Process
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};