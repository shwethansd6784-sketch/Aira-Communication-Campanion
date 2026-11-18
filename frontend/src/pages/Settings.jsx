// Settings.jsx - Application settings page

import React, { useState, useEffect } from 'react'
import { useSpeech } from '../hooks/useSpeech'
import useAppStore from '../store/appStore'
import { clearHistory } from '../utils/api'
import { checkBackendHealth } from '../utils/api'

export default function Settings() {
  const { availableVoices, femaleVoice } = useSpeech()
  const { 
    captionsEnabled, toggleCaptions,
    preferredVoice, speechRate, speechPitch,
    setVoiceSettings 
  } = useAppStore()
  
  const [backendStatus, setBackendStatus] = useState(null)
  const [checkingBackend, setCheckingBackend] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    checkHealth()
  }, [])

  const checkHealth = async () => {
    setCheckingBackend(true)
    try {
      const result = await checkBackendHealth()
      setBackendStatus(result)
    } catch (err) {
      setBackendStatus({ status: 'error', message: err.message })
    } finally {
      setCheckingBackend(false)
    }
  }

  const handleSaveVoiceSettings = (newSettings) => {
    setVoiceSettings(newSettings)
    setSavedMessage('Settings saved!')
    setTimeout(() => setSavedMessage(''), 2000)
  }

  const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'))

  return (
    <div style={{
      minHeight: '100vh',
      paddingTop: '80px',
      background: 'linear-gradient(180deg, #0f0a1e 0%, #1a1335 100%)',
      padding: '80px 1.5rem 3rem'
    }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', color: '#f1f0f7', fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            ⚙️ Settings
          </h1>
          <p style={{ color: '#9d99b8', fontSize: '0.9rem' }}>
            Customize your Aira experience
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Backend Status */}
          <div style={{
            background: 'rgba(35,26,64,0.8)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '20px',
            padding: '1.5rem'
          }}>
            <h2 style={{ color: '#a5b4fc', marginBottom: '1rem', fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem' }}>
              🖥️ Backend Server Status
            </h2>
            
            {checkingBackend ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#9d99b8' }}>
                <div className="spinner" />
                Checking backend...
              </div>
            ) : backendStatus ? (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: backendStatus.status === 'ok' 
                    ? 'rgba(16,185,129,0.1)' 
                    : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${backendStatus.status === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}>
                  <span style={{ fontSize: '1.2rem' }}>
                    {backendStatus.status === 'ok' ? '✅' : '❌'}
                  </span>
                  <div>
                    <div style={{ 
                      color: backendStatus.status === 'ok' ? '#6ee7b7' : '#fca5a5',
                      fontWeight: 500
                    }}>
                      {backendStatus.status === 'ok' ? 'Backend is running' : 'Backend not reachable'}
                    </div>
                    {backendStatus.status === 'ok' && (
                      <div style={{ color: '#9d99b8', fontSize: '0.82rem' }}>
                        Gemini AI: {backendStatus.hasApiKey ? '✅ Configured' : '⚠️ Not configured'}
                      </div>
                    )}
                    {backendStatus.status !== 'ok' && (
                      <div style={{ color: '#9d99b8', fontSize: '0.82rem' }}>
                        Run <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 4px', borderRadius: '3px' }}>npm start</code> in the backend folder
                      </div>
                    )}
                  </div>
                </div>
                
                {backendStatus.status === 'ok' && !backendStatus.hasApiKey && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: '10px',
                    color: '#fcd34d',
                    fontSize: '0.85rem'
                  }}>
                    <strong>⚠️ Gemini API key not configured.</strong><br />
                    To enable full AI conversations, add your free Gemini API key to <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 4px', borderRadius: '3px' }}>backend/.env</code>:
                    <br /><code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '3px', display: 'inline-block', marginTop: '4px' }}>GEMINI_API_KEY=your_key_here</code>
                    <br /><a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#fcd34d', textDecoration: 'underline' }}>
                      Get a free API key at aistudio.google.com →
                    </a>
                  </div>
                )}
              </div>
            ) : null}
            
            <button onClick={checkHealth} className="btn btn-secondary" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              🔄 Check Again
            </button>
          </div>

          {/* Voice Settings */}
          <div style={{
            background: 'rgba(35,26,64,0.8)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '20px',
            padding: '1.5rem'
          }}>
            <h2 style={{ color: '#a5b4fc', marginBottom: '0.5rem', fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem' }}>
              🎙️ Voice Settings
            </h2>
            <p style={{ color: '#6b6887', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              These settings control Aira's voice output. Voice availability depends on your browser and operating system.
            </p>

            {/* Current voice */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ color: '#9d99b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                Aira's Voice
              </label>
              {englishVoices.length === 0 ? (
                <div style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
                  ⚠️ No voices available in this browser. Try Chrome or Edge for the best experience.
                </div>
              ) : (
                <select
                  value={preferredVoice || femaleVoice?.name || ''}
                  onChange={e => handleSaveVoiceSettings({ preferredVoice: e.target.value })}
                  className="input"
                >
                  <option value="">Auto-select (recommended female voice)</option>
                  {englishVoices.map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang}) {voice.name === femaleVoice?.name ? '← Current' : ''}
                    </option>
                  ))}
                </select>
              )}
              {femaleVoice && (
                <p style={{ color: '#6b6887', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                  Currently using: <strong style={{ color: '#9d99b8' }}>{femaleVoice.name}</strong>
                  {femaleVoice.name.toLowerCase().includes('female') || 
                   ['samantha', 'zira', 'victoria', 'karen', 'moira'].some(n => femaleVoice.name.toLowerCase().includes(n))
                    ? ' ✅ Female voice'
                    : ' ℹ️ Note: Female voice availability depends on your OS'}
                </p>
              )}
            </div>

            {/* Speech Rate */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ color: '#9d99b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                Speech Speed: {speechRate}x
              </label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={speechRate}
                onChange={e => handleSaveVoiceSettings({ speechRate: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#6366f1' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b6887', fontSize: '0.75rem' }}>
                <span>Slower (0.5x)</span>
                <span>Normal (1.0x)</span>
                <span>Faster (1.5x)</span>
              </div>
            </div>

            {/* Speech Pitch */}
            <div>
              <label style={{ color: '#9d99b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                Voice Pitch: {speechPitch}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speechPitch}
                onChange={e => handleSaveVoiceSettings({ speechPitch: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#8b5cf6' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b6887', fontSize: '0.75rem' }}>
                <span>Lower (0.5)</span>
                <span>Normal (1.0)</span>
                <span>Higher (2.0)</span>
              </div>
            </div>
            
            {savedMessage && (
              <div style={{ color: '#6ee7b7', fontSize: '0.85rem', marginTop: '0.75rem' }}>✅ {savedMessage}</div>
            )}
          </div>

          {/* Display Settings */}
          <div style={{
            background: 'rgba(35,26,64,0.8)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '20px',
            padding: '1.5rem'
          }}>
            <h2 style={{ color: '#a5b4fc', marginBottom: '1.25rem', fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem' }}>
              🖥️ Display Settings
            </h2>

            {/* Captions toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#f1f0f7', fontWeight: 500 }}>Live Captions</div>
                <div style={{ color: '#6b6887', fontSize: '0.82rem' }}>
                  Show text captions during conversation
                </div>
              </div>
              <button
                onClick={toggleCaptions}
                style={{
                  width: '52px', height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  background: captionsEnabled ? '#6366f1' : 'rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{
                  width: '22px', height: '22px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: captionsEnabled ? '27px' : '3px',
                  transition: 'left 0.3s'
                }} />
              </button>
            </div>
          </div>

          {/* Privacy & Data */}
          <div style={{
            background: 'rgba(35,26,64,0.8)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '20px',
            padding: '1.5rem'
          }}>
            <h2 style={{ color: '#a5b4fc', marginBottom: '0.75rem', fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem' }}>
              🔒 Privacy & Data
            </h2>
            
            <div style={{ 
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <h4 style={{ color: '#a5b4fc', fontSize: '0.9rem', marginBottom: '0.5rem' }}>What Aira Stores:</h4>
              <ul style={{ color: '#9d99b8', fontSize: '0.82rem', lineHeight: 2, listStyle: 'none' }}>
                <li>✅ Practice session history (locally in SQLite database)</li>
                <li>✅ Your scores and progress statistics</li>
                <li>✅ Vocabulary words you save</li>
                <li>✅ Conversation text transcripts</li>
              </ul>
              <h4 style={{ color: '#a5b4fc', fontSize: '0.9rem', marginTop: '0.75rem', marginBottom: '0.5rem' }}>What Aira Does NOT Store:</h4>
              <ul style={{ color: '#9d99b8', fontSize: '0.82rem', lineHeight: 2, listStyle: 'none' }}>
                <li>❌ Audio recordings (voice is processed in real-time, not saved)</li>
                <li>❌ Personal information or account data</li>
                <li>❌ API keys (kept only in backend .env file)</li>
                <li>❌ Data on external servers (all local)</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={async () => {
                  if (window.confirm('Clear ALL practice history and progress data? This cannot be undone.')) {
                    try {
                      await clearHistory()
                      alert('History cleared successfully.')
                    } catch (e) {
                      alert('Could not clear history. Make sure the backend is running.')
                    }
                  }
                }}
                className="btn btn-danger"
                style={{ fontSize: '0.85rem' }}
              >
                🗑️ Clear Practice History
              </button>
              <button
                onClick={() => {
                  localStorage.clear()
                  window.location.reload()
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                🔄 Reset App Settings
              </button>
            </div>
          </div>

          {/* Browser Compatibility */}
          <div style={{
            background: 'rgba(35,26,64,0.8)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '20px',
            padding: '1.5rem'
          }}>
            <h2 style={{ color: '#a5b4fc', marginBottom: '1rem', fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem' }}>
              🌐 Browser Compatibility
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {[
                { 
                  feature: 'Speech Recognition (Microphone)', 
                  supported: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
                  note: 'Best in Chrome/Edge'
                },
                { 
                  feature: 'Speech Synthesis (Aira\'s Voice)', 
                  supported: !!window.speechSynthesis,
                  note: 'Supported in all modern browsers'
                },
                { 
                  feature: 'Female Voice Available', 
                  supported: !!(window.speechSynthesis && window.speechSynthesis.getVoices()?.length > 0),
                  note: 'Depends on your OS settings'
                },
              ].map(item => (
                <div key={item.feature} style={{
                  background: item.supported ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${item.supported ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  borderRadius: '10px',
                  padding: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <span>{item.supported ? '✅' : '❌'}</span>
                    <span style={{ color: '#f1f0f7', fontSize: '0.82rem', fontWeight: 500 }}>{item.feature}</span>
                  </div>
                  <div style={{ color: '#6b6887', fontSize: '0.75rem' }}>{item.note}</div>
                </div>
              ))}
            </div>
            <p style={{ color: '#6b6887', fontSize: '0.8rem', marginTop: '1rem' }}>
              💡 For the best experience, use <strong style={{ color: '#9d99b8' }}>Google Chrome</strong> or <strong style={{ color: '#9d99b8' }}>Microsoft Edge</strong>.
            </p>
          </div>

          {/* About */}
          <div style={{
            background: 'rgba(35,26,64,0.8)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '20px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✨</div>
            <h3 style={{ color: '#a5b4fc', fontFamily: 'Poppins, sans-serif', marginBottom: '0.5rem' }}>Aira v1.0</h3>
            <p style={{ color: '#9d99b8', fontSize: '0.85rem', lineHeight: 1.7, maxWidth: '400px', margin: '0 auto' }}>
              Your AI Female Communication Companion. Built to help you practice English 
              through realistic conversations, honest feedback, and measurable progress.
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['React', 'Node.js', 'Google Gemini', 'Web Speech API', 'SQLite'].map(tech => (
                <span key={tech} style={{
                  background: 'rgba(99,102,241,0.15)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99,102,241,0.25)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.75rem'
                }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
