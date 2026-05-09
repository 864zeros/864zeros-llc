"use client";

import React from 'react';
import { useBuilder } from '@/context/BuilderContext';

const Step1 = () => {
  const { config, setConfig, goToNextStep } = useBuilder();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'startDate' || name === 'endDate') {
      setConfig((prev) => ({
        ...prev,
        dateRange: { ...prev.dateRange, [name === 'startDate' ? 'start' : 'end']: value },
      }));
    } else {
      setConfig((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div>
      <h2>Step 1: Planner Details</h2>
      <div className="oia-form-group">
        <label htmlFor="title">Planner Title</label>
        <input
          type="text"
          id="title"
          name="title"
          className="oia-input"
          value={config.title}
          onChange={handleChange}
        />
      </div>
      <div className="oia-form-group">
        <label htmlFor="startDate">Start Date</label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          className="oia-input"
          value={config.dateRange.start}
          onChange={handleChange}
        />
      </div>
      <div className="oia-form-group">
        <label htmlFor="endDate">End Date</label>
        <input
          type="date"
          id="endDate"
          name="endDate"
          className="oia-input"
          value={config.dateRange.end}
          onChange={handleChange}
        />
      </div>
      <div className="oia-form-actions">
        <button className="oia-button" onClick={goToNextStep}>
          Next Step
        </button>
      </div>
    </div>
  );
};

export default Step1;
