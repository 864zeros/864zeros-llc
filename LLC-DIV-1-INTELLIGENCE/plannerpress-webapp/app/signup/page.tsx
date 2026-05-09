"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup, loading } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (email && password) {
      await signup(email, password);
    } else {
      alert('Please fill in both email and password.');
    }
  };

  return (
    <div className="oia-auth-container">
      <div className="oia-card oia-auth-card">
        <h1 className="oia-h2 oia-mb-md">Create Your Account</h1>
        <form className="oia-form" onSubmit={handleSubmit}>
          <div className="oia-form-group">
            <label htmlFor="email" className="oia-label">Email</label>
            <input
              type="email"
              id="email"
              className="oia-input"
              placeholder="your@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="oia-form-group oia-mt-md">
            <label htmlFor="password" className="oia-label">Password</label>
            <input
              type="password"
              id="password"
              className="oia-input"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="oia-btn oia-btn-primary oia-mt-lg" disabled={loading}>
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        <p className="oia-body-sm oia-mt-md">
          Already have an account? <Link href="/login" className="oia-link">Log In</Link>
        </p>
      </div>
    </div>
  );
}
