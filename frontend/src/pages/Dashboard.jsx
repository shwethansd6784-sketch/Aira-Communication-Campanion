// Dashboard.jsx - Progress tracking dashboard
// Shows all practice statistics, charts, and session history

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboard, clearHistory } from '../utils/api'
import { SITUATIONS } from '../utils/aiPrompts'

// Simple bar chart component (no external library needed)
function SimpleBarChart({ data, label, color = '#6366f1' }) {
  if (!data || data.length === 0) return (
    <div style={{ color: '#6b6887', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>
      No data yet. Complete practice sessions to see your progress here.
    </div>
  )
  
  const maxVal = Math.max(...data.map(d => d.value || 0), 1)
  
  return (
    <div style={{ padding: '0.5rem 0' }}>
      {data.map((item, i) => (
        <div key={i} style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span style={{ color: '#9d99b8', fontSize: '0.8rem' }}>{item.label}</span>
            <span style={{ color: '#f1f0f7', fontSize: '0.8rem', fontWeight: 600 }}>{item.value}{label}</span>
          </div>
          <div style={{ 
            height: '8px', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              height: '100%',
              width: `${(item.value / maxVal) * 100}%`,
              background: `linear-gradient(90deg, ${color}, ${color}80)`,
              borderRadius: '4px',
              transition: 'width 1s ease'
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Score circle component
function ScoreCircle({ score, label, color = '#6366f1' }) {
  const displayScore = score ? Math.round(score) : 0
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        width: '80px', height: '80px',
        borderRadius: '50%',
        background: `conic-gradient(${color} ${displayScore * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 0.5rem',
        position: 'relative'
      }}>
        <div style={{ 
          width: '64px', height: '64px',
          borderRadius: '50%',
          background: '#1a1335',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{ color: '#f1f0f7', fontWeight: 700, fontSize: '1.1rem' }}>{displayScore}</span>
        </div>
      </div>
      <div style={{ color: '#9d99b8', fontSize: '0.78rem' }}>{label}</div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const result = await getDashboard()
      setData(result)
    } catch (err) {
      setError('Could not load dashboard. Make sure the backend server is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = async () => {
    try {
      await clearHistory()
      setShowClearConfirm(false)
      loadDashboard()
    } catch (err) {
      alert('Failed to clear history')
    }
  }

  const formatTime = (seconds) => {
    if (!seconds) return '0 min'
    const mins = Math.round(seconds / 60)
    if (mins < 60) return `${mins} min`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      paddingTop: '80px',
      background: 'linear-gradient(180deg, #0f0a1e 0%, #1a1335 100%)',
      padding: '80px 1.5rem 3rem'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', color: '#f1f0f7', fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              📊 Progress Dashboard
            </h1>
            <p style={{ color: '#9d99b8', fontSize: '0.9rem' }}>
              Track your English communication improvement over time
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => navigate('/conversation')} className="btn btn-primary">
              🎙️ Practice Now
            </button>
            <button onClick={() => setShowClearConfirm(true)} className="btn btn-danger" style={{ fontSize: '0.8rem' }}>
              🗑️ Clear Data
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
            <p style={{ color: '#fca5a5' }}>{error}</p>
            <p style={{ color: '#9d99b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Make sure to run <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>npm start</code> in the backend folder
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9d99b8' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Loading your progress data...</p>
          </div>
        )}

        {/* No data yet */}
        {!loading && !error && data?.overall?.totalSessions === 0 && (
          <div style={{
            background: 'rgba(35,26,64,0.8)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '24px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌱</div>
            <h2 style={{ color: '#a5b4fc', fontFamily: 'Poppins, sans-serif', marginBottom: '0.75rem' }}>
              No Practice Sessions Yet
            </h2>
            <p style={{ color: '#9d99b8', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              Complete at least one practice session to see your progress tracked here. 
              Your scores, time, and improvements will all be visible.
            </p>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              🎙️ Start Your First Session
            </button>
          </div>
        )}

        {/* Dashboard data */}
        {!loading && !error && data && data.overall?.totalSessions > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Overview cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Total Sessions', value: data.overall?.totalSessions || 0, emoji: '📅', color: '#6366f1' },
                { label: 'Practice Time', value: formatTime(data.overall?.totalSeconds), emoji: '⏱️', color: '#10b981' },
                { label: 'Overall Score', value: `${Math.round(data.overall?.avgOverallScore || 0)}%`, emoji: '⭐', color: '#f59e0b' },
                { label: 'Words Saved', value: data.vocabCount || 0, emoji: '📖', color: '#8b5cf6' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'rgba(35,26,64,0.8)',
                  border: `1px solid ${stat.color}30`,
                  borderRadius: '16px',
                  padding: '1.25rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.emoji}</div>
                  <div style={{ color: stat.color, fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>
                    {stat.value}
                  </div>
                  <div style={{ color: '#9d99b8', fontSize: '0.78rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Score breakdown */}
            <div style={{
              background: 'rgba(35,26,64,0.8)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '20px',
              padding: '1.5rem'
            }}>
              <h2 style={{ color: '#a5b4fc', marginBottom: '1.25rem', fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem' }}>
                📈 Average Skill Scores
              </h2>
              <p style={{ color: '#6b6887', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                Based on AI evaluation of your answers across all sessions
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1.5rem' }}>
                <ScoreCircle score={data.overall?.avgGrammar} label="Grammar" color="#6366f1" />
                <ScoreCircle score={data.overall?.avgFluency} label="Fluency" color="#10b981" />
                <ScoreCircle score={data.overall?.avgRelevance} label="Relevance" color="#f59e0b" />
                <ScoreCircle score={data.overall?.avgVocabulary} label="Vocabulary" color="#8b5cf6" />
              </div>
            </div>

            {/* By situation */}
            {data.bySituation && data.bySituation.length > 0 && (
              <div style={{
                background: 'rgba(35,26,64,0.8)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '20px',
                padding: '1.5rem'
              }}>
                <h2 style={{ color: '#a5b4fc', marginBottom: '1.25rem', fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem' }}>
                  🎭 Practice by Situation
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  {data.bySituation.map(sit => {
                    const sitData = SITUATIONS[sit.situation]
                    return (
                      <div key={sit.situation} style={{
                        background: 'rgba(99,102,241,0.08)',
                        border: '1px solid rgba(99,102,241,0.15)',
                        borderRadius: '14px',
                        padding: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>{sitData?.emoji || '🎯'}</span>
                          <span style={{ color: '#f1f0f7', fontWeight: 500, fontSize: '0.9rem' }}>
                            {sitData?.name || sit.situation}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                          <div>
                            <div style={{ color: '#a5b4fc', fontWeight: 600 }}>{sit.sessions}</div>
                            <div style={{ color: '#6b6887', fontSize: '0.72rem' }}>Sessions</div>
                          </div>
                          <div>
                            <div style={{ color: '#6ee7b7', fontWeight: 600 }}>{Math.round(sit.avgScore || 0)}%</div>
                            <div style={{ color: '#6b6887', fontSize: '0.72rem' }}>Avg Score</div>
                          </div>
                          <div>
                            <div style={{ color: '#fcd34d', fontWeight: 600 }}>{formatTime(sit.totalSeconds)}</div>
                            <div style={{ color: '#6b6887', fontSize: '0.72rem' }}>Time</div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                            <div style={{ 
                              height: '100%',
                              width: `${sit.avgScore || 0}%`,
                              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                              borderRadius: '2px'
                            }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Weekly progress chart */}
            {data.weeklyProgress && data.weeklyProgress.length > 0 && (
              <div style={{
                background: 'rgba(35,26,64,0.8)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '20px',
                padding: '1.5rem'
              }}>
                <h2 style={{ color: '#a5b4fc', marginBottom: '0.5rem', fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem' }}>
                  📅 Weekly Progress
                </h2>
                <p style={{ color: '#6b6887', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                  Sessions completed in the last 7 days
                </p>
                <SimpleBarChart 
                  data={data.weeklyProgress.map(d => ({ 
                    label: new Date(d.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }), 
                    value: d.sessions 
                  }))}
                  label=" sessions"
                  color="#6366f1"
                />
              </div>
            )}

            {/* Recent sessions */}
            {data.recentSessions && data.recentSessions.length > 0 && (
              <div style={{
                background: 'rgba(35,26,64,0.8)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '20px',
                padding: '1.5rem'
              }}>
                <h2 style={{ color: '#a5b4fc', marginBottom: '1.25rem', fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem' }}>
                  🕐 Recent Sessions
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {data.recentSessions.slice(0, 8).map(session => {
                    const sitData = SITUATIONS[session.situation]
                    const score = Math.round(session.overall_score || 0)
                    const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
                    
                    return (
                      <div key={session.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.9rem 1rem',
                        background: 'rgba(99,102,241,0.06)',
                        border: '1px solid rgba(99,102,241,0.12)',
                        borderRadius: '12px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ fontSize: '1.4rem' }}>{sitData?.emoji || '🎯'}</span>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <div style={{ color: '#f1f0f7', fontWeight: 500, fontSize: '0.9rem' }}>
                            {sitData?.name || session.situation}
                          </div>
                          <div style={{ color: '#6b6887', fontSize: '0.75rem' }}>
                            {session.mode} · {session.difficulty} · {formatTime(session.duration_seconds)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: scoreColor, fontWeight: 700, fontSize: '1rem' }}>
                            {score > 0 ? `${score}%` : 'N/A'}
                          </div>
                          <div style={{ color: '#6b6887', fontSize: '0.72rem' }}>
                            {new Date(session.started_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Score explanation */}
            <div style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '16px',
              padding: '1.25rem'
            }}>
              <h3 style={{ color: '#a5b4fc', marginBottom: '0.75rem', fontSize: '0.95rem', fontFamily: 'Poppins, sans-serif' }}>
                ℹ️ How Scores Are Calculated
              </h3>
              <ul style={{ color: '#9d99b8', fontSize: '0.82rem', lineHeight: 1.8, listStyle: 'none' }}>
                <li>📝 <strong>Grammar:</strong> AI evaluates grammatical accuracy of your answers</li>
                <li>🗣️ <strong>Fluency:</strong> Based on completeness and natural flow of responses</li>
                <li>🎯 <strong>Relevance:</strong> How well your answers address the questions asked</li>
                <li>📚 <strong>Vocabulary:</strong> Variety and appropriateness of words used</li>
                <li>⭐ <strong>Overall:</strong> Average of the four skill scores</li>
              </ul>
              <p style={{ color: '#6b6887', fontSize: '0.78rem', marginTop: '0.75rem' }}>
                Scores are only calculated from sessions where answer evaluation is available. 
                One session is not proof of long-term improvement — consistent practice matters most.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Clear confirm dialog */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'rgba(35,26,64,0.98)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '380px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ color: '#f1f0f7', marginBottom: '0.5rem', fontFamily: 'Poppins, sans-serif' }}>
              Clear All History?
            </h3>
            <p style={{ color: '#9d99b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              This will permanently delete all your session history and progress data. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setShowClearConfirm(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleClearHistory} className="btn btn-danger">Yes, Clear All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
