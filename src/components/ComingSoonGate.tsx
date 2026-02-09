import { useAuth } from '@/hooks/useAuth';
import { useComingSoon } from '@/hooks/useComingSoon';
import ComingSoon from '@/pages/ComingSoon';
import LogoSpinner from '@/components/LogoSpinner';

interface Props {
  children: React.ReactNode;
}

const ComingSoonGate = ({ children }: Props) => {
  const { config, loading: csLoading } = useComingSoon();
  const { loading: authLoading, isAdmin } = useAuth();

  if (csLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LogoSpinner />
      </div>
    );
  }

  // If coming soon is enabled and user is NOT admin, show the coming soon page
  if (config.enabled && !isAdmin) {
    return <ComingSoon config={config} />;
  }

  return <>{children}</>;
};

export default ComingSoonGate;
