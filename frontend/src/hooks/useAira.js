// useAira.js - Core hook that manages Aira's conversation logic
// This is the "brain" of the conversation - it connects speech, AI, and state

import { useCallback, useRef } from 'react'
import { useSpeech } from './useSpeech'
import { sendChatMessage, startSession, endSession, saveMessage } from '../utils/api'
import { getOpeningMessage } from '../utils/aiPrompts'
import useAppStore from '../store/appStore'

export function useAira() {
  const { speak, stopSpeaking, startListening, stopListening } = useSpeech()
  const isProcessingRef = useRef(false)  // Prevent multiple simultaneous requests
  const conversationHistoryRef = useRef([])  // Full message history for AI context
  
  const {
    selectedSituation,
    selectedMode,
    selectedDifficulty,
    addMessage,
    setAiraIsSpeaking,
    setIsListening,
    currentSessionId,
    setSessionId,
    getSessionDuration,
    messages,
    captionsEnabled
  } = useAppStore()

  // ============================================
  // START CONVERSATION
  // ============================================
  
  const startConversation = useCallback(async (onMessage, onError) => {
    try {
      // Start a database session
      const { sessionId } = await startSession({
        situation: selectedSituation,
        mode: selectedMode,
        difficulty: selectedDifficulty
      })
      setSessionId(sessionId)
      
      // Reset conversation history for the AI
      conversationHistoryRef.current = []
      
      // Get Aira's opening message
      const openingText = getOpeningMessage(selectedSituation, selectedMode, selectedDifficulty)
      
      // Add opening message to UI
      const openingMessage = {
        role: 'aira',
        content: openingText,
        sessionId
      }
      addMessage(openingMessage)
      
      // Save to database
      await saveMessage({ 
        sessionId, 
        speaker: 'aira', 
        text: openingText 
      }).catch(() => {}) // Don't block if save fails
      
      // Add to AI history
      conversationHistoryRef.current.push({
        role: 'assistant',
        content: openingText
      })
      
      // Aira speaks the opening message
      await speak(openingText)
      
      // Notify parent component
      onMessage?.(openingMessage)
      
    } catch (error) {
      console.error('Start conversation error:', error)
      
      // Even if backend fails, start a local conversation
      const openingText = getOpeningMessage(selectedSituation, selectedMode, selectedDifficulty)
      addMessage({ role: 'aira', content: openingText })
      await speak(openingText)
      
      onError?.('Could not connect to backend. Running in offline mode.')
    }
  }, [selectedSituation, selectedMode, selectedDifficulty, speak, addMessage, setSessionId])

  // ============================================
  // PROCESS USER MESSAGE → GET AIRA'S RESPONSE
  // ============================================
  
  const processUserMessage = useCallback(async (userText, onResponse, onError) => {
    if (!userText?.trim() || isProcessingRef.current) return
    
    isProcessingRef.current = true
    
    try {
      // Add user message to UI
      const userMessage = { role: 'user', content: userText }
      addMessage(userMessage)
      
      // Add to AI conversation history
      conversationHistoryRef.current.push({
        role: 'user',
        content: userText
      })
      
      // Save user message to database
      if (currentSessionId) {
        await saveMessage({
          sessionId: currentSessionId,
          speaker: 'user',
          text: userText
        }).catch(() => {})
      }
      
      // Build session context for better AI responses
      const sessionContext = `Situation: ${selectedSituation}, Mode: ${selectedMode}, Difficulty: ${selectedDifficulty}`
      
      // Send to AI and get response
      const result = await sendChatMessage({
        messages: conversationHistoryRef.current,
        situation: selectedSituation,
        mode: selectedMode,
        difficulty: selectedDifficulty,
        sessionContext
      })
      
      const airaResponse = result.response || "I'm having trouble responding right now. Could you try again?"
      
      // Add Aira's response to AI history
      conversationHistoryRef.current.push({
        role: 'assistant',
        content: airaResponse
      })
      
      // Add Aira's response to UI
      const airaMessage = { role: 'aira', content: airaResponse, isFallback: result.isFallback }
      addMessage(airaMessage)
      
      // Save Aira's response to database
      if (currentSessionId) {
        await saveMessage({
          sessionId: currentSessionId,
          speaker: 'aira',
          text: airaResponse
        }).catch(() => {})
      }
      
      // Aira speaks her response
      await speak(airaResponse)
      
      onResponse?.(airaMessage)
      
    } catch (error) {
      console.error('Process message error:', error)
      
      let errorMessage = "I'm having trouble connecting right now. "
      if (error.message.includes('backend')) {
        errorMessage += "Please make sure the Aira backend server is running (npm start in the backend folder)."
      } else {
        errorMessage += "Please try again in a moment."
      }
      
      addMessage({ role: 'aira', content: errorMessage, isError: true })
      await speak(errorMessage)
      onError?.(error.message)
      
    } finally {
      isProcessingRef.current = false
    }
  }, [selectedSituation, selectedMode, selectedDifficulty, speak, addMessage, currentSessionId])

  // ============================================
  // REPLAY A SPECIFIC MESSAGE
  // ============================================
  
  const replayMessage = useCallback(async (text) => {
    stopSpeaking()  // Stop any current speech
    await speak(text)
  }, [speak, stopSpeaking])

  // ============================================
  // INTERRUPT AIRA
  // ============================================
  
  const interruptAira = useCallback(() => {
    stopSpeaking()
    stopListening()
  }, [stopSpeaking, stopListening])

  // ============================================
  // END CONVERSATION WITH FINAL SCORES
  // ============================================
  
  const endConversation = useCallback(async (scores) => {
    stopSpeaking()
    stopListening()
    
    if (currentSessionId) {
      try {
        const duration = getSessionDuration()
        const messageCount = messages.length
        
        // Calculate scores from evaluations in messages
        const evaluatedMessages = messages.filter(m => m.evaluation)
        let avgScores = { grammar: 70, fluency: 70, relevance: 70, vocabulary: 70 }
        
        if (evaluatedMessages.length > 0) {
          const totals = evaluatedMessages.reduce((acc, msg) => {
            const ev = msg.evaluation || {}
            return {
              grammar: acc.grammar + (ev.grammar || 70),
              fluency: acc.fluency + (ev.fluency || 70),
              relevance: acc.relevance + (ev.relevance || 70),
              vocabulary: acc.vocabulary + (ev.vocabulary || 70)
            }
          }, { grammar: 0, fluency: 0, relevance: 0, vocabulary: 0 })
          
          avgScores = {
            grammar: Math.round(totals.grammar / evaluatedMessages.length),
            fluency: Math.round(totals.fluency / evaluatedMessages.length),
            relevance: Math.round(totals.relevance / evaluatedMessages.length),
            vocabulary: Math.round(totals.vocabulary / evaluatedMessages.length)
          }
        }
        
        await endSession({
          sessionId: currentSessionId,
          duration,
          messageCount,
          scores: scores || avgScores,
          feedbackSummary: 'Session completed'
        })
      } catch (error) {
        console.error('End session error:', error)
      }
    }
  }, [currentSessionId, stopSpeaking, stopListening, getSessionDuration, messages])

  return {
    startConversation,
    processUserMessage,
    replayMessage,
    interruptAira,
    endConversation,
    isProcessing: isProcessingRef.current
  }
}
