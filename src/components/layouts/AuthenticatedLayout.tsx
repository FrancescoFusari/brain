import { BottomNav } from "../BottomNav";
import { DesktopNav } from "../DesktopNav";
import { useLocation } from "react-router-dom";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export const AuthenticatedLayout = ({ children }: AuthenticatedLayoutProps) => {
  const location = useLocation();
  const isNetworkPage = location.pathname === "/network3d";

  return (
    <>
      <DesktopNav />
      <main className={`${isNetworkPage ? "" : "pt-16 pb-28 md:pb-4 px-2 md:px-8"}`}>
        {children}
      </main>
      <BottomNav />
    </>
  );
};