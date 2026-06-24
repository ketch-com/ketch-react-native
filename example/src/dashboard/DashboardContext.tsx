import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';

export interface DashboardState {
  initState: string;
  statusText: string;
  loadState: string;
  experienceVisibility: string;
  dismissReason: string;
  webViewVisible: string;
  environment: string;
  jurisdiction: string;
  region: string;
  consent: string;
  usPrivacy: string;
  tcf: string;
  gpp: string;
  attStatus: string;
  ketchAtt: string;
  ketchAttPrev: string;
  eventLog: string[];
}

const initialState: DashboardState = {
  initState: 'Initialized',
  statusText: 'Ketch initialized',
  loadState: 'idle',
  experienceVisibility: 'hidden',
  dismissReason: '—',
  webViewVisible: 'unknown',
  environment: 'Not set',
  jurisdiction: 'Not set',
  region: 'Not set',
  consent: 'Not set',
  usPrivacy: 'Not set',
  tcf: 'Not set',
  gpp: 'Not set',
  attStatus: 'N/A',
  ketchAtt: '—',
  ketchAttPrev: '—',
  eventLog: [],
};

interface DashboardContextValue {
  dashboard: DashboardState;
  appendLog: (message: string) => void;
  setStatus: (message: string) => void;
  updateDashboard: (patch: Partial<DashboardState>) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

function timestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {hour12: false});
}

export function DashboardProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [dashboard, setDashboard] = useState<DashboardState>(initialState);

  const appendLog = useCallback((message: string) => {
    setDashboard(prev => {
      const line = `[${timestamp()}] ${message}`;
      const eventLog = [...prev.eventLog, line].slice(-50);
      return {...prev, eventLog};
    });
  }, []);

  const setStatus = useCallback(
    (message: string) => {
      appendLog(message);
      setDashboard(prev => ({...prev, statusText: message}));
    },
    [appendLog],
  );

  const updateDashboard = useCallback((patch: Partial<DashboardState>) => {
    setDashboard(prev => ({...prev, ...patch}));
  }, []);

  const value = useMemo(
    () => ({dashboard, appendLog, setStatus, updateDashboard}),
    [dashboard, appendLog, setStatus, updateDashboard],
  );

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return ctx;
}

export function truncate(value: string, max = 80): string {
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}
