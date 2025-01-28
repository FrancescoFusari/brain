import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Trees, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TagHierarchyProps {
  tags: string[];
}

interface TagRelationship {
  id: string;
  parent_tag: string;
  child_tag: string;
  user_id: string;
}

export const TagHierarchy = ({ tags }: TagHierarchyProps) => {
  const [relationships, setRelationships] = useState<TagRelationship[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRelationships();
  }, []);

  const fetchRelationships = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        console.error('No authenticated user found');
        return;
      }

      const { data, error } = await supabase
        .from('tag_relationships')
        .select('*')
        .eq('user_id', session.session.user.id);
      
      if (error) throw error;
      setRelationships(data || []);
    } catch (error) {
      console.error('Error fetching tag relationships:', error);
      toast({
        title: "Error",
        description: "Failed to load tag relationships",
        variant: "destructive",
      });
    }
  };

  const generateHierarchy = async () => {
    try {
      setIsGenerating(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      const { data, error } = await supabase.functions.invoke('generate-tag-hierarchy', {
        body: { 
          tags,
          userId: session.session.user.id
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tag hierarchy generated successfully",
      });

      await fetchRelationships();
    } catch (error) {
      console.error('Error generating tag hierarchy:', error);
      toast({
        title: "Error",
        description: "Failed to generate tag hierarchy",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Trees className="h-5 w-5" />
          <h3 className="text-lg font-medium">Tag Hierarchy</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generateHierarchy}
          disabled={isGenerating || tags.length === 0}
          className="ml-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate Hierarchy"}
        </Button>
      </CardHeader>
      <CardContent>
        {relationships.length > 0 && (
          <div className="space-y-4">
            {Array.from(new Set(relationships.map(r => r.parent_tag))).map((parent) => (
              <div key={parent} className="space-y-2">
                <Badge variant="secondary" className="text-sm">
                  {parent}
                </Badge>
                <div className="flex flex-wrap gap-2 pl-6">
                  {relationships
                    .filter(r => r.parent_tag === parent)
                    .map(r => (
                      <Badge key={r.id} variant="outline" className="text-sm">
                        {r.child_tag}
                      </Badge>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};