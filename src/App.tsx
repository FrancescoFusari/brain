import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState, Suspense } from "react";
import { Toaster } from "./components/ui/toaster";
import { AnimatePresence } from "framer-motion";
import { supabase } from "./integrations/supabase/client";
import { AuthenticatedLayout } from "./components/layouts/AuthenticatedLayout";
import { PageTransition } from "./components/layouts/PageTransition";
import { createRoutes } from "./config/routes";

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

  const routes = createRoutes(!!isAuthenticated);

  return (
    <>
      <div className="min-h-screen bg-background w-full">
        {isAuthenticated ? (
          <AuthenticatedLayout>
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition>
                <Suspense fallback={<PageLoader />}>
                  <Routes location={location}>
                    {routes.map((route) => (
                      <Route key={route.path} {...route} />
                    ))}
                  </Routes>
                </Suspense>
              </PageTransition>
            </AnimatePresence>
          </AuthenticatedLayout>
        ) : (
          <Suspense fallback={<PageLoader />}>
            <Routes location={location}>
              {routes.map((route) => (
                <Route key={route.path} {...route} />
              ))}
            </Routes>
          </Suspense>
        )}
      </div>
      <Toaster />
    </>
  );
}

export default App;