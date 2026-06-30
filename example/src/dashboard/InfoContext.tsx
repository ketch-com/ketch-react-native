import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {SAMPLE_CONFIG} from '../../config';

export interface LiveInfo {
  jurisdiction: string;
  region: string;
}

interface InfoContextValue {
  info: LiveInfo;
  setJurisdiction: (value: string) => void;
  setRegion: (value: string) => void;
}

const InfoContext = createContext<InfoContextValue | null>(null);

const initialInfo: LiveInfo = {
  jurisdiction: SAMPLE_CONFIG.jurisdictionCode ?? 'Not set',
  region: SAMPLE_CONFIG.regionCode ?? 'Not set',
};

export function InfoProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [info, setInfo] = useState<LiveInfo>(initialInfo);

  const setJurisdiction = useCallback((jurisdiction: string) => {
    setInfo(prev => ({...prev, jurisdiction}));
  }, []);

  const setRegion = useCallback((region: string) => {
    setInfo(prev => ({...prev, region}));
  }, []);

  const value = useMemo(
    () => ({info, setJurisdiction, setRegion}),
    [info, setJurisdiction, setRegion],
  );

  return (
    <InfoContext.Provider value={value}>{children}</InfoContext.Provider>
  );
}

export function useInfo(): InfoContextValue {
  const ctx = useContext(InfoContext);
  if (!ctx) {
    throw new Error('useInfo must be used within InfoProvider');
  }
  return ctx;
}
