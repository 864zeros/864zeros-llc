"use client";

import React from 'react';
import { useBuilder } from '@/context/BuilderContext';

const availableThemes = [
  { id: 'default', name: 'Minimalist' },
  { id: 'floral', name: 'Floral' },
  { id: 'professional', name: 'Professional' },
  { id: 'dark', name: 'Dark Mode' },
];

const Step3 = () => {
  const { config, setConfig, goToNextStep, goToPrevStep } = useBuilder();

  const handleThemeChange = (themeId: string) => {
    setConfig((prev) => ({ ...prev, theme: themeId }));
  };

  return (
    <div>
      <h2>Step 3: Theme & Branding</h2>
      <div className="oia-form-group">
        <label>Select a theme:</label>
        <div className="oia-radio-group">
          {availableThemes.map((theme) => (
            <label key={theme.id} className="oia-radio-label">
              <input
                type="radio"
                name="theme"
                className="oia-radio"
                value={theme.id}
                checked={config.theme === theme.id}
                onChange={() => handleThemeChange(theme.id)}
              />
              {theme.name}
            </label>
          ))}
        </div>
      </div>
      <div className="oia-form-actions">
        <button className="oia-button oia-button--secondary" onClick={goToPrevStep}>
          Back
        </button>
        <button className="oia-button" onClick={goToNextStep}>
          Next Step
        </button>
      </div>
    </div>
  );
};

export default Step3;
