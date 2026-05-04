"use client";

import React from 'react';
import BuilderWizard from '@/components/builder/BuilderWizard';

const BuilderPage = () => {
  return (
    <div className="oia-container">
      <header className="oia-header">
        <h1>Planner Builder</h1>
        <p>Create your custom digital planner in a few simple steps.</p>
      </header>
      <div className="oia-card">
        <BuilderWizard />
      </div>
    </div>
  );
};

export default BuilderPage;