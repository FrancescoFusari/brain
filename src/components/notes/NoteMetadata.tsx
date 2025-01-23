import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BorderTrail } from "@/components/ui/border-trail";

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
    <div className="relative rounded-sm bg-muted/50 backdrop-blur-sm border border-border/5 w-full max-w-full overflow-hidden">
      <BorderTrail 
        className="bg-gradient-to-l from-primary/30 via-primary/50 to-primary/30"
        size={120}
        transition={{
          ease: 'linear',
          duration: 8,
          repeat: Infinity,
        }}
      />
      <div className="p-4 sm:p-6 md:p-8">
        <h3 className="text-lg md:text-xl font-semibold text-[#E0E0D7] mb-6">
          {inputType === 'image' ? 'Image Analysis' : 'Note Analysis'}
        </h3>
        
        <ScrollArea className="h-full max-h-[600px] pr-2 sm:pr-4">
          <div className="space-y-6">
            {sections.map((section, index) => {
              if (!section.content || 
                  (Array.isArray(section.content) && section.content.length === 0) ||
                  (!Array.isArray(section.content) && section.content.trim() === '')) {
                return null;
              }

              return (
                <div key={index} className="px-1 sm:px-2">
                  <h4 className="text-sm font-medium text-[#EF7234] mb-3">
                    {section.title}
                  </h4>
                  {section.type === 'badges' ? (
                    <div className="flex flex-wrap gap-2">
                      {(section.content as string[]).map((item, badgeIndex) => (
                        <Badge 
                          key={badgeIndex} 
                          variant="outline"
                          className="border border-border/20 rounded-lg text-[#E0E0D7] hover:bg-accent/10 transition-colors py-1.5"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#E0E0D7] leading-relaxed">
                      {section.content as string}
                    </p>
                  )}
                  {index < sections.length - 1 && (
                    <Separator className="my-6 opacity-20" />
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