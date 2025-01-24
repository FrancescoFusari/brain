import { BottomNav } from "../BottomNav";
import { DesktopNav } from "../DesktopNav";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export const AuthenticatedLayout = ({ children }: AuthenticatedLayoutProps) => {
  return (
    <>
      <DesktopNav />
      <main className="pt-16 pb-28 md:pb-4 px-2 md:px-8">
        {children}
      </main>
      <BottomNav />
    </>
  );
};