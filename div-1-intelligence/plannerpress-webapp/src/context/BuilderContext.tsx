"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of the planner configuration
interface PlannerConfig {
  title: string;
  dateRange: {
    start: string;
    end: string;
  };
  modules: string[];
  theme: string;
}

// Define the shape of the context
interface BuilderContextType {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  config: PlannerConfig;
  setConfig: React.Dispatch<React.SetStateAction<PlannerConfig>>;
  goToNextStep: () => void;
  goToPrevStep: () => void;
}

// Create the context
const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

// Initial state for the planner configuration
const initialConfig: PlannerConfig = {
  title: 'My Digital Planner',
  dateRange: { start: '', end: '' },
  modules: ['daily', 'weekly', 'monthly'],
  theme: 'default',
};

// Create the provider component
export const BuilderProvider = ({ children }: { children: ReactNode }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<PlannerConfig>(initialConfig);

  const goToNextStep = () => setStep((prev) => prev + 1);
  const goToPrevStep = () => setStep((prev) => (prev > 1 ? prev - 1 : 1));

  const value = {
    step,
    setStep,
    config,
    setConfig,
    goToNextStep,
    goToPrevStep,
  };

  return (
    <BuilderContext.Provider value={value}>
      {children}
    </BuilderContext.Provider>
  );
};

// Create a custom hook for easy context access
export const useBuilder = (): BuilderContextType => {
  const context = useContext(BuilderContext);
  if (context === undefined) {
    throw new Error('useBuilder must be used within a BuilderProvider');
  }
  return context;
};
