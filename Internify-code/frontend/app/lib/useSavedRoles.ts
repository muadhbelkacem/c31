'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../components/SupabaseProvider';
import { supabase } from './supabase-client';
import { Internship } from './data';

interface SavedRole {
  id: string;
  user_id: string;
  role_id: string;
  internship_data: Internship;
  saved_at: string;
}

export function useSavedRoles() {
  const { user } = useSupabase();
  const [savedRoles, setSavedRoles] = useState<SavedRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Load saved roles - WRAPPED IN useCallback
  const loadSavedRoles = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_roles')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      setSavedRoles(data || []);
    } catch (error) {
      console.error('Error loading saved roles:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load saved roles when user changes
  useEffect(() => {
    if (user) {
      loadSavedRoles();
    } else {
      setSavedRoles([]);
      setLoading(false);
    }
  }, [user, loadSavedRoles]);

  const saveRole = async (internship: Internship): Promise<boolean> => {
    if (!user) {
      alert('Please sign in to save roles');
      return false;
    }

    try {
      const { error } = await supabase
        .from('saved_roles')
        .insert({
          user_id: user.id,
          role_id: internship.id,
          internship_data: internship
        });

      if (error) throw error;
      
      // Refresh the saved roles list
      await loadSavedRoles();
      return true;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        return true;
      }
      console.error('Error saving role:', error);
      return false;
    }
  };

  const unsaveRole = async (roleId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('saved_roles')
        .delete()
        .eq('user_id', user.id)
        .eq('role_id', roleId);

      if (error) throw error;
      
      // Refresh the saved roles list
      await loadSavedRoles();
      return true;
    } catch (error) {
      console.error('Error unsaving role:', error);
      return false;
    }
  };

  const isRoleSaved = (roleId: string): boolean => {
    return savedRoles.some(role => role.role_id === roleId);
  };

  const getSavedRoleId = (roleId: string): string | null => {
    const savedRole = savedRoles.find(role => role.role_id === roleId);
    return savedRole?.id || null;
  };

  return {
    savedRoles,
    loading,
    saveRole,
    unsaveRole,
    isRoleSaved,
    getSavedRoleId,
    refreshSavedRoles: loadSavedRoles
  };
} 