import { FileIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CurrentFileIndicatorProps {
  currentFile: string | null;
}

function CurrentFileIndicator({ currentFile }: CurrentFileIndicatorProps) {
  return (
    <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 flex items-center gap-2 border-b px-4 py-2">
      <FileIcon className="h-4 w-4 text-muted-foreground" />
      <Badge variant="secondary" className="font-mono text-xs">
        {currentFile || 'No file selected'}
      </Badge>
    </div>
  );
}