import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    z_score_threshold: 3.0,
    iqr_multiplier: 1.5,
    weight_zscore: 0.30,
    weight_iqr: 0.20,
    weight_velocity: 0.30,
    weight_deviation: 0.20,
    low_risk_max: 30,
    medium_risk_max: 60,
    high_risk_max: 80,
    critical_risk_min: 81
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const remote = await api.getSettings();
        if (remote) {
          setSettings(prev => ({ ...prev, ...remote }));
        }
      } catch (e) {
        // Fallback already handled
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saveSettings = async (newSettings) => {
    setSettings(newSettings);
    await api.updateSettings(newSettings);
  };

  const resetDefaults = async () => {
    const defaults = {
      z_score_threshold: 3.0,
      iqr_multiplier: 1.5,
      weight_zscore: 0.30,
      weight_iqr: 0.20,
      weight_velocity: 0.30,
      weight_deviation: 0.20,
      low_risk_max: 30,
      medium_risk_max: 60,
      high_risk_max: 80,
      critical_risk_min: 81
    };
    await saveSettings(defaults);
  };

  return (
    <SettingsContext.Provider value={{ settings, saveSettings, resetDefaults, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
