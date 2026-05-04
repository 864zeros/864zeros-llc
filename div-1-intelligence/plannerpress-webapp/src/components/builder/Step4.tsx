"use client";

import React from 'react';
import { useBuilder } from '@/context/BuilderContext';

const Step4 = () => {
  const { config, goToPrevStep } = useBuilder();

  const handleGenerate = () => {
    console.log('Generating planner with the following configuration:');
    console.log(JSON.stringify(config, null, 2));
    // In a real app, this would trigger the backend generation process
    alert('Check the console for the planner configuration! Generation logic would go here.');
  };

  return (
    <div>
      <h2>Step 4: Review & Generate</h2>
      <div className="oia-summary-list">
        <h4>Planner Title:</h4>
        <p>{config.title}</p>
        <h4>Date Range:</h4>
        <p>{config.dateRange.start} to {config.dateRange.end}</p>
        <h4>Selected Modules:</h4>
        <ul>
          {config.modules.map((mod) => (
            <li key={mod}>{mod}</li>
          ))}
        </ul>
        <h4>Theme:</h4>
        <p>{config.theme}</p>
      </div>
      <div className="oia-form-actions">
        <button className="oia-button oia-button--secondary" onClick={goToPrevStep}>
          Back
        </button>
        <button className="oia-button oia-button--primary" onClick={handleGenerate}>
          Generate Planner
        </button>
      </div>
    </div>
  );
};

export default Step4;
