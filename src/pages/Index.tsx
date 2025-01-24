import { memo, useCallback } from "react";
import { NoteInput } from "@/components/NoteInput";
import { supabase } from "@/integrations/supabase/client";
import { analyzeNote } from "@/lib/openai";
import { useIsMobile } from "@/hooks/use-mobile";
import { Waves } from "@/components/ui/waves-background";

const Index = memo(() => {
  const isMobile = useIsMobile();

  const handleNoteSubmit = useCallback(async (content: string) => {
    console.log('Submitting note:', { contentLength: content.length });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const analysis = await analyzeNote(content);
      console.log('Note analysis:', analysis);
      
      const { error } = await supabase
        .from('notes')
        .insert({
          content,
          category: analysis.category,
          tags: analysis.tags,
          user_id: session.user.id
        });

      if (error) {
        console.error('Error inserting note:', error);
        throw error;
      }
      
      console.log('Note saved successfully');
    } catch (error) {
      console.error('Error in note submission flow:', error);
      throw new Error('Failed to save note. Please try again.');
    }
  }, []);

  return (
    <>
      <Waves
        lineColor="rgba(239, 114, 52, 0.2)"
        backgroundColor="transparent"
        waveSpeedX={0.01} // Reduced for better mobile performance
        waveSpeedY={0.005} // Reduced for better mobile performance
        waveAmpX={isMobile ? 20 : 40} // Reduced amplitude on mobile
        waveAmpY={isMobile ? 10 : 20} // Reduced amplitude on mobile
        friction={0.95} // Increased for smoother animation
        tension={0.008} // Reduced for better performance
        maxCursorMove={isMobile ? 60 : 120} // Reduced on mobile
        xGap={isMobile ? 16 : 12} // Increased gap on mobile for fewer elements
        yGap={isMobile ? 48 : 36} // Increased gap on mobile for fewer elements
        className="fixed inset-0 pointer-events-none"
      />
      
      <div className="container mx-auto min-h-screen flex flex-col bg-transparent relative">      
        <div className="flex-1 flex flex-col items-center justify-center -mt-16 md:-mt-20 relative z-10">
          <div className="text-center space-y-2 mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-foreground">
              Entrance to the vault
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Drop anything, we'll add tags and categorize it
            </p>
          </div>
          
          <div className="w-full max-w-2xl mx-auto px-4 md:px-0">
            <NoteInput onNoteSubmit={handleNoteSubmit} />
          </div>
        </div>
      </div>
    </>
  );
});

Index.displayName = "Index";

export default Index;