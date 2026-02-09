import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEditMode } from '@/contexts/EditModeContext';

interface AdminEditButtonProps {
  to: string;
  className?: string;
}

const AdminEditButton = ({ to, className = '' }: AdminEditButtonProps) => {
  const { isAdmin } = useAuth();
  const { editMode } = useEditMode();

  if (!isAdmin || !editMode) return null;

  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-luxury-magenta-light transition-colors z-50 ${className}`}
      title="Modifier"
      onClick={(e) => e.stopPropagation()}
    >
      <Pencil size={14} />
    </Link>
  );
};

export default AdminEditButton;
