import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useTags } from "@/hooks/useTags";
import { saveNotesToOfflineStorage } from "@/utils/offlineStorage";

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const { notes } = useTags();
  const [isSaving, setIsSaving] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  const handleSaveOffline = async () => {
    if (!notes || notes.length === 0) {
      toast.error('No notes available to save offline');
      return;
    }

    setIsSaving(true);
    try {
      await saveNotesToOfflineStorage(notes);
      toast.success(`${notes.length} notes saved for offline access`);
    } catch (error) {
      console.error('Error saving notes offline:', error);
      toast.error('Failed to save notes offline');
    } finally {
      setIsSaving(false);
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="container max-w-2xl py-4 space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <span>Dark Mode</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5" />
            <span>Offline Access</span>
          </div>
          <Button
            variant="outline"
            onClick={handleSaveOffline}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Notes Offline'}
          </Button>
        </div>

        <Button
          variant="destructive"
          className="w-full flex items-center gap-2 justify-center"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;