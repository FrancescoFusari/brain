import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ArrowUp, ArrowDown, Plus, Minus, Folder } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TagHierarchyProps {
  tags: string[];
}

interface TagRelationship {
  id: string;
  parent_tag: string;
  child_tag: string;
}

export const TagHierarchy = ({ tags }: TagHierarchyProps) => {
  const [relationships, setRelationships] = useState<TagRelationship[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [parentTag, setParentTag] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchRelationships();
  }, []);

  const fetchRelationships = async () => {
    try {
      const { data, error } = await supabase
        .from('tag_relationships')
        .select('*');
      
      if (error) throw error;
      setRelationships(data);
    } catch (error) {
      console.error('Error fetching tag relationships:', error);
      toast({
        title: "Error",
        description: "Failed to load tag relationships",
        variant: "destructive",
      });
    }
  };

  const addRelationship = async () => {
    if (!selectedTag || !parentTag) return;
    
    try {
      const { error } = await supabase
        .from('tag_relationships')
        .insert([
          {
            parent_tag: parentTag,
            child_tag: selectedTag,
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tag relationship added successfully",
      });

      fetchRelationships();
      setSelectedTag(null);
      setParentTag("");
    } catch (error) {
      console.error('Error adding tag relationship:', error);
      toast({
        title: "Error",
        description: "Failed to add tag relationship",
        variant: "destructive",
      });
    }
  };

  const removeRelationship = async (parentTag: string, childTag: string) => {
    try {
      const { error } = await supabase
        .from('tag_relationships')
        .delete()
        .match({ parent_tag: parentTag, child_tag: childTag });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tag relationship removed successfully",
      });

      fetchRelationships();
    } catch (error) {
      console.error('Error removing tag relationship:', error);
      toast({
        title: "Error",
        description: "Failed to remove tag relationship",
        variant: "destructive",
      });
    }
  };

  const getChildTags = (parentTag: string) => {
    return relationships
      .filter(rel => rel.parent_tag === parentTag)
      .map(rel => rel.child_tag);
  };

  const getParentTags = (childTag: string) => {
    return relationships
      .filter(rel => rel.child_tag === childTag)
      .map(rel => rel.parent_tag);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-lg font-medium">Tag Hierarchy</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? "secondary" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>

        {selectedTag && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter parent tag"
                value={parentTag}
                onChange={(e) => setParentTag(e.target.value)}
                className="max-w-[200px]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addRelationship}
                disabled={!parentTag}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Relationship
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Parent Tags:</span>
              </div>
              <div className="flex flex-wrap gap-2 pl-6">
                {getParentTags(selectedTag).map(parent => (
                  <Badge key={parent} variant="secondary" className="flex items-center gap-1">
                    <Folder className="h-3 w-3" />
                    {parent}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeRelationship(parent, selectedTag)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Child Tags:</span>
              </div>
              <div className="flex flex-wrap gap-2 pl-6">
                {getChildTags(selectedTag).map(child => (
                  <Badge key={child} variant="secondary" className="flex items-center gap-1">
                    {child}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeRelationship(selectedTag, child)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};