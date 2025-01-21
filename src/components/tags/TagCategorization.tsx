import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTagCategories } from "@/hooks/useTagCategories";
import { useTags } from "@/hooks/useTags";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const TagCategorization = memo(() => {
  const { toast } = useToast();
  const { tagMap, sortedTags } = useTags();
  const { savedCategories, saveCategoriesMutation } = useTagCategories();
  const [isLoading, setIsLoading] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);

  const shouldShowCategorizeButton = () => {
    return sortedTags.length > 0 && (!savedCategories || Object.keys(savedCategories).length === 0);
  };

  const categorizeTags = async () => {
    setIsLoading(true);
    try {
      const allTags = Array.from(tagMap.keys());
      const { data, error } = await supabase.functions.invoke('categorize-tags', {
        body: { tags: allTags }
      });

      if (error) throw error;
      
      await saveCategoriesMutation.mutateAsync(data);
      
      toast({
        title: "Tags categorized",
        description: "Your tags have been organized and saved",
      });
    } catch (error) {
      console.error('Error categorizing tags:', error);
      toast({
        title: "Error",
        description: "Failed to categorize tags. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const categorizeCategories = async () => {
    if (!savedCategories) return;
    
    setIsCategorizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('categorize-categories', {
        body: { categories: savedCategories }
      });

      if (error) throw error;
      
      await saveCategoriesMutation.mutateAsync(data);
      
      toast({
        title: "Categories organized",
        description: "Your categories have been organized into life sections",
      });
    } catch (error) {
      console.error('Error categorizing categories:', error);
      toast({
        title: "Error",
        description: "Failed to organize categories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCategorizing(false);
    }
  };

  return (
    <div className="flex justify-between items-center gap-4 flex-wrap">
      {shouldShowCategorizeButton() && (
        <Button 
          onClick={categorizeTags} 
          disabled={isLoading}
          variant="outline"
          className="text-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Categorizing...
            </>
          ) : (
            "Categorize Tags"
          )}
        </Button>
      )}
      {savedCategories && (
        <Button
          onClick={categorizeCategories}
          disabled={isCategorizing}
          variant="outline"
          className="text-sm"
        >
          {isCategorizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Organizing...
            </>
          ) : (
            "Organize Categories"
          )}
        </Button>
      )}
    </div>
  );
});

TagCategorization.displayName = "TagCategorization";
