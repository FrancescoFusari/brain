import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import { NetworkGraphSettings } from './NetworkGraphSettings';
import { NotePopupWindow } from './NotePopupWindow';
import { NetworkGraphSimulation } from './NetworkGraphSimulation';
import { processNetworkData, NetworkNode } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';

interface NetworkGraphProps {
  notes: Note[];
}

export const NetworkGraph = ({ notes }: NetworkGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const dimensions = useGraphDimensions(containerRef, isMobile);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const { nodes, links, tagUsageCount, colorScale } = processNetworkData(notes);

  const handleNodeClick = (node: NetworkNode) => {
    if (node.type === 'note' && node.originalNote) {
      if (isMobile) {
        setSelectedNote(node.originalNote);
      } else {
        navigate(`/note/${node.originalNote.id}`);
      }
    } else if (node.type === 'tag') {
      const usageCount = tagUsageCount.get(node.name) || 0;
      toast({
        title: `Tag: ${node.name}`,
        description: `Used ${usageCount} time${usageCount === 1 ? '' : 's'}`,
      });
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-[600px] border rounded-lg overflow-hidden relative"
    >
      <NetworkGraphSettings />
      <NetworkGraphSimulation
        width={dimensions.width}
        height={dimensions.height}
        nodes={nodes}
        links={links}
        tagUsageCount={tagUsageCount}
        colorScale={colorScale}
        onNodeClick={handleNodeClick}
      />
      {selectedNote && (
        <NotePopupWindow
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
        />
      )}
    </div>
  );
};