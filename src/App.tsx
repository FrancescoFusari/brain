import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { Toaster } from "./components/ui/toaster";
import { BottomNav } from "./components/BottomNav";
import { DesktopNav } from "./components/DesktopNav";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "./integrations/supabase/client";

// Lazy load pages
const Auth = lazy(() => import("./pages/Auth"));
const Index = lazy(() => import("./pages/Index"));
const NotesListPage = lazy(() => import("./pages/NotesListPage"));
const NotePage = lazy(() => import("./pages/NotePage"));
const TagsPage = lazy(() => import("./pages/TagsPage"));
const Network3DPage = lazy(() => import("./pages/Network3DPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const GmailCallback = lazy(() => import("./pages/GmailCallback"));
const QueuePage = lazy(() => import("./pages/QueuePage"));
const EmailDetailsPage = lazy(() => import("./pages/EmailDetailsPage"));

const pageVariants = {
  initial: { 
    opacity: 0,
    x: -20,
    scale: 0.98
  },
  animate: { 
    opacity: 1,
    x: 0,
    scale: 1
  },
  exit: { 
    opacity: 0,
    x: 20,
    scale: 0.98
  },
};

const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3
};

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show nothing while checking auth state
  if (isAuthenticated === null) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-background w-full">
        {isAuthenticated && <DesktopNav />}
        <main className={`${isAuthenticated ? "pt-24 pb-28 md:pb-4" : ""} px-2 md:px-8`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="w-full h-full"
            >
              <Suspense fallback={<PageLoader />}>
                <Routes location={location}>
                  <Route
                    path="/auth"
                    element={isAuthenticated ? <Navigate to="/" /> : <Auth />}
                  />
                  <Route
                    path="/"
                    element={isAuthenticated ? <Index /> : <Navigate to="/auth" />}
                  />
                  <Route
                    path="/notes"
                    element={isAuthenticated ? <NotesListPage /> : <Navigate to="/auth" />}
                  />
                  <Route
                    path="/note/:id"
                    element={isAuthenticated ? <NotePage /> : <Navigate to="/auth" />}
                  />
                  <Route
                    path="/tags"
                    element={isAuthenticated ? <TagsPage /> : <Navigate to="/auth" />}
                  />
                  <Route
                    path="/network3d"
                    element={isAuthenticated ? <Network3DPage /> : <Navigate to="/auth" />}
                  />
                  <Route
                    path="/settings"
                    element={isAuthenticated ? <SettingsPage /> : <Navigate to="/auth" />}
                  />
                  <Route
                    path="/gmail-callback"
                    element={isAuthenticated ? <GmailCallback /> : <Navigate to="/auth" />}
                  />
                  <Route
                    path="/queue"
                    element={isAuthenticated ? <QueuePage /> : <Navigate to="/auth" />}
                  />
                  <Route
                    path="/email/:id"
                    element={isAuthenticated ? <EmailDetailsPage /> : <Navigate to="/auth" />}
                  />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
        {isAuthenticated && <BottomNav />}
      </div>
      <Toaster />
    </>
  );
}

export default App;