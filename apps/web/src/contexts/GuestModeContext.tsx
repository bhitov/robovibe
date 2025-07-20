/**
 * Guest mode context for authentication bypass
 */
import React, { createContext, useContext, useState, useEffect } from 'react';

interface GuestModeContextType {
  isGuestMode: boolean;
  setIsGuestMode: (value: boolean) => void;
  guestNickname: string;
  setGuestNickname: (value: string) => void;
}

const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

export function GuestModeProvider({ children }: { children: React.ReactNode }) {
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestNickname, setGuestNickname] = useState('');

  useEffect(() => {
    const savedGuestMode = localStorage.getItem('isGuestMode');
    const savedNickname = localStorage.getItem('guestNickname');
    
    if (savedGuestMode === 'true') {
      setIsGuestMode(true);
      setGuestNickname(savedNickname || '');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('isGuestMode', isGuestMode.toString());
    if (guestNickname) {
      localStorage.setItem('guestNickname', guestNickname);
    }
  }, [isGuestMode, guestNickname]);

  return (
    <GuestModeContext.Provider value={{ isGuestMode, setIsGuestMode, guestNickname, setGuestNickname }}>
      {children}
    </GuestModeContext.Provider>
  );
}

export function useGuestMode() {
  const context = useContext(GuestModeContext);
  if (context === undefined) {
    throw new Error('useGuestMode must be used within a GuestModeProvider');
  }
  return context;
}