"use client";

import React from 'react';
import { useBuilder } from '@/context/BuilderContext';

const availableModules = [
  { id: 'daily', name: 'Daily Pages' },
  { id: 'weekly', name: 'Weekly Spreads' },
  { id: 'monthly', name: 'Monthly Calendars' },
  { id: 'yearly', name: 'Yearly Overview' },
  { id: 'goals', name: 'Goal Trackers' },
  { id: 'notes', name: 'Notes Pages' },
];

const Step2 = () => {
  const { config, setConfig, goToNextStep, goToPrevStep } = useBuilder();

  const handleModuleToggle = (moduleId: string) => {
    setConfig((prev) => {
      const newModules = prev.modules.includes(moduleId)
        ? prev.modules.filter((id) => id !== moduleId)
        : [...prev.modules, moduleId];
      return { ...prev, modules: newModules };
    });
  };

  return (
    <div>
      <h2>Step 2: Modules & Content</h2>
      <div className="oia-form-group">
        <label>Select planner modules:</label>
        <div className="oia-checkbox-group">
          {availableModules.map((module) => (
            <label key={module.id} className="oia-checkbox-label">
              <input
                type="checkbox"
                className="oia-checkbox"
                checked={config.modules.includes(module.id)}
                onChange={() => handleModuleToggle(module.id)}
              />
              {module.name}
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

export default Step2;
