// Home.jsx - The main landing page of Aira
// This is the first screen users see - they select their situation, mode, and difficulty here

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SITUATIONS, MODES, DIFFICULTIES } from '../utils/aiPrompts'
import useAppStore from '../store/appStore'
import AiraAvatar from '../components/Avatar/AiraAvatar'

export default function Home() {
  const navigate = useNavigate()
  const { 
    selectedSituation, setSituation,
    selectedMode, setMode,
    selectedDifficulty, setDifficulty 
  } = useAppStore()

  const [step, setStep] = useState(1) // 1=situation, 2=mode, 3=difficulty

  const handleStartConversation = () => {
    if (selectedMode === 'learn') {
      navigate('/learn')
    } else {
      navigate('/conversation')
    }
  }

  const handleSituationSelect = (id) => {
    setSituation(id)
    setStep(2)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      paddingTop: '80px',
      background: 'linear-gradient(180deg, #0f0a1e 0%, #1a1335 100%)'
    }}>
      {/* Hero Section */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '3rem 1.5rem 2rem',
        gap: '1rem'
      }}>
        {/* Avatar Preview */}
        <div style={{ 
          width: '180px', 
          height: '240px', 
          position: 'relative',
          marginBottom: '0.5rem'
        }}>
          <AiraAvatar size="medium" />
        </div>

        <div>
          <h1 style={{ 
            fontFamily: 'Poppins, sans-serif',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)', 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.2,
            marginBottom: '0.75rem'
          }}>
            Hi, I'm Aira! ✨
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', 
            color: '#9d99b8',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            Your AI female communication companion. Practice English through realistic conversations 
            and become a confident communicator.
          </p>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
          {[
            { label: '5 Situations', emoji: '🎭' },
            { label: '3 Modes', emoji: '📚' },
            { label: 'AI Feedback', emoji: '🤖' },
            { label: 'Voice Chat', emoji: '🎙️' },
          ].map(item => (
            <div key={item.label} style={{ 
              display: 'flex', alignItems: 'center', gap: '6px',
              color: '#6b6887', fontSize: '0.875rem' 
            }}>
              <span>{item.emoji}</span> {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* Main Selection Panel */}
      <div style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '0 1.5rem 4rem' 
      }}>
        
        {/* Step Indicator */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {[
            { n: 1, label: 'Choose Situation' },
            { n: 2, label: 'Select Mode' },
            { n: 3, label: 'Set Difficulty' },
          ].map((s, idx) => (
            <React.Fragment key={s.n}>
              <button
                onClick={() => setStep(s.n)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  background: step === s.n 
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : step > s.n 
                    ? 'rgba(99,102,241,0.2)'
                    : 'rgba(255,255,255,0.05)',
                  color: step >= s.n ? '#fff' : '#6b6887',
                  transition: 'all 0.3s',
                }}
              >
                <span style={{
                  width: '20px', height: '20px',
                  borderRadius: '50%',
                  background: step > s.n ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700
                }}>
                  {step > s.n ? '✓' : s.n}
                </span>
                {s.label}
              </button>
              {idx < 2 && (
                <div style={{ width: '24px', height: '1px', background: 'rgba(99,102,241,0.3)' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1: Choose Situation */}
        {step === 1 && (
          <div style={{ animation: 'slideInUp 0.4s ease' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#a5b4fc', fontSize: '1.3rem' }}>
              What would you like to practice today?
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {Object.values(SITUATIONS).map(sit => (
                <button
                  key={sit.id}
                  onClick={() => handleSituationSelect(sit.id)}
                  style={{
                    background: selectedSituation === sit.id 
                      ? sit.bgGradient
                      : 'rgba(35,26,64,0.8)',
                    border: `2px solid ${selectedSituation === sit.id ? sit.color : 'rgba(99,102,241,0.2)'}`,
                    borderRadius: '20px',
                    padding: '1.5rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    transform: selectedSituation === sit.id ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: selectedSituation === sit.id ? `0 8px 30px ${sit.color}40` : 'none',
                  }}
                  onMouseEnter={e => { 
                    if (selectedSituation !== sit.id) {
                      e.currentTarget.style.borderColor = sit.color + '60'
                      e.currentTarget.style.transform = 'scale(1.01)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (selectedSituation !== sit.id) {
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'
                      e.currentTarget.style.transform = 'scale(1)'
                    }
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{sit.emoji}</div>
                  <h3 style={{ 
                    color: '#f1f0f7', fontFamily: 'Poppins, sans-serif',
                    fontSize: '1.1rem', marginBottom: '0.4rem' 
                  }}>
                    {sit.name}
                  </h3>
                  <p style={{ color: '#9d99b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {sit.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {sit.topics.slice(0, 3).map(topic => (
                      <span key={topic} style={{
                        background: `${sit.color}20`,
                        color: sit.color,
                        border: `1px solid ${sit.color}40`,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        fontSize: '0.7rem'
                      }}>
                        {topic}
                      </span>
                    ))}
                    {sit.topics.length > 3 && (
                      <span style={{ color: '#6b6887', fontSize: '0.7rem', padding: '2px 4px' }}>
                        +{sit.topics.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selectedSituation && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setStep(2)}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
                >
                  Next: Choose Mode →
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Select Mode */}
        {step === 2 && (
          <div style={{ animation: 'slideInUp 0.4s ease' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#a5b4fc', fontSize: '1.3rem' }}>
              How would you like to practice?
            </h2>
            <p style={{ textAlign: 'center', color: '#6b6887', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              For <strong style={{ color: '#a5b4fc' }}>{SITUATIONS[selectedSituation]?.name}</strong>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {Object.values(MODES).map(mode => (
                <button
                  key={mode.id}
                  onClick={() => { setMode(mode.id); setStep(3) }}
                  style={{
                    background: selectedMode === mode.id
                      ? `linear-gradient(135deg, ${mode.color}30, ${mode.color}15)`
                      : 'rgba(35,26,64,0.8)',
                    border: `2px solid ${selectedMode === mode.id ? mode.color : 'rgba(99,102,241,0.2)'}`,
                    borderRadius: '20px',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    transform: selectedMode === mode.id ? 'scale(1.03)' : 'scale(1)',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{mode.emoji}</div>
                  <h3 style={{ color: '#f1f0f7', fontFamily: 'Poppins, sans-serif', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    {mode.name}
                  </h3>
                  <p style={{ color: '#9d99b8', fontSize: '0.85rem' }}>{mode.description}</p>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <button onClick={() => setStep(1)} className="btn btn-secondary">← Back</button>
              {selectedMode && (
                <button onClick={() => setStep(3)} className="btn btn-primary">
                  Next: Set Difficulty →
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Set Difficulty */}
        {step === 3 && (
          <div style={{ animation: 'slideInUp 0.4s ease' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#a5b4fc', fontSize: '1.3rem' }}>
              Choose your difficulty level
            </h2>
            <p style={{ textAlign: 'center', color: '#6b6887', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              You can change this anytime during practice
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxWidth: '700px', margin: '0 auto' }}>
              {Object.values(DIFFICULTIES).map(diff => (
                <button
                  key={diff.id}
                  onClick={() => setDifficulty(diff.id)}
                  style={{
                    background: selectedDifficulty === diff.id
                      ? `linear-gradient(135deg, ${diff.color}30, ${diff.color}15)`
                      : 'rgba(35,26,64,0.8)',
                    border: `2px solid ${selectedDifficulty === diff.id ? diff.color : 'rgba(99,102,241,0.2)'}`,
                    borderRadius: '20px',
                    padding: '1.75rem 1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    transform: selectedDifficulty === diff.id ? 'scale(1.03)' : 'scale(1)',
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{diff.emoji}</div>
                  <h3 style={{ color: '#f1f0f7', fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem', marginBottom: '0.4rem' }}>
                    {diff.name}
                  </h3>
                  <p style={{ color: '#9d99b8', fontSize: '0.82rem' }}>{diff.description}</p>
                </button>
              ))}
            </div>

            {/* Summary and Start */}
            <div style={{ 
              maxWidth: '700px', 
              margin: '1.5rem auto 0',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
            }}>
              <h4 style={{ color: '#a5b4fc', marginBottom: '0.75rem', fontFamily: 'Poppins, sans-serif' }}>
                📋 Your Selection Summary
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ color: '#6b6887', fontSize: '0.8rem' }}>Situation</span>
                  <div style={{ color: '#f1f0f7', fontWeight: 500 }}>
                    {SITUATIONS[selectedSituation]?.emoji} {SITUATIONS[selectedSituation]?.name}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#6b6887', fontSize: '0.8rem' }}>Mode</span>
                  <div style={{ color: '#f1f0f7', fontWeight: 500 }}>
                    {MODES[selectedMode]?.emoji} {MODES[selectedMode]?.name}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#6b6887', fontSize: '0.8rem' }}>Difficulty</span>
                  <div style={{ color: '#f1f0f7', fontWeight: 500 }}>
                    {DIFFICULTIES[selectedDifficulty]?.emoji} {DIFFICULTIES[selectedDifficulty]?.name}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '700px', margin: '1.5rem auto 0' }}>
              <button onClick={() => setStep(2)} className="btn btn-secondary">← Back</button>
              <button
                onClick={handleStartConversation}
                className="btn btn-primary"
                disabled={!selectedSituation || !selectedMode || !selectedDifficulty}
                style={{ 
                  padding: '0.85rem 2.5rem', 
                  fontSize: '1.05rem',
                  boxShadow: '0 6px 25px rgba(99,102,241,0.5)'
                }}
              >
                {selectedMode === 'learn' ? '📚 Start Learning' : '🎙️ Start Conversation'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
