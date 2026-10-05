import React, { createContext, useContext, useState } from 'react';

export type AudioQuality = 'Low (96kbps)' | 'Normal (160kbps)' | 'High (320kbps)' | 'Lossless Hi-Res (FLAC)';

interface PreferencesContextType {
  audioQuality: AudioQuality;
  setAudioQuality: (quality: AudioQuality) => void;
  crossfadeSeconds: number;
  setCrossfadeSeconds: (sec: number) => void;
  gaplessPlayback: boolean;
  setGaplessPlayback: (enabled: boolean) => void;
  dataSaver: boolean;
  setDataSaver: (enabled: boolean) => void;
  offlineCacheSizeMb: number;
  clearCache: () => void;
  providerStatus: {
    status: 'connected' | 'disconnected' | 'configuring';
    providerName: string;
    endpoint: string;
  };
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [audioQuality, setAudioQuality] = useState<AudioQuality>('High (320kbps)');
  const [crossfadeSeconds, setCrossfadeSeconds] = useState<number>(3);
  const [gaplessPlayback, setGaplessPlayback] = useState<boolean>(true);
  const [dataSaver, setDataSaver] = useState<boolean>(false);
  const [offlineCacheSizeMb, setOfflineCacheSizeMb] = useState<number>(248);

  const clearCache = () => {
    setOfflineCacheSizeMb(0);
  };

  const providerStatus = {
    status: 'connected' as const,
    providerName: 'Custom Private Provider (Modular)',
    endpoint: 'http://localhost:5000/api/v1',
  };

  return (
    <PreferencesContext.Provider
      value={{
        audioQuality,
        setAudioQuality,
        crossfadeSeconds,
        setCrossfadeSeconds,
        gaplessPlayback,
        setGaplessPlayback,
        dataSaver,
        setDataSaver,
        offlineCacheSizeMb,
        clearCache,
        providerStatus,
      }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
