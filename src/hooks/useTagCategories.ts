import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

interface Categories {
  [key: string]: string[];
}

export const useTagCategories = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedCategories } = useQuery({
    queryKey: ['tag-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tag_categories')
        .select('categories')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.categories as Categories | null;
    }
  });

  const saveCategoriesMutation = useMutation({
    mutationFn: async (categories: Categories) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      const { data: existingData } = await supabase
        .from('tag_categories')
        .select('*')
        .eq('user_id', session.session.user.id)
        .single();

      if (existingData) {
        const { error } = await supabase
          .from('tag_categories')
          .update({ categories })
          .eq('id', existingData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tag_categories')
          .insert([{ 
            categories,
            user_id: session.session.user.id 
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tag-categories'] });
    }
  });

  const lifeSections = useMemo(() => {
    if (!savedCategories) return {};
    
    const sections: Record<string, string[]> = {};
    Object.entries(savedCategories).forEach(([category]) => {
      const [section, name] = category.split(': ');
      if (!sections[section]) {
        sections[section] = [];
      }
      if (name && !sections[section].includes(name)) {
        sections[section].push(name);
      }
    });
    return sections;
  }, [savedCategories]);

  return { savedCategories, saveCategoriesMutation, lifeSections };
};