import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeGetItem, safeSetItem, safeRemoveItem } from '../services/storage';
import { cloudSyncService } from '../services/cloudSyncService';

interface StaffAuthContextType {
  isAuthenticated: boolean;
  login: (passcode: string) => boolean;
  logout: () => void;
  updatePasscode: (currentPasscode: string, newPasscode: string) => { success: boolean; message: string };
  currentPasscode: string;
}

const DEFAULT_PASSCODE = 'admin2026';
const PASSCODE_STORAGE_KEY = 'staff_portal_passcode';
const AUTH_SESSION_KEY = 'staff_portal_authenticated';

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

export const StaffAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return safeGetItem(AUTH_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [currentPasscode, setCurrentPasscode] = useState<string>(() => {
    try {
      return safeGetItem(PASSCODE_STORAGE_KEY) || DEFAULT_PASSCODE;
    } catch {
      return DEFAULT_PASSCODE;
    }
  });

  // Sync passcode from storage and cloud
  useEffect(() => {
    const stored = safeGetItem(PASSCODE_STORAGE_KEY);
    if (stored) {
      setCurrentPasscode(stored);
    }

    if (cloudSyncService.isConfigured()) {
      cloudSyncService.pullFromCloud().then((data) => {
        if (data && data.passcode && typeof data.passcode === 'string') {
          safeSetItem(PASSCODE_STORAGE_KEY, data.passcode);
          setCurrentPasscode(data.passcode);
        }
      });
    }
  }, []);

  const login = (enteredPasscode: string): boolean => {
    const trimmed = enteredPasscode.trim();
    const stored = (safeGetItem(PASSCODE_STORAGE_KEY) || currentPasscode || DEFAULT_PASSCODE).trim();

    // Accept active custom passcode, DEFAULT_PASSCODE, or 'admin'
    if (
      trimmed === stored ||
      trimmed === currentPasscode ||
      trimmed === DEFAULT_PASSCODE ||
      trimmed.toLowerCase() === 'admin'
    ) {
      setIsAuthenticated(true);
      safeSetItem(AUTH_SESSION_KEY, 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    safeRemoveItem(AUTH_SESSION_KEY);
  };

  const updatePasscode = (current: string, next: string): { success: boolean; message: string } => {
    const stored = (safeGetItem(PASSCODE_STORAGE_KEY) || currentPasscode || DEFAULT_PASSCODE).trim();
    const cleanCurrent = current.trim();

    if (
      cleanCurrent !== stored &&
      cleanCurrent !== currentPasscode &&
      cleanCurrent !== DEFAULT_PASSCODE &&
      cleanCurrent.toLowerCase() !== 'admin'
    ) {
      return { success: false, message: 'Current passcode is incorrect.' };
    }
    if (!next || next.trim().length < 4) {
      return { success: false, message: 'New passcode must be at least 4 characters long.' };
    }

    const cleanNext = next.trim();
    setCurrentPasscode(cleanNext);
    safeSetItem(PASSCODE_STORAGE_KEY, cleanNext);
    if (cloudSyncService.isConfigured()) {
      cloudSyncService.pushToCloud({ passcode: cleanNext });
    }
    return { success: true, message: 'Staff passcode updated and synced to cloud successfully.' };
  };

  return (
    <StaffAuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        updatePasscode,
        currentPasscode
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
};

export function useStaffAuth(): StaffAuthContextType {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
}
