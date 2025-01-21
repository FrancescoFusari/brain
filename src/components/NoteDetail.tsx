import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, RefreshCw, X, Link2Icon, ImageIcon, MailIcon, TextIcon, Share2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { useState } from "react";
import { Input } from "./ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "./ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NoteDetailProps {
  note: {
    id: string;
    content: string;
    category: string;
    tags: string[];
    created_at: string;
    input_type?: string;
    source_image_path?: string;
    metadata?: {
      technical_details?: string;
      visual_elements?: string[];
      color_palette?: string[];
      composition_notes?: string;
      estimated_date_or_period?: string;
    };
  };
}

export const NoteDetail = ({ note }: NoteDetailProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRegeneratingTitle, setIsRegeneratingTitle] = useState(false);
  const [isRegeneratingTags, setIsRegeneratingTags] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [editingTag, setEditingTag] = useState<{ original: string; new: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const imageUrl = note.source_image_path 
    ? supabase.storage.from('note_images').getPublicUrl(note.source_image_path).data.publicUrl
    : null;

  const updateNoteMutation = useMutation({
    mutationFn: async ({ tags, content }: { tags?: string[], content?: string }) => {
      const updateData: any = {};
      if (tags) updateData.tags = tags;
      if (content !== undefined) updateData.content = content;

      const { error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', note.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', note.id] });
      toast({
        title: "Note updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Note deleted",
        description: "The note has been deleted successfully.",
      });
      navigate('/');
    },
    onError: (error) => {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const updatedTags = [...note.tags, newTag.trim()];
    updateNoteMutation.mutate({ tags: updatedTags });
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = note.tags.filter(tag => tag !== tagToRemove);
    updateNoteMutation.mutate({ tags: updatedTags });
  };

  const handleRenameTag = (originalTag: string) => {
    if (!editingTag || !editingTag.new.trim() || editingTag.new === originalTag) {
      setEditingTag(null);
      return;
    }

    const updatedTags = note.tags.map(tag => 
      tag === originalTag ? editingTag.new.trim() : tag
    );
    updateNoteMutation.mutate({ tags: updatedTags });
    setEditingTag(null);
  };

  const handleSaveContent = () => {
    updateNoteMutation.mutate({ content: editedContent });
    setIsEditing(false);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: note.category,
        text: note.content,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "The note URL has been copied to your clipboard.",
      });
    }
  };

  const regenerateMetadata = async (type: 'tags' | 'title') => {
    try {
      const loadingState = type === 'tags' ? setIsRegeneratingTags : setIsRegeneratingTitle;
      loadingState(true);

      const { data: updatedNote, error } = await supabase.functions.invoke('regenerate-note-metadata', {
        body: { 
          content: note.content,
          noteId: note.id,
          type
        }
      });

      if (error) throw error;

      toast({
        title: `${type === 'tags' ? 'Tags' : 'Title'} regenerated`,
        description: "The note has been updated successfully.",
      });

      window.location.reload();
    } catch (error) {
      console.error('Error regenerating metadata:', error);
      toast({
        title: "Error",
        description: `Failed to regenerate ${type}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      const loadingState = type === 'tags' ? setIsRegeneratingTags : setIsRegeneratingTitle;
      loadingState(false);
    }
  };

  const getTypeIcon = (type?: string) => {
    const inputType = type?.toLowerCase();
    console.log('Getting icon for type:', inputType); // Debug log
    
    switch (inputType) {
      case 'url':
        return <Link2Icon className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'email':
        return <MailIcon className="h-4 w-4" />;
      default:
        return <TextIcon className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type?: string) => {
    const inputType = type?.toLowerCase();
    console.log('Getting label for type:', inputType); // Debug log
    
    switch (inputType) {
      case 'url':
        return 'URL Note';
      case 'image':
        return 'Image Note';
      case 'email':
        return 'Email Note';
      default:
        return 'Text Note';
    }
  };

  const formatContent = (content: string) => {
    const formattedContent = content
      .replace(/\n\s*\n/g, '\n\n')
      .split('\n\n')
      .filter(para => para.trim() !== '')
      .join('\n\n');
    
    return formattedContent;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-primary text-sm md:text-lg font-semibold">
              {note.category}
            </Badge>
            <Badge 
              variant="secondary"
              className="flex items-center gap-1 text-xs md:text-sm"
            >
              {getTypeIcon(note.input_type)}
              {getTypeLabel(note.input_type)}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => regenerateMetadata('title')}
              disabled={isRegeneratingTitle}
            >
              <RefreshCw className={`h-4 w-4 ${isRegeneratingTitle ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="flex items-center text-xs md:text-sm text-muted-foreground">
            <CalendarIcon className="mr-1 h-4 w-4" />
            {new Date(note.created_at).toLocaleDateString()}
          </div>
        </CardHeader>
        
        <CardContent>
          {imageUrl && (
            <div className="mb-6">
              <img 
                src={imageUrl} 
                alt="Note source" 
                className="rounded-lg max-h-96 w-full object-cover"
              />
            </div>
          )}
          
          <div className="whitespace-pre-wrap mb-4 text-sm md:text-base leading-relaxed break-words max-w-full overflow-hidden px-1">
            <div className="w-[94vw] lg:max-w-[65ch] mx-auto">
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[200px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedContent(note.content);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveContent}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {formatContent(note.content).split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setIsEditing(true);
                      setEditedContent(note.content);
                    }}
                  >
                    Edit Note
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {note.metadata && (
            <div className="space-y-4 mb-6 bg-muted p-3 md:p-4 rounded-lg text-sm md:text-base">
              <h3 className="font-semibold text-base md:text-lg">Image Analysis</h3>
              
              {note.metadata.technical_details && (
                <div>
                  <h4 className="font-medium text-xs md:text-sm text-muted-foreground">Technical Details</h4>
                  <p className="mt-1">{note.metadata.technical_details}</p>
                </div>
              )}
              
              {note.metadata.visual_elements && note.metadata.visual_elements.length > 0 && (
                <div>
                  <h4 className="font-medium text-xs md:text-sm text-muted-foreground">Visual Elements</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {note.metadata.visual_elements.map((element, index) => (
                      <Badge key={index} variant="secondary">{element}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {note.metadata.color_palette && note.metadata.color_palette.length > 0 && (
                <div>
                  <h4 className="font-medium text-xs md:text-sm text-muted-foreground">Color Palette</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {note.metadata.color_palette.map((color, index) => (
                      <Badge key={index} variant="outline">{color}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {note.metadata.composition_notes && (
                <div>
                  <h4 className="font-medium text-xs md:text-sm text-muted-foreground">Composition Notes</h4>
                  <p className="mt-1">{note.metadata.composition_notes}</p>
                </div>
              )}
              
              {note.metadata.estimated_date_or_period && (
                <div>
                  <h4 className="font-medium text-xs md:text-sm text-muted-foreground">Estimated Period</h4>
                  <p className="mt-1">{note.metadata.estimated_date_or_period}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add new tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="max-w-[200px] text-sm"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <div key={tag} className="flex items-center">
                  {editingTag?.original === tag ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editingTag.new}
                        onChange={(e) => setEditingTag({ ...editingTag, new: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameTag(tag)}
                        className="h-7 w-[150px] text-sm"
                        autoFocus
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRenameTag(tag)}
                        className="text-xs"
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <Badge 
                      variant="secondary"
                      className="pr-1 text-xs md:text-sm"
                    >
                      <span 
                        className="cursor-pointer mr-2"
                        onClick={() => setEditingTag({ original: tag, new: tag })}
                      >
                        {tag}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                </div>
              ))}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => regenerateMetadata('tags')}
                disabled={isRegeneratingTags}
                className="text-xs md:text-sm"
              >
                <RefreshCw className={`h-4 w-4 ${isRegeneratingTags ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your note and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteNoteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
