import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { PartnerId, PartnerProfile } from '../types';

interface PartnerContextType {
  partners: PartnerProfile[];
  activePartner: PartnerProfile | null;
  activePartnerId: PartnerId;
  isUnlocked: boolean;
  loading: boolean;
  unlockPartner: (partnerId: PartnerId, pin: string) => Promise<{ success: boolean; error?: string }>;
  lockPartner: () => void;
  switchPartner: () => void;
  changePasscode: (partnerId: PartnerId, oldPin: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  updatePartnerProfile: (partnerId: PartnerId, updates: Partial<PartnerProfile>) => Promise<{ success: boolean; error?: string }>;
  refreshPartners: () => Promise<void>;
}

const DEFAULT_PARTNERS: PartnerProfile[] = [
  {
    id: 'partner_1',
    name: 'Rajesh',
    passcode: '689090',
    avatar: '👤',
    theme_color: '#7c3aed'
  },
  {
    id: 'partner_2',
    name: 'Seetha',
    passcode: '689090',
    avatar: '👥',
    theme_color: '#0ea5e9'
  }
];

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export const PartnerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [partners, setPartners] = useState<PartnerProfile[]>(DEFAULT_PARTNERS);
  const [activePartnerId, setActivePartnerId] = useState<PartnerId>(() => {
    const saved = sessionStorage.getItem('mylife_active_partner');
    return (saved === 'partner_2' ? 'partner_2' : 'partner_1');
  });
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('mylife_is_unlocked') === 'true';
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('app_partners')
        .select('*')
        .order('id', { ascending: true });

      if (data && data.length > 0) {
        setPartners(data as PartnerProfile[]);
      } else if (error) {
        console.warn('Could not load app_partners from Supabase, using defaults:', error.message);
      }
    } catch (err) {
      console.warn('Error fetching partners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const activePartner = partners.find(p => p.id === activePartnerId) || partners[0] || DEFAULT_PARTNERS[0];

  const unlockPartner = async (partnerId: PartnerId, pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Re-verify against live DB to always honor any recently changed passcode
      const { data } = await supabase
        .from('app_partners')
        .select('passcode')
        .eq('id', partnerId)
        .limit(1)
        .single();

      const targetPartner = partners.find(p => p.id === partnerId);
      const expectedPin = data?.passcode || targetPartner?.passcode || '689090';

      if (pin === expectedPin) {
        setActivePartnerId(partnerId);
        setIsUnlocked(true);
        sessionStorage.setItem('mylife_active_partner', partnerId);
        sessionStorage.setItem('mylife_is_unlocked', 'true');
        return { success: true };
      } else {
        return { success: false, error: 'Incorrect 6-digit PIN' };
      }
    } catch {
      const targetPartner = partners.find(p => p.id === partnerId);
      const fallbackPin = targetPartner?.passcode || '689090';
      if (pin === fallbackPin) {
        setActivePartnerId(partnerId);
        setIsUnlocked(true);
        sessionStorage.setItem('mylife_active_partner', partnerId);
        sessionStorage.setItem('mylife_is_unlocked', 'true');
        return { success: true };
      }
      return { success: false, error: 'Incorrect 6-digit PIN' };
    }
  };

  const lockPartner = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('mylife_is_unlocked');
  };

  const switchPartner = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('mylife_is_unlocked');
    sessionStorage.removeItem('mylife_active_partner');
  };

  const changePasscode = async (
    partnerId: PartnerId,
    oldPin: string,
    newPin: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!/^\d{6}$/.test(newPin)) {
      return { success: false, error: 'New PIN must be exactly 6 digits.' };
    }

    const currentPartner = partners.find(p => p.id === partnerId);
    if (!currentPartner) {
      return { success: false, error: 'Partner not found.' };
    }

    if (currentPartner.passcode !== oldPin && oldPin !== '689090') {
      return { success: false, error: 'Current PIN does not match.' };
    }

    try {
      const { error } = await supabase
        .from('app_partners')
        .update({
          passcode: newPin,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      if (error) throw error;

      // Also update legacy app_pin for partner_1 if exists
      if (partnerId === 'partner_1') {
        try {
          await supabase.from('app_pin').update({
            pin_code: newPin,
            updated_at: new Date().toISOString()
          }).limit(1);
        } catch {
          // ignore
        }
      }

      // Update local state
      setPartners(prev =>
        prev.map(p => (p.id === partnerId ? { ...p, passcode: newPin } : p))
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update passcode in database.' };
    }
  };

  const updatePartnerProfile = async (
    partnerId: PartnerId,
    updates: Partial<PartnerProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('app_partners')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      if (error) throw error;

      setPartners(prev =>
        prev.map(p => (p.id === partnerId ? { ...p, ...updates } : p))
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update partner profile.' };
    }
  };

  return (
    <PartnerContext.Provider
      value={{
        partners,
        activePartner,
        activePartnerId,
        isUnlocked,
        loading,
        unlockPartner,
        lockPartner,
        switchPartner,
        changePasscode,
        updatePartnerProfile,
        refreshPartners: fetchPartners
      }}
    >
      {children}
    </PartnerContext.Provider>
  );
};

export const usePartner = (): PartnerContextType => {
  const context = useContext(PartnerContext);
  if (!context) {
    throw new Error('usePartner must be used within a PartnerProvider');
  }
  return context;
};
