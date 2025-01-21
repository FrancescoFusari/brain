import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Trash2, Link2Icon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { NoteMetadata } from "./notes/NoteMetadata";
import { NoteTags } from "./notes/NoteTags";
import { NoteContent } from "./notes/NoteContent";
import { NoteHeader } from "./notes/NoteHeader";

interface NoteDetailProps {
  note: {
    id: string;
    content: string;
    category: string;
    tags: string[];
    created_at: string;
    input_type?: string;
    source_image_path?: string;
    source_url?: string;
    metadata?: {
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
    };
  };
}

export const NoteDetail = ({ note }: NoteDetailProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRegeneratingTitle, setIsRegeneratingTitle] = useState(false);
  const [isRegeneratingTags, setIsRegeneratingTags] = useState(false);
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

  const handleShare = async () => {
    try {
      const shareData = {
        title: note.category,
        text: note.content,
        url: window.location.href
      };

      if (note.input_type === 'url' && note.source_url) {
        shareData.url = note.source_url;
      }

      await navigator.share(shareData);
    } catch (error) {
      console.error('Error sharing:', error);
      const textToCopy = note.input_type === 'url' && note.source_url 
        ? note.source_url 
        : window.location.href;
      
      navigator.clipboard.writeText(textToCopy);
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
        <CardHeader>
          <NoteHeader
            category={note.category}
            inputType={note.input_type}
            createdAt={note.created_at}
            onRegenerateTitle={() => regenerateMetadata('title')}
            isRegeneratingTitle={isRegeneratingTitle}
          />
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
          
          {note.source_url && note.input_type === 'url' && (
            <div className="mb-4">
              <a 
                href={note.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-2"
              >
                <Link2Icon className="h-4 w-4" />
                {note.source_url}
              </a>
            </div>
          )}
          
          <NoteContent
            content={editedContent}
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onCancel={() => {
              setIsEditing(false);
              setEditedContent(note.content);
            }}
            onSave={() => {
              updateNoteMutation.mutate({ content: editedContent });
              setIsEditing(false);
            }}
            onContentChange={setEditedContent}
          />
          
          <NoteMetadata
            metadata={note.metadata}
            inputType={note.input_type || 'text'}
          />
          
          <NoteTags
            tags={note.tags}
            onAddTag={(newTag) => {
              const updatedTags = [...note.tags, newTag];
              updateNoteMutation.mutate({ tags: updatedTags });
            }}
            onRemoveTag={(tagToRemove) => {
              const updatedTags = note.tags.filter(tag => tag !== tagToRemove);
              updateNoteMutation.mutate({ tags: updatedTags });
            }}
            onRenameTag={(originalTag, newTag) => {
              const updatedTags = note.tags.map(tag => 
                tag === originalTag ? newTag : tag
              );
              updateNoteMutation.mutate({ tags: updatedTags });
            }}
            onRegenerateTags={() => regenerateMetadata('tags')}
            isRegeneratingTags={isRegeneratingTags}
          />
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