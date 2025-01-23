import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface NoteMetadataProps {
  metadata: {
    technical_details?: string;
    visual_elements?: string[];
    color_palette?: string[];
    composition_notes?: string;
    estimated_date_or_period?: string;
    key_points?: string[];
    action_items?: string[];
    important_dates?: string[];
    references?: string[];
    topics?: string[];
  } | null;
  inputType: string;
}

export const NoteMetadata = ({ metadata, inputType }: NoteMetadataProps) => {
  if (!metadata) return null;

  const sections = [
    {
      title: 'Technical Details',
      content: metadata.technical_details,
      type: 'text'
    },
    {
      title: 'Visual Elements',
      content: metadata.visual_elements,
      type: 'badges'
    },
    {
      title: 'Color Palette',
      content: metadata.color_palette,
      type: 'badges'
    },
    {
      title: 'Composition Notes',
      content: metadata.composition_notes,
      type: 'text'
    },
    {
      title: 'Estimated Period',
      content: metadata.estimated_date_or_period,
      type: 'text'
    },
    {
      title: 'Key Points',
      content: metadata.key_points,
      type: 'badges'
    },
    {
      title: 'Action Items',
      content: metadata.action_items,
      type: 'badges'
    },
    {
      title: 'Important Dates',
      content: metadata.important_dates,
      type: 'badges'
    },
    {
      title: 'References',
      content: metadata.references,
      type: 'badges'
    },
    {
      title: 'Topics',
      content: metadata.topics,
      type: 'badges'
    }
  ];

  const hasContent = sections.some(section => 
    section.content && (
      (Array.isArray(section.content) && section.content.length > 0) ||
      (!Array.isArray(section.content) && section.content.trim() !== '')
    )
  );

  if (!hasContent) return null;

  return (
    <div className="rounded-lg bg-muted/50 backdrop-blur-sm border border-border/5">
      <div className="p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-foreground/90 mb-4">
          {inputType === 'image' ? 'Image Analysis' : 'Note Analysis'}
        </h3>
        
        <ScrollArea className="h-full max-h-[600px] pr-4">
          <div className="space-y-6">
            {sections.map((section, index) => {
              if (!section.content || 
                  (Array.isArray(section.content) && section.content.length === 0) ||
                  (!Array.isArray(section.content) && section.content.trim() === '')) {
                return null;
              }

              return (
                <div key={index}>
                  <h4 className="text-sm font-medium text-foreground/70 mb-2">
                    {section.title}
                  </h4>
                  {section.type === 'badges' ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(section.content as string[]).map((item, badgeIndex) => (
                        <Badge 
                          key={badgeIndex} 
                          variant="secondary"
                          className="bg-accent/50 hover:bg-accent/70 transition-colors"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {section.content as string}
                    </p>
                  )}
                  {index < sections.length - 1 && (
                    <Separator className="my-4 opacity-20" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};