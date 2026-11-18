// AiraAvatar.jsx - The 3D/2D avatar component
// 
// ABOUT THE AVATAR:
// We use a beautiful 2D SVG avatar as the base, with CSS animations for:
// - Eye blinking (CSS animation)
// - Head subtle movement (CSS animation)  
// - Lip sync (CSS animation while speaking)
// - Expression changes (happy, thinking, speaking, neutral)
//
// WHY NOT FULL 3D?
// A truly realistic 3D avatar with real-time lip sync requires either:
// 1. Paid services (HeyGen, D-ID) - not allowed per requirements
// 2. Ready Player Me GLB + morph targets - requires complex setup and may fail offline
// 
// Our approach: Beautiful 2D animated SVG avatar + Three.js background scene
// This gives a great experience without dependencies on external paid services

import React, { useEffect, useRef, useState } from 'react'
import useAppStore from '../../store/appStore'
import './Avatar.css'

// SVG Avatar Component - A beautiful animated female character
function AiraSVGAvatar({ expression, isSpeaking, isListening }) {
  const eyeLeftRef = useRef(null)
  const eyeRightRef = useRef(null)
  const mouthRef = useRef(null)
  const headRef = useRef(null)
  const blinkInterval = useRef(null)
  const headMoveInterval = useRef(null)

  // Mouth shapes for different expressions
  const mouthPaths = {
    neutral: "M 85 162 Q 110 172 135 162",
    happy: "M 82 158 Q 110 178 138 158",
    speaking0: "M 88 160 Q 110 168 132 160",
    speaking1: "M 86 158 Q 110 174 134 158",
    speaking2: "M 90 160 Q 110 166 130 160",
    thinking: "M 90 164 Q 108 162 128 164",
    worried: "M 88 166 Q 110 158 132 166",
  }

  // Eye colors and expressions
  const eyeExpressions = {
    neutral: { brow: "M 78 108 Q 95 102 108 106", browR: "M 112 106 Q 125 102 142 108" },
    happy: { brow: "M 78 104 Q 95 98 108 102", browR: "M 112 102 Q 125 98 142 104" },
    thinking: { brow: "M 78 108 Q 95 100 108 106", browR: "M 112 108 Q 125 102 142 104" },
    speaking: { brow: "M 78 106 Q 95 100 108 104", browR: "M 112 104 Q 125 100 142 106" },
  }

  const currentExpression = expression || 'neutral'

  return (
    <div className="avatar-body">
      <div className="avatar-glow" />
      <svg
        ref={headRef}
        viewBox="0 0 220 380"
        className="avatar-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Skin gradient */}
          <radialGradient id="skinGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f9d9c0" />
            <stop offset="100%" stopColor="#e8b898" />
          </radialGradient>
          
          {/* Hair gradient */}
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2d1b6b" />
            <stop offset="50%" stopColor="#4a2d9c" />
            <stop offset="100%" stopColor="#6b3fa0" />
          </linearGradient>
          
          {/* Top glow effect */}
          <radialGradient id="topGlow" cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.3)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0)" />
          </radialGradient>
          
          {/* Cloth gradient */}
          <linearGradient id="clothGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          
          {/* Clip for face */}
          <clipPath id="faceClip">
            <ellipse cx="110" cy="135" rx="62" ry="72" />
          </clipPath>
          
          {/* Filter for soft shadow */}
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.3)" />
          </filter>
        </defs>

        {/* === BODY / SHOULDERS === */}
        <ellipse cx="110" cy="340" rx="75" ry="60" fill="url(#clothGrad)" opacity="0.9" />
        
        {/* Collar */}
        <path d="M 68 290 Q 110 320 152 290 L 152 300 Q 110 328 68 300 Z" fill="#4f46e5" />
        
        {/* Neck */}
        <rect x="94" y="195" width="32" height="45" rx="8" fill="url(#skinGrad)" />
        
        {/* === HAIR (back) === */}
        <ellipse cx="110" cy="118" rx="68" ry="75" fill="url(#hairGrad)" />
        
        {/* Long hair strands */}
        <path d="M 42 130 Q 30 180 35 240 Q 38 260 50 250 Q 45 200 55 160 Z" fill="url(#hairGrad)" />
        <path d="M 178 130 Q 190 180 185 240 Q 182 260 170 250 Q 175 200 165 160 Z" fill="url(#hairGrad)" />
        
        {/* === FACE === */}
        <ellipse cx="110" cy="140" rx="62" ry="68" fill="url(#skinGrad)" filter="url(#softShadow)" />
        
        {/* Cheek blush */}
        <ellipse cx="75" cy="158" rx="18" ry="10" fill="rgba(255,150,150,0.2)" />
        <ellipse cx="145" cy="158" rx="18" ry="10" fill="rgba(255,150,150,0.2)" />
        
        {/* === EYEBROWS === */}
        <path 
          d={eyeExpressions[currentExpression === 'speaking' ? 'speaking' : currentExpression]?.brow || eyeExpressions.neutral.brow}
          stroke="#3d2563" 
          strokeWidth="3" 
          strokeLinecap="round" 
          fill="none"
          style={{ transition: 'd 0.3s ease' }}
        />
        <path 
          d={eyeExpressions[currentExpression === 'speaking' ? 'speaking' : currentExpression]?.browR || eyeExpressions.neutral.browR}
          stroke="#3d2563" 
          strokeWidth="3" 
          strokeLinecap="round" 
          fill="none"
          style={{ transition: 'd 0.3s ease' }}
        />
        
        {/* === EYES === */}
        {/* Eye whites */}
        <ellipse cx="92" cy="130" rx="17" ry="13" fill="white" />
        <ellipse cx="128" cy="130" rx="17" ry="13" fill="white" />
        
        {/* Iris - left eye */}
        <g className="avatar-eye-left" style={{ transformOrigin: '92px 130px' }}>
          <ellipse cx="92" cy="130" rx="10" ry="12" fill="#6366f1" />
          <ellipse cx="92" cy="130" rx="6" ry="8" fill="#2d1b6b" />
          <circle cx="96" cy="126" r="3" fill="white" opacity="0.8" />
          <circle cx="90" cy="132" r="1.5" fill="white" opacity="0.4" />
        </g>
        
        {/* Iris - right eye */}
        <g className="avatar-eye-right" style={{ transformOrigin: '128px 130px' }}>
          <ellipse cx="128" cy="130" rx="10" ry="12" fill="#6366f1" />
          <ellipse cx="128" cy="130" rx="6" ry="8" fill="#2d1b6b" />
          <circle cx="132" cy="126" r="3" fill="white" opacity="0.8" />
          <circle cx="126" cy="132" r="1.5" fill="white" opacity="0.4" />
        </g>
        
        {/* Eyelashes */}
        <path d="M 75 118 Q 92 110 109 118" stroke="#2d1b6b" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 111 118 Q 128 110 145 118" stroke="#2d1b6b" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* === NOSE === */}
        <path d="M 108 148 Q 104 162 110 166 Q 116 162 112 148" stroke="#d4956a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        
        {/* === MOUTH === */}
        <g ref={mouthRef}>
          {/* Lip shadow */}
          <path 
            d={isSpeaking 
              ? (Math.sin(Date.now() / 100) > 0 ? mouthPaths.speaking0 : mouthPaths.speaking1)
              : mouthPaths[currentExpression] || mouthPaths.neutral
            }
            stroke="#c47c5a" 
            strokeWidth="2.5" 
            fill="none"
            strokeLinecap="round"
            style={{ transition: 'd 0.1s ease' }}
          />
          {/* Upper lip */}
          <path 
            d="M 88 160 Q 99 155 110 157 Q 121 155 132 160"
            stroke="#d4876a" 
            strokeWidth="1.5" 
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
        </g>
        
        {/* Lip color fill for smile */}
        {currentExpression === 'happy' && (
          <path d="M 82 158 Q 110 178 138 158 Q 110 168 82 158" fill="rgba(220,120,120,0.3)" />
        )}
        
        {/* === HAIR (front) === */}
        {/* Top hair */}
        <path d="M 48 115 Q 60 55 110 48 Q 160 55 172 115 Q 155 85 110 80 Q 65 85 48 115 Z" fill="url(#hairGrad)" />
        
        {/* Hair parting and front strands */}
        <path d="M 110 48 Q 108 70 105 90 Q 102 100 98 108" stroke="#4a2d9c" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />
        
        {/* Side hair pieces */}
        <path d="M 48 115 Q 40 140 45 165 Q 50 155 55 140 Q 52 130 55 115 Z" fill="url(#hairGrad)" opacity="0.9" />
        <path d="M 172 115 Q 180 140 175 165 Q 170 155 165 140 Q 168 130 165 115 Z" fill="url(#hairGrad)" opacity="0.9" />
        
        {/* Hair highlight */}
        <path d="M 85 55 Q 100 45 115 50" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* === ACCESSORIES === */}
        {/* Small earrings */}
        <circle cx="47" cy="162" r="6" fill="#c0a0ff" stroke="#8b5cf6" strokeWidth="1" />
        <circle cx="47" cy="162" r="3" fill="#6366f1" />
        <circle cx="173" cy="162" r="6" fill="#c0a0ff" stroke="#8b5cf6" strokeWidth="1" />
        <circle cx="173" cy="162" r="3" fill="#6366f1" />
        
        {/* AI circuit detail on forehead - subtle */}
        <path d="M 95 72 Q 100 68 105 72" stroke="rgba(99,102,241,0.3)" strokeWidth="1" fill="none" />
        <circle cx="95" cy="72" r="2" fill="rgba(99,102,241,0.4)" />
        
        {/* Sparkle effects */}
        <g opacity="0.6">
          <circle cx="38" cy="85" r="2" fill="#a5b4fc" />
          <circle cx="182" cy="90" r="1.5" fill="#c4b5fd" />
          <circle cx="30" cy="140" r="1" fill="#818cf8" />
        </g>
        
        {/* Top glow overlay */}
        <ellipse cx="110" cy="80" rx="80" ry="50" fill="url(#topGlow)" opacity="0.4" />
      </svg>
      
      {/* Speaking animation bars */}
      {isSpeaking && (
        <div className="speaking-indicator">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="speaking-bar" style={{ animationDelay: `${(i-1)*0.1}s` }} />
          ))}
        </div>
      )}
    </div>
  )
}

// Main Avatar Component
export default function AiraAvatar({ size = 'large' }) {
  const { avatarExpression, airaIsSpeaking, isListening } = useAppStore()
  const [currentMouthFrame, setCurrentMouthFrame] = useState(0)
  const mouthAnimRef = useRef(null)
  
  // Animate mouth while speaking
  useEffect(() => {
    if (airaIsSpeaking) {
      mouthAnimRef.current = setInterval(() => {
        setCurrentMouthFrame(f => (f + 1) % 3)
      }, 120)
    } else {
      clearInterval(mouthAnimRef.current)
      setCurrentMouthFrame(0)
    }
    return () => clearInterval(mouthAnimRef.current)
  }, [airaIsSpeaking])

  // Determine status text
  const getStatus = () => {
    if (airaIsSpeaking) return { text: 'Aira is speaking', className: 'speaking' }
    if (isListening) return { text: 'Listening...', className: 'listening' }
    return { text: 'Ready', className: 'idle' }
  }
  
  const status = getStatus()

  return (
    <div className="avatar-container">
      {/* Status indicator badge */}
      <div className={`avatar-status ${status.className}`}>
        <div className="status-dot" />
        {status.text}
      </div>
      
      {/* The avatar */}
      <div className="avatar-2d">
        <AiraSVGAvatar 
          expression={airaIsSpeaking ? 'speaking' : avatarExpression}
          isSpeaking={airaIsSpeaking}
          isListening={isListening}
          mouthFrame={currentMouthFrame}
        />
      </div>
    </div>
  )
}
