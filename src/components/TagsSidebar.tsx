import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Hash, Menu, X } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "./ui/button";

interface Note {
  id: string;
  content: string;
  tags: string[];
  created_at: string;
}

export const TagsSidebar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      console.log('Fetching notes for sidebar...');
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching notes:', error);
        throw error;
      }
      console.log('Notes fetched successfully:', data);
      return data as Note[];
    }
  });

  // Create a map of tags to note counts
  const tagCounts = new Map<string, number>();
  notes.forEach(note => {
    note.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  // Sort tags by usage count
  const sortedTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  const SidebarContent = () => (
    <SidebarContent className="pt-4">
      <SidebarGroup>
        <SidebarGroupLabel className="text-secondary">Tags</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {sortedTags.map(([tag, count]) => (
              <SidebarMenuButton
                key={tag}
                onClick={() => navigate(`/tag/${tag}`)}
                className="w-full text-secondary hover:text-primary"
              >
                <Hash className="h-4 w-4" />
                <span>{tag}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {count}
                </span>
              </SidebarMenuButton>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <div className="floating-sidebar mt-[84px]">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-50 bg-background/50 backdrop-blur-sm border-border/10"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>

        <div
          className={`fixed inset-y-0 left-0 w-[280px] bg-background/90 backdrop-blur-sm border-r border-border/10 transform transition-transform duration-300 ease-in-out ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full overflow-y-auto pt-16 pb-4">
            <SidebarContent />
          </div>
        </div>
      </div>
    </>
  );
};