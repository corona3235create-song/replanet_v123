import React, { createContext, useContext, useState, useEffect } from 'react';
import { groupAPI, Group, GroupChallenge } from '../services/groupApi';
import { useAuth } from './AuthContext';

interface GroupContextType {
  userGroups: Group[];
  loading: boolean;
  error: string | null;
  refreshGroups: () => void;
  createGroup: (data: { name: string; description?: string; max_members?: number; usernames: string[] }) => Promise<Group>;
  leaveGroup: (groupId: number) => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const refreshGroups = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const groups = await groupAPI.getUserGroups();
      setUserGroups(groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (data: { name: string; description?: string; max_members?: number; usernames: string[] }): Promise<Group> => {
    const group = await groupAPI.createGroup(data);
    await refreshGroups();
    return group;
  };

  const leaveGroup = async (groupId: number): Promise<void> => {
    await groupAPI.leaveGroup(groupId);
    await refreshGroups();
  };

  useEffect(() => {
    refreshGroups();
  }, [user]);

  return (
    <GroupContext.Provider value={{
      userGroups,
      loading,
      error,
      refreshGroups,
      createGroup,
      leaveGroup,
    }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroups = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroups must be used within a GroupProvider');
  }
  return context;
};