'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase-client';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;
        setMessage('Check your email for verification link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="auth-modal-overlay" 
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div 
        className="auth-modal"
        style={{
          background: 'var(--card-bg)',
          borderRadius: '15px',
          padding: '30px',
          width: '90%',
          maxWidth: '400px',
          border: '1px solid var(--card-border)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div className="auth-modal-header">
          <h2 style={{ 
            margin: '0 0 20px 0', 
            color: 'var(--text-primary)',
            textAlign: 'center'
          }}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'none',
              border: 'none',
              fontSize: '1.2rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={isSignUp}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                }}
              />
            </div>
          )}
          
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '14px',
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '14px',
              }}
            />
          </div>

          {message && (
            <div style={{ 
              marginBottom: '15px', 
              padding: '10px',
              background: message.includes('error') ? 'var(--error-bg)' : 'var(--success-bg)',
              color: message.includes('error') ? 'var(--error-color)' : 'var(--success-color)',
              borderRadius: '8px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--button-bg)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              marginBottom: '15px',
            }}
          >
            {isLoading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : isSignUp ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>

          <div style={{ textAlign: 'center' }}>
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}