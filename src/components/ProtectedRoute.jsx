import { Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import FlameMark from "@/components/FlameMark";

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <FlameMark className="h-10 w-10 animate-pulse" />
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  const { isAuthenticated, isLoadingAuth, authChecked } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (!isAuthenticated) {
    return unauthenticatedElement;
  }

  return <Outlet />;
}
