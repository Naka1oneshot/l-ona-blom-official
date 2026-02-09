import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface EditModeContextValue {
  /** Whether edit mode is currently active (always false for non-admins) */
  editMode: boolean;
  /** Toggle edit mode on/off */
  toggleEditMode: () => void;
}

const EditModeContext = createContext<EditModeContextValue>({ editMode: false, toggleEditMode: () => {} });

export const useEditMode = () => useContext(EditModeContext);

export const EditModeProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin } = useAuth();
  const [editMode, setEditMode] = useState(false);

  const toggleEditMode = useCallback(() => {
    if (!isAdmin) return;
    setEditMode(prev => !prev);
  }, [isAdmin]);

  // Non-admins never see edit mode
  const value = { editMode: isAdmin && editMode, toggleEditMode };

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  );
};
