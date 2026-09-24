import React, { createContext, useContext, useState, useEffect } from 'react';

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
      return sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [currentPasscode, setCurrentPasscode] = useState<string>(() => {
    try {
      return localStorage.getItem(PASSCODE_STORAGE_KEY) || DEFAULT_PASSCODE;
    } catch {
      return DEFAULT_PASSCODE;
    }
  });

  const login = (enteredPasscode: string): boolean => {
    // Check against configured passcode or default fallback
    const trimmed = enteredPasscode.trim();
    if (trimmed === currentPasscode || trimmed === DEFAULT_PASSCODE) {
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
      } catch (e) {
        console.error('Session storage error:', e);
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    } catch (e) {
      console.error('Session storage error:', e);
    }
  };

  const updatePasscode = (current: string, next: string): { success: boolean; message: string } => {
    if (current.trim() !== currentPasscode && current.trim() !== DEFAULT_PASSCODE) {
      return { success: false, message: 'Current passcode is incorrect.' };
    }
    if (!next || next.trim().length < 4) {
      return { success: false, message: 'New passcode must be at least 4 characters long.' };
    }

    const cleanNext = next.trim();
    setCurrentPasscode(cleanNext);
    try {
      localStorage.setItem(PASSCODE_STORAGE_KEY, cleanNext);
    } catch (e) {
      console.error('Local storage error:', e);
    }
    return { success: true, message: 'Staff passcode updated successfully.' };
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
