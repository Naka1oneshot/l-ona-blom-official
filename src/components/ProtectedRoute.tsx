import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LogoSpinner from '@/components/LogoSpinner';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: Props) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LogoSpinner />
      </div>
    );
  }

  if (!user) return <Navigate to="/connexion" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
