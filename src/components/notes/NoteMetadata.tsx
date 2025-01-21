import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-4 mb-6 bg-muted p-3 md:p-4 rounded-lg text-sm md:text-base">
      <h3 className="font-semibold text-base md:text-lg">
        {inputType === 'image' ? 'Image Analysis' : 'Note Analysis'}
      </h3>
      
      {sections.map((section, index) => {
        if (!section.content || 
            (Array.isArray(section.content) && section.content.length === 0) ||
            (!Array.isArray(section.content) && section.content.trim() === '')) {
          return null;
        }

        return (
          <div key={index}>
            <h4 className="font-medium text-xs md:text-sm text-muted-foreground">{section.title}</h4>
            {section.type === 'badges' ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {(section.content as string[]).map((item, badgeIndex) => (
                  <Badge key={badgeIndex} variant="secondary">{item}</Badge>
                ))}
              </div>
            ) : (
              <p className="mt-1">{section.content as string}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};