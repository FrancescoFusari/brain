import { lazy } from "react";
import { Navigate } from "react-router-dom";

const Auth = lazy(() => import("../pages/Auth"));
const Index = lazy(() => import("../pages/Index"));
const NotesListPage = lazy(() => import("../pages/NotesListPage"));
const NotePage = lazy(() => import("../pages/NotePage"));
const TagsPage = lazy(() => import("../pages/TagsPage"));
const Network3DPage = lazy(() => import("../pages/Network3DPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const GmailCallback = lazy(() => import("../pages/GmailCallback"));
const QueuePage = lazy(() => import("../pages/QueuePage"));
const EmailDetailsPage = lazy(() => import("../pages/EmailDetailsPage"));

export const createRoutes = (isAuthenticated: boolean) => [
  {
    path: "/auth",
    element: isAuthenticated ? <Navigate to="/" /> : <Auth />
  },
  {
    path: "/",
    element: isAuthenticated ? <Index /> : <Navigate to="/auth" />
  },
  {
    path: "/notes",
    element: isAuthenticated ? <NotesListPage /> : <Navigate to="/auth" />
  },
  {
    path: "/note/:id",
    element: isAuthenticated ? <NotePage /> : <Navigate to="/auth" />
  },
  {
    path: "/tags",
    element: isAuthenticated ? <TagsPage /> : <Navigate to="/auth" />
  },
  {
    path: "/network3d",
    element: isAuthenticated ? <Network3DPage /> : <Navigate to="/auth" />
  },
  {
    path: "/settings",
    element: isAuthenticated ? <SettingsPage /> : <Navigate to="/auth" />
  },
  {
    path: "/gmail-callback",
    element: isAuthenticated ? <GmailCallback /> : <Navigate to="/auth" />
  },
  {
    path: "/queue",
    element: isAuthenticated ? <QueuePage /> : <Navigate to="/auth" />
  },
  {
    path: "/email/:id",
    element: isAuthenticated ? <EmailDetailsPage /> : <Navigate to="/auth" />
  }
];