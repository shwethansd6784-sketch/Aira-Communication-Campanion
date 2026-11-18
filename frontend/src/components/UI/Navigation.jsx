// Navigation.jsx - Top navigation bar shown on all pages

import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/dashboard', label: 'Progress', icon: '📊' },
  { path: '/vocabulary', label: 'Vocabulary', icon: '📖' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Navigation() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(15, 10, 30, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(99,102,241,0.15)',
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(99,102,241,0.4)'
        }}>✨</div>
        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#f1f0f7' }}>
          Aira
        </span>
        <span style={{ fontSize: '0.7rem', color: '#9d99b8', background: 'rgba(99,102,241,0.2)', padding: '2px 8px', borderRadius: '20px' }}>
          AI Companion
        </span>
      </Link>

      {/* Desktop Nav Links */}
      <div style={{ display: 'flex', gap: '0.25rem' }} className="desktop-nav">
        {navLinks.map(link => (
          <Link
            key={link.path}
            to={link.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s',
              background: location.pathname === link.path 
                ? 'rgba(99,102,241,0.2)' 
                : 'transparent',
              color: location.pathname === link.path 
                ? '#a5b4fc' 
                : '#9d99b8',
              border: location.pathname === link.path 
                ? '1px solid rgba(99,102,241,0.3)' 
                : '1px solid transparent',
            }}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>

      {/* Hamburger for mobile */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          color: '#9d99b8',
          fontSize: '1.5rem',
          cursor: 'pointer',
        }}
        className="hamburger"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          background: 'rgba(15,10,30,0.98)',
          borderBottom: '1px solid rgba(99,102,241,0.2)',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          zIndex: 99,
        }}>
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                background: location.pathname === link.path 
                  ? 'rgba(99,102,241,0.2)' 
                  : 'rgba(255,255,255,0.03)',
                color: location.pathname === link.path ? '#a5b4fc' : '#9d99b8',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: block !important; }
        }
      `}</style>
    </nav>
  )
}
