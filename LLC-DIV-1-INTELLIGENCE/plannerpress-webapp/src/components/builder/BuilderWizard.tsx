"use client";

import React from 'react';
import { useBuilder } from '@/context/BuilderContext';

// Import step components
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';

const BuilderWizard = () => {
  const { step } = useBuilder();

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      case 3:
        return <Step3 />;
      case 4:
        return <Step4 />;
      default:
        return <Step1 />;
    }
  };

  return (
    <div>
      {/* We can add a progress bar here later */}
      <div className="wizard-content">
        {renderStep()}
      </div>
    </div>
  );
};

export default BuilderWizard;
