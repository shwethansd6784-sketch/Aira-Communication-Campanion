// Conversation.jsx - Main conversation screen
// Real-time video-call style UI with 3D/2D Avatar, speech recognition, speech synthesis,
// live captions, replay capability, and deep smart answer evaluation.

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AiraAvatar from '../components/Avatar/AiraAvatar'
import { useAira } from '../hooks/useAira'
import { useSpeech } from '../hooks/useSpeech'
import useAppStore from '../store/appStore'
import { evaluateAnswer, saveVocabWord } from '../utils/api'
import { SITUATIONS, MODES, DIFFICULTIES } from '../utils/aiPrompts'

export default function Conversation() {
  const navigate = useNavigate()
  const { 
    messages, addMessage, clearMessages,
    selectedSituation, selectedMode, selectedDifficulty,
    isListening, airaIsSpeaking,
    interimTranscript,
    conversationActive, startConversation: storeStartConversation, endConversation: storeEndConversation,
    captionsEnabled, toggleCaptions,
    setAvatarExpression
  } = useAppStore()
  
  const { startConversation, processUserMessage, replayMessage, interruptAira, endConversation } = useAira()
  const { startListening, stopListening, stopSpeaking, speak, requestMicPermission, isRecognitionSupported, isSynthesisSupported } = useSpeech()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [micError, setMicError] = useState(null)
  const [replayingId, setReplayingId] = useState(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [sessionReport, setSessionReport] = useState(null)
  const [textInput, setTextInput] = useState('')
  
  // Smart evaluation modal/drawer state
  const [evaluationModal, setEvaluationModal] = useState(null)
  const [evaluatingMsgId, setEvaluatingMsgId] = useState(null)
  const [stuckHint, setStuckHint] = useState(null)
  const [vocabToast, setVocabToast] = useState(null)
  
  const messagesEndRef = useRef(null)
  const conversationStartedRef = useRef(false)

  // Redirect if no situation selected
  useEffect(() => {
    if (!selectedSituation) {
      navigate('/')
    }
  }, [selectedSituation, navigate])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, interimTranscript, isProcessing])

  // Start conversation on initial load
  useEffect(() => {
    if (!conversationStartedRef.current && selectedSituation) {
      conversationStartedRef.current = true
      handleStart()
    }
  }, [])

  const handleStart = async () => {
    storeStartConversation()
    clearMessages()
    setError(null)
    setMicError(null)
    
    // Check mic permission
    if (isRecognitionSupported) {
      const hasPermission = await requestMicPermission()
      if (!hasPermission) {
        setMicError('Microphone permission not granted. You can still type your answers below.')
      }
    }
    
    await startConversation(
      () => {},
      (err) => setError(err)
    )
  }

  // Handle user speech input
  const handleMicPress = useCallback(() => {
    if (!isRecognitionSupported) {
      setMicError('Speech recognition is not available in this browser. Please type your message below or use Chrome/Edge.')
      return
    }
    
    if (airaIsSpeaking) {
      interruptAira()
      return
    }
    
    if (isListening) {
      stopListening()
      return
    }
    
    setMicError(null)
    startListening({
      onStart: () => setAvatarExpression('thinking'),
      onResult: async (text) => {
        if (text && text.trim()) {
          await submitUserAnswer(text.trim())
        }
      },
      onEnd: () => {
        setAvatarExpression('neutral')
      },
      onError: (err) => {
        setMicError(err)
        setAvatarExpression('neutral')
      }
    })
  }, [isListening, airaIsSpeaking, interruptAira, startListening, stopListening, setAvatarExpression, isRecognitionSupported])

  // Submit answer via voice or text input
  const submitUserAnswer = async (text) => {
    if (!text || !text.trim() || isProcessing) return
    setIsProcessing(true)
    setTextInput('')
    setError(null)
    setStuckHint(null)

    try {
      await processUserMessage(text, null, (err) => setError(err))
    } finally {
      setIsProcessing(false)
      setAvatarExpression('neutral')
    }
  }

  const handleTextSubmit = (e) => {
    e.preventDefault()
    if (textInput.trim()) {
      submitUserAnswer(textInput.trim())
    }
  }

  // Handle replay
  const handleReplay = async (message) => {
    if (replayingId) return
    setReplayingId(message.id)
    await replayMessage(message.content)
    setReplayingId(null)
  }

  // Run Smart Evaluation on a user message
  const handleOpenEvaluation = async (userMessage) => {
    // Find the question preceding this user message
    const msgIndex = messages.findIndex(m => m.id === userMessage.id)
    let precedingQuestion = "Tell me about yourself and your background."
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'aira') {
        precedingQuestion = messages[i].content
        break
      }
    }

    setEvaluatingMsgId(userMessage.id)
    try {
      const evalResult = await evaluateAnswer({
        question: precedingQuestion,
        answer: userMessage.content,
        situation: selectedSituation,
        difficulty: selectedDifficulty
      })
      setEvaluationModal({
        question: precedingQuestion,
        userAnswer: userMessage.content,
        result: evalResult
      })
    } catch (err) {
      setError('Could not evaluate answer: ' + err.message)
    } finally {
      setEvaluatingMsgId(null)
    }
  }

  // Handle "I'm Stuck" helper
  const handleImStuck = () => {
    const hints = {
      college: {
        hint: "Start with a friendly greeting, state your department or year, and mention a genuine interest or hobby.",
        phrases: ["Hi, I'm...", "I'm currently in my second year of...", "I'm really interested in..."],
        starter: "Hi! My name is Alex, and I'm a computer science student passionate about artificial intelligence."
      },
      interview: {
        hint: "Use the STAR method: Situation, Task, Action, and Result to structure your response clearly.",
        phrases: ["In my previous project...", "My key responsibility was...", "As a result, we achieved..."],
        starter: "In my recent project, I led the database design, which reduced query response times by 30 percent."
      },
      discussion: {
        hint: "Acknowledge the previous point first, then introduce your supporting or counter viewpoint politely.",
        phrases: ["I understand that perspective, and...", "To look at this from another angle...", "A key factor we should consider is..."],
        starter: "I agree that digital tools save time, but we also have to consider digital privacy."
      },
      speaking: {
        hint: "Hook the audience with an engaging observation, state your main premise, and preview your key points.",
        phrases: ["Have you ever wondered...", "Today I want to share three reasons why...", "Let me start with..."],
        starter: "Imagine a world where routine tasks are automated—today I will share why that future is already here."
      },
      everyday: {
        hint: "Keep it natural and relaxed. Ask a question back to keep the conversation flowing smoothly.",
        phrases: ["How has your day been?", "Could you recommend a good...", "That reminds me of..."],
        starter: "Excuse me, do you know if there is a quiet cafe around here where I can do some reading?"
      }
    }

    const currentHint = hints[selectedSituation] || hints.everyday
    setStuckHint(currentHint)
  }

  // Save phrase/word to vocabulary notebook
  const handleSaveToVocab = async (word, meaning = '') => {
    try {
      await saveVocabWord({
        word,
        meaning: meaning || 'Saved during conversation practice',
        example: `Used in ${SITUATIONS[selectedSituation]?.name || 'practice session'}`
      })
      setVocabToast(`Saved "${word}" to Vocabulary Notebook! 📖`)
      setTimeout(() => setVocabToast(null), 3000)
    } catch (err) {
      setError('Failed to save word: ' + err.message)
    }
  }

  // End conversation session
  const handleEnd = async () => {
    setShowEndConfirm(false)
    stopSpeaking()
    stopListening()
    
    const userMessages = messages.filter(m => m.role === 'user')
    const report = {
      situation: SITUATIONS[selectedSituation]?.name || 'Communication Practice',
      mode: MODES[selectedMode]?.name || 'Practice',
      difficulty: DIFFICULTIES[selectedDifficulty]?.name || 'Intermediate',
      totalMessages: messages.length,
      userMessages: userMessages.length,
      practiceTime: Math.max(1, Math.round((Date.now() - (window._sessionStart || Date.now())) / 60000)),
    }
    
    await endConversation()
    storeEndConversation()
    setSessionReport(report)
  }

  // Final session completion report
  if (sessionReport) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        paddingTop: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0f0a1e 0%, #1a1335 100%)',
        padding: '80px 1.5rem 2rem'
      }}>
        <div style={{
          maxWidth: '560px',
          width: '100%',
          background: 'rgba(35,26,64,0.92)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', color: '#a5b4fc', marginBottom: '0.5rem', fontSize: '1.6rem' }}>
            Practice Session Completed!
          </h2>
          <p style={{ color: '#9d99b8', marginBottom: '2rem', fontSize: '0.92rem' }}>
            You completed a <strong>{sessionReport.mode}</strong> session in <strong>{sessionReport.situation}</strong> ({sessionReport.difficulty}).
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Exchanges', value: sessionReport.totalMessages },
              { label: 'Your Answers', value: sessionReport.userMessages },
              { label: 'Time Spent', value: `${sessionReport.practiceTime} min` },
            ].map(stat => (
              <div key={stat.label} style={{ 
                background: 'rgba(99,102,241,0.12)', 
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '16px', 
                padding: '1.25rem 0.5rem' 
              }}>
                <div style={{ color: '#a5b4fc', fontSize: '1.6rem', fontWeight: 700 }}>{stat.value}</div>
                <div style={{ color: '#6b6887', fontSize: '0.78rem', marginTop: '0.25rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <div style={{ color: '#6ee7b7', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
              💡 Practice Takeaway:
            </div>
            <div style={{ color: '#9d99b8', fontSize: '0.85rem', lineHeight: 1.6 }}>
              Your responses have been recorded in the Progress Dashboard. Consistent daily sessions of 10 minutes significantly boost fluency and spontaneity!
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { conversationStartedRef.current = false; handleStart() }} className="btn btn-primary">
              🔄 Practice Again
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
              📊 View Dashboard
            </button>
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              🏠 Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      paddingTop: '64px',
      background: 'linear-gradient(180deg, #0f0a1e 0%, #1a1335 100%)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top Session Control Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        background: 'rgba(15,10,30,0.85)',
        borderBottom: '1px solid rgba(99,102,241,0.15)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '8px',
              color: '#9d99b8', 
              cursor: 'pointer', 
              padding: '0.4rem 0.75rem',
              fontSize: '0.85rem'
            }}
          >
            ← Back
          </button>
          <div>
            <div style={{ color: '#f1f0f7', fontWeight: 600, fontSize: '0.95rem' }}>
              {SITUATIONS[selectedSituation]?.emoji} {SITUATIONS[selectedSituation]?.name || 'Conversation'}
            </div>
            <div style={{ color: '#6b6887', fontSize: '0.75rem' }}>
              {MODES[selectedMode]?.name || 'Practice'} · {DIFFICULTIES[selectedDifficulty]?.name || 'Intermediate'}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* I'm Stuck helper button */}
          <button
            onClick={handleImStuck}
            style={{
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '8px',
              padding: '0.4rem 0.75rem',
              color: '#fcd34d',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif'
            }}
          >
            💡 I'm Stuck
          </button>

          {/* Captions toggle */}
          <button
            onClick={toggleCaptions}
            style={{
              background: captionsEnabled ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${captionsEnabled ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              padding: '0.4rem 0.75rem',
              color: captionsEnabled ? '#a5b4fc' : '#6b6887',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            CC {captionsEnabled ? 'ON' : 'OFF'}
          </button>
          
          {/* End call button */}
          <button
            onClick={() => setShowEndConfirm(true)}
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '0.4rem 0.75rem',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            End Call
          </button>
        </div>
      </div>

      {/* Vocab notification toast */}
      {vocabToast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 300,
          background: 'rgba(16,185,129,0.95)',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          fontSize: '0.85rem',
          fontWeight: 500,
          animation: 'fadeIn 0.3s ease'
        }}>
          {vocabToast}
        </div>
      )}

      {/* Main video-call interaction view */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden',
        height: 'calc(100vh - 128px)'
      }}>
        {/* Left: 3D/2D Avatar stage */}
        <div style={{
          flex: '0 0 auto',
          width: 'clamp(280px, 38%, 420px)',
          background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 100%)',
          borderRight: '1px solid rgba(99,102,241,0.12)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          position: 'relative',
        }}>
          <AiraAvatar size="large" />
          
          {/* Live Captions below Avatar */}
          <div style={{ marginTop: '1.25rem', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            {airaIsSpeaking && captionsEnabled && messages.length > 0 && (
              <div style={{
                background: 'rgba(35,26,64,0.9)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '14px',
                padding: '0.75rem 1rem',
                fontSize: '0.85rem',
                color: '#a5b4fc',
                lineHeight: 1.5,
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                animation: 'fadeIn 0.2s ease'
              }}>
                <span style={{ color: '#818cf8', fontSize: '0.72rem', display: 'block', fontWeight: 600, marginBottom: '0.2rem' }}>
                  💬 AIRA IS SPEAKING
                </span>
                {messages[messages.length - 1]?.role === 'aira' 
                  ? messages[messages.length - 1].content.slice(0, 120) + (messages[messages.length - 1].content.length > 120 ? '...' : '')
                  : ''}
              </div>
            )}
            
            {isListening && captionsEnabled && (
              <div style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.35)',
                borderRadius: '14px',
                padding: '0.75rem 1rem',
                fontSize: '0.85rem',
                color: '#6ee7b7',
                lineHeight: 1.5,
                animation: 'fadeIn 0.2s ease'
              }}>
                <span style={{ color: '#34d399', fontSize: '0.72rem', display: 'block', fontWeight: 600, marginBottom: '0.2rem' }}>
                  🎙️ LISTENING TO YOU
                </span>
                {interimTranscript || 'Speak into your microphone...'}
              </div>
            )}
          </div>
        </div>

        {/* Right: Conversation transcript & interactions */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'rgba(15,10,30,0.5)'
        }}>
          {/* Transcript messages container */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            {messages.length === 0 && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#6b6887',
                gap: '0.75rem'
              }}>
                <div style={{ fontSize: '2.5rem' }}>✨</div>
                <p>Aira is preparing your session...</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id || idx}
                message={msg}
                onReplay={() => handleReplay(msg)}
                isReplaying={replayingId === msg.id}
                showCaptions={captionsEnabled}
                onEvaluate={() => handleOpenEvaluation(msg)}
                isEvaluating={evaluatingMsgId === msg.id}
                onSaveVocab={handleSaveToVocab}
              />
            ))}
            
            {/* Real-time interim speech recognition display */}
            {isListening && interimTranscript && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px dashed rgba(16,185,129,0.4)',
                  borderRadius: '16px 4px 16px 16px',
                  padding: '0.75rem 1rem',
                  maxWidth: '75%',
                  color: '#6ee7b7',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                }}>
                  {interimTranscript}...
                </div>
              </div>
            )}
            
            {/* Thinking / AI Processing indicator */}
            {isProcessing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                <div style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', flexShrink: 0
                }}>✨</div>
                <div style={{
                  display: 'flex', gap: '6px', alignItems: 'center',
                  background: 'rgba(35,26,64,0.8)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '4px 16px 16px 16px',
                  padding: '0.75rem 1.25rem',
                }}>
                  <span style={{ color: '#9d99b8', fontSize: '0.82rem', marginRight: '6px' }}>Aira is thinking</span>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: '6px', height: '6px',
                      borderRadius: '50%',
                      background: '#a5b4fc',
                      animation: 'bounce 1s ease-in-out infinite',
                      animationDelay: `${i * 0.2}s`
                    }} />
                  ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Error notifications */}
          {(error || micError) && (
            <div style={{
              margin: '0 1.5rem 0.75rem',
              padding: '0.75rem 1rem',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '12px',
              color: '#fca5a5',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              ⚠️ {error || micError}
              <button 
                onClick={() => { setError(null); setMicError(null) }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '1rem' }}
              >✕</button>
            </div>
          )}

          {/* I'm Stuck Helper Banner */}
          {stuckHint && (
            <div style={{
              margin: '0 1.5rem 0.75rem',
              padding: '1rem 1.25rem',
              background: 'rgba(35,26,64,0.95)',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: '16px',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#fcd34d', fontWeight: 600, fontSize: '0.88rem' }}>
                  💡 Guidance & Useful Phrases
                </span>
                <button 
                  onClick={() => setStuckHint(null)} 
                  style={{ background: 'none', border: 'none', color: '#6b6887', cursor: 'pointer' }}
                >✕</button>
              </div>
              <p style={{ color: '#d4d2e3', fontSize: '0.85rem', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                {stuckHint.hint}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                {stuckHint.phrases.map((phrase, i) => (
                  <button
                    key={i}
                    onClick={() => setTextInput(prev => prev ? `${prev} ${phrase}` : phrase)}
                    style={{
                      background: 'rgba(99,102,241,0.15)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: '8px',
                      padding: '0.3rem 0.6rem',
                      color: '#a5b4fc',
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    + "{phrase}"
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#9d99b8' }}>
                Example starter: <em style={{ color: '#f1f0f7' }}>"{stuckHint.starter}"</em>
              </div>
            </div>
          )}

          {/* Dual Input Controls: Mic + Text Fallback */}
          <div style={{
            padding: '1rem 1.5rem',
            background: 'rgba(15,10,30,0.9)',
            borderTop: '1px solid rgba(99,102,241,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}>
            <form onSubmit={handleTextSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                className="input"
                placeholder={isListening ? "Listening to your voice..." : "Type your answer or click microphone to speak..."}
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                disabled={isProcessing}
                style={{ flex: 1 }}
              />
              <button 
                type="submit" 
                disabled={!textInput.trim() || isProcessing}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.25rem' }}
              >
                Send
              </button>
            </form>

            <ConversationControls
              isListening={isListening}
              airaIsSpeaking={airaIsSpeaking}
              isProcessing={isProcessing}
              onMicPress={handleMicPress}
              onInterrupt={interruptAira}
              isRecognitionSupported={isRecognitionSupported}
            />
          </div>
        </div>
      </div>

      {/* Smart Answer Evaluation Modal */}
      {evaluationModal && (
        <EvaluationModal
          data={evaluationModal}
          onClose={() => setEvaluationModal(null)}
          onTryAgain={() => {
            setEvaluationModal(null)
            setTextInput('')
          }}
          onPlayBetterAnswer={(text) => speak(text)}
          onSaveVocab={handleSaveToVocab}
        />
      )}

      {/* End Session Confirmation Dialog */}
      {showEndConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 400, backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'rgba(35,26,64,0.98)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '420px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
            <h3 style={{ color: '#f1f0f7', marginBottom: '0.5rem', fontFamily: 'Poppins, sans-serif' }}>
              Wrap up this session?
            </h3>
            <p style={{ color: '#9d99b8', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Your scores and conversation practice will be permanently saved to your progress dashboard.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setShowEndConfirm(false)} className="btn btn-secondary">
                Keep Practicing
              </button>
              <button onClick={handleEnd} className="btn btn-danger">
                End & Save Progress
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// Individual Message Bubble with Smart Evaluation Trigger
function MessageBubble({ message, onReplay, isReplaying, showCaptions, onEvaluate, isEvaluating, onSaveVocab }) {
  const isAira = message.role === 'aira'
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: isAira ? 'flex-start' : 'flex-end',
      alignItems: 'flex-start',
      gap: '0.75rem',
      animation: 'fadeIn 0.3s ease'
    }}>
      {isAira && (
        <div style={{
          width: '36px', height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem', flexShrink: 0, marginTop: '4px',
          boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
        }}>✨</div>
      )}
      
      <div style={{ maxWidth: '75%' }}>
        {showCaptions && (
          <div style={{ 
            fontSize: '0.72rem', 
            color: '#6b6887', 
            marginBottom: '0.3rem',
            textAlign: isAira ? 'left' : 'right'
          }}>
            {isAira ? '✨ Aira' : '👤 You'} · {new Date(message.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        
        <div style={{
          background: isAira 
            ? 'rgba(35,26,64,0.92)' 
            : 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.25))',
          border: `1px solid ${isAira ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.45)'}`,
          borderRadius: isAira ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
          padding: '0.9rem 1.15rem',
          color: '#f1f0f7',
          fontSize: '0.92rem',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {message.content}
        </div>
        
        {/* Action controls under messages */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginTop: '0.45rem',
          justifyContent: isAira ? 'flex-start' : 'flex-end',
          flexWrap: 'wrap'
        }}>
          {isAira && (
            <button
              onClick={onReplay}
              disabled={isReplaying}
              style={{
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: '8px',
                padding: '0.3rem 0.65rem',
                color: isReplaying ? '#6b6887' : '#a5b4fc',
                cursor: isReplaying ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
                display: 'flex', alignItems: 'center', gap: '4px',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {isReplaying ? '🔊 Speaking...' : '🔊 Replay Voice'}
            </button>
          )}

          {!isAira && (
            <button
              onClick={onEvaluate}
              disabled={isEvaluating}
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.35)',
                borderRadius: '8px',
                padding: '0.3rem 0.65rem',
                color: '#6ee7b7',
                cursor: isEvaluating ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
                display: 'flex', alignItems: 'center', gap: '4px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500
              }}
            >
              {isEvaluating ? '⏳ Evaluating...' : '📊 Smart Evaluation & Suggestions'}
            </button>
          )}
        </div>
      </div>
      
      {!isAira && (
        <div style={{
          width: '36px', height: '36px',
          borderRadius: '50%',
          background: 'rgba(99,102,241,0.3)',
          border: '1px solid rgba(99,102,241,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', flexShrink: 0, marginTop: '4px'
        }}>👤</div>
      )}
    </div>
  )
}

// Conversation Controls (Microphone + Interruption)
function ConversationControls({ isListening, airaIsSpeaking, isProcessing, onMicPress, onInterrupt, isRecognitionSupported }) {
  const getMicState = () => {
    if (airaIsSpeaking) return { label: 'Tap to Interrupt Aira', color: '#8b5cf6', bg: 'rgba(139,92,246,0.25)', border: 'rgba(139,92,246,0.6)', icon: '✋' }
    if (isListening) return { label: 'Listening... (Tap to finish)', color: '#10b981', bg: 'rgba(16,185,129,0.25)', border: 'rgba(16,185,129,0.6)', icon: '🎙️' }
    if (isProcessing) return { label: 'Processing your answer...', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.5)', icon: '⏳' }
    return { label: 'Click to Speak (Live Microphone)', color: '#6366f1', bg: 'rgba(99,102,241,0.2)', border: 'rgba(99,102,241,0.5)', icon: '🎙️' }
  }
  
  const micState = getMicState()
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      padding: '0.25rem 0'
    }}>
      <button
        onClick={onMicPress}
        disabled={isProcessing && !isListening && !airaIsSpeaking}
        style={{
          width: '56px', height: '56px',
          borderRadius: '50%',
          background: micState.bg,
          border: `2px solid ${micState.border}`,
          color: micState.color,
          fontSize: '1.5rem',
          cursor: 'pointer',
          transition: 'all 0.25s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isListening ? `0 0 0 6px ${micState.border}40` : '0 4px 15px rgba(0,0,0,0.2)',
          animation: isListening ? 'glowPulse 1.5s ease-in-out infinite' : 'none',
        }}
        title={micState.label}
      >
        {micState.icon}
      </button>
      
      <div style={{ color: micState.color, fontSize: '0.85rem', fontWeight: 500 }}>
        {micState.label}
        {!isRecognitionSupported && (
          <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 400 }}>
            Web Speech not supported in this browser; text chat available
          </div>
        )}
      </div>

      <style>{`
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(16,185,129,0.2); }
          50% { box-shadow: 0 0 0 10px rgba(16,185,129,0.05); }
        }
      `}</style>
    </div>
  )
}

// Smart Answer Evaluation Drawer / Modal (Section 7 Implementation)
function EvaluationModal({ data, onClose, onTryAgain, onPlayBetterAnswer, onSaveVocab }) {
  const { question, userAnswer, result } = data
  const { scores = {}, strengths = [], missingPoints = [], weakPoints = [], whyImprovementHelps = '', betterAnswer = '', encouragement = '' } = result

  const [activeTab, setActiveTab] = useState('summary') // 'summary' | 'better' | 'weak'

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 500, backdropFilter: 'blur(8px)',
      padding: '1.5rem'
    }}>
      <div style={{
        background: 'rgba(30,22,55,0.98)',
        border: '1px solid rgba(99,102,241,0.35)',
        borderRadius: '24px',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '2rem',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        animation: 'fadeIn 0.25s ease'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ color: '#a5b4fc', fontFamily: 'Poppins, sans-serif', fontSize: '1.3rem', marginBottom: '0.25rem' }}>
              🎯 Smart Answer Evaluation
            </h3>
            <p style={{ color: '#9d99b8', fontSize: '0.82rem' }}>
              Constructive, honest feedback to elevate your English communication
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'rgba(255,255,255,0.08)', 
              border: 'none', 
              borderRadius: '50%',
              width: '32px', height: '32px',
              color: '#9d99b8', 
              cursor: 'pointer', 
              fontSize: '1rem' 
            }}
          >
            ✕
          </button>
        </div>

        {/* Question & Attempt Preview */}
        <div style={{
          background: 'rgba(15,10,30,0.6)',
          border: '1px solid rgba(99,102,241,0.18)',
          borderRadius: '14px',
          padding: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            QUESTION ASKED:
          </div>
          <div style={{ color: '#f1f0f7', fontSize: '0.88rem', marginBottom: '0.65rem' }}>
            "{question}"
          </div>
          <div style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            YOUR ANSWER:
          </div>
          <div style={{ color: '#d4d2e3', fontSize: '0.85rem', fontStyle: 'italic' }}>
            "{userAnswer}"
          </div>
        </div>

        {/* Scores Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          {[
            { label: 'Relevance', score: scores.relevance || 75, color: '#6366f1' },
            { label: 'Grammar', score: scores.grammar || 75, color: '#10b981' },
            { label: 'Vocabulary', score: scores.vocabulary || 75, color: '#8b5cf6' },
            { label: 'Completeness', score: scores.completeness || 70, color: '#f59e0b' },
            { label: 'Overall', score: scores.overall || 73, color: '#ec4899' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(99,102,241,0.08)',
              border: `1px solid ${s.color}40`,
              borderRadius: '12px',
              padding: '0.75rem 0.5rem',
              textAlign: 'center'
            }}>
              <div style={{ color: s.color, fontSize: '1.3rem', fontWeight: 700 }}>
                {s.score}%
              </div>
              <div style={{ color: '#9d99b8', fontSize: '0.72rem', marginTop: '2px' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Feedback Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '0.5rem' }}>
          {[
            { id: 'summary', label: '✅ Strengths & Gaps' },
            { id: 'better', label: '⭐ Better Sample Answer' },
            { id: 'weak', label: '❓ Why Was It Weak?' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: activeTab === t.id ? 'rgba(99,102,241,0.25)' : 'transparent',
                border: activeTab === t.id ? '1px solid rgba(99,102,241,0.4)' : 'none',
                borderRadius: '8px',
                padding: '0.4rem 0.8rem',
                color: activeTab === t.id ? '#a5b4fc' : '#9d99b8',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 500
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Strengths & Missing Points */}
        {activeTab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Strengths */}
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '0.9rem' }}>
              <div style={{ color: '#6ee7b7', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                ✅ What You Answered Well:
              </div>
              <ul style={{ paddingLeft: '1.2rem', color: '#d4d2e3', fontSize: '0.82rem', lineHeight: 1.6 }}>
                {strengths.map((str, i) => <li key={i}>{str}</li>)}
              </ul>
            </div>

            {/* Missing Info */}
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', padding: '0.9rem' }}>
              <div style={{ color: '#fcd34d', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                📌 Missing or Incomplete Information:
              </div>
              <ul style={{ paddingLeft: '1.2rem', color: '#d4d2e3', fontSize: '0.82rem', lineHeight: 1.6 }}>
                {missingPoints.map((pt, i) => <li key={i}>{pt}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: Better Sample Answer */}
        {activeTab === 'better' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '14px',
              padding: '1.1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#a5b4fc', fontWeight: 600, fontSize: '0.88rem' }}>
                  Natural, Improved Sample Answer:
                </span>
                <button
                  onClick={() => onPlayBetterAnswer(betterAnswer)}
                  style={{
                    background: 'rgba(99,102,241,0.2)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    borderRadius: '8px',
                    padding: '0.25rem 0.6rem',
                    color: '#c4b5fd',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  🔊 Hear Sample
                </button>
              </div>
              <p style={{ color: '#f1f0f7', fontSize: '0.9rem', lineHeight: 1.6, fontStyle: 'italic' }}>
                "{betterAnswer}"
              </p>
            </div>

            <div style={{ color: '#9d99b8', fontSize: '0.82rem', lineHeight: 1.6 }}>
              <strong>Why this works better:</strong> {whyImprovementHelps}
            </div>
          </div>
        )}

        {/* TAB 3: Why Is My Answer Weak? */}
        {activeTab === 'weak' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ color: '#fca5a5', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                🔍 Weak or Irrelevant Points Identified:
              </div>
              <ul style={{ paddingLeft: '1.2rem', color: '#d4d2e3', fontSize: '0.82rem', lineHeight: 1.6 }}>
                {weakPoints.map((wp, i) => <li key={i}>{wp}</li>)}
              </ul>
            </div>

            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ color: '#a5b4fc', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                💡 Why Improving These Points Helps You:
              </div>
              <p style={{ color: '#d4d2e3', fontSize: '0.82rem', lineHeight: 1.6 }}>
                {whyImprovementHelps}
              </p>
            </div>
          </div>
        )}

        {/* Encouragement note */}
        {encouragement && (
          <div style={{
            color: '#c4b5fd',
            fontSize: '0.82rem',
            fontStyle: 'italic',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            💬 "{encouragement}"
          </div>
        )}

        {/* Feedback Action Buttons (Section 7 Requirements) */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          borderTop: '1px solid rgba(99,102,241,0.2)',
          paddingTop: '1rem'
        }}>
          <button
            onClick={() => {
              setActiveTab('better')
            }}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem' }}
          >
            ⭐ Show Better Answer
          </button>

          <button
            onClick={() => {
              setActiveTab('weak')
            }}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem' }}
          >
            ❓ Why Is My Answer Weak?
          </button>

          <button
            onClick={onTryAgain}
            className="btn btn-primary"
            style={{ fontSize: '0.82rem' }}
          >
            🔄 Try Answering Again
          </button>
        </div>
      </div>
    </div>
  )
}
