// useSpeech.js - Custom hook for all speech-related features
// This hook manages:
// 1. Speech Recognition (microphone → text) using Web Speech API
// 2. Speech Synthesis (text → Aira's voice) using browser TTS

import { useState, useEffect, useRef, useCallback } from 'react'
import useAppStore from '../store/appStore'

// Check if speech recognition is supported by this browser
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const speechSynthesis = window.speechSynthesis

export function useSpeech() {
  const [availableVoices, setAvailableVoices] = useState([])
  const [femaleVoice, setFemaleVoice] = useState(null)
  const [micPermission, setMicPermission] = useState('unknown') // 'granted', 'denied', 'unknown'
  const [isRecognitionSupported] = useState(!!SpeechRecognition)
  const [isSynthesisSupported] = useState(!!speechSynthesis)
  
  const recognitionRef = useRef(null)
  const currentUtteranceRef = useRef(null)
  const onResultRef = useRef(null)
  const onEndRef = useRef(null)
  
  const { 
    setIsListening, 
    setInterimTranscript, 
    setAiraIsSpeaking,
    preferredVoice,
    speechRate,
    speechPitch
  } = useAppStore()

  // ============================================
  // LOAD AVAILABLE VOICES
  // ============================================
  
  useEffect(() => {
    if (!isSynthesisSupported) return

    function loadVoices() {
      const voices = speechSynthesis.getVoices()
      setAvailableVoices(voices)
      
      // Find the best female voice available
      // Priority: saved preference → female English voices → any English voice
      const savedVoice = preferredVoice 
        ? voices.find(v => v.name === preferredVoice)
        : null
      
      if (savedVoice) {
        setFemaleVoice(savedVoice)
        return
      }
      
      // Female voice keywords to look for
      const femaleKeywords = ['female', 'woman', 'girl', 'zira', 'samantha', 'victoria', 
                              'karen', 'moira', 'fiona', 'tessa', 'veena', 'neerja',
                              'heather', 'joanna', 'salli', 'kimberly', 'kendra', 'ivy']
      
      // Try to find a female English voice
      let selected = voices.find(v => 
        v.lang.startsWith('en') && 
        femaleKeywords.some(keyword => v.name.toLowerCase().includes(keyword))
      )
      
      // Fallback: any English voice
      if (!selected) {
        selected = voices.find(v => v.lang.startsWith('en-'))
      }
      
      // Last resort: first available voice
      if (!selected && voices.length > 0) {
        selected = voices[0]
      }
      
      setFemaleVoice(selected || null)
    }

    loadVoices()
    
    // Voices load asynchronously in some browsers
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [isSynthesisSupported, preferredVoice])

  // ============================================
  // SPEECH SYNTHESIS (Aira speaks)
  // ============================================
  
  const speak = useCallback((text, options = {}) => {
    return new Promise((resolve) => {
      if (!isSynthesisSupported || !text) {
        resolve()
        return
      }

      // Stop any current speech
      speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      currentUtteranceRef.current = utterance
      
      // Apply voice settings
      if (femaleVoice) utterance.voice = femaleVoice
      utterance.rate = options.rate || speechRate || 0.95
      utterance.pitch = options.pitch || speechPitch || 1.1
      utterance.volume = options.volume || 1.0
      utterance.lang = 'en-US'
      
      utterance.onstart = () => {
        setAiraIsSpeaking(true)
        options.onStart?.()
      }
      
      utterance.onend = () => {
        setAiraIsSpeaking(false)
        currentUtteranceRef.current = null
        options.onEnd?.()
        resolve()
      }
      
      utterance.onerror = (event) => {
        // 'interrupted' is not a real error - it means we stopped it intentionally
        if (event.error !== 'interrupted' && event.error !== 'canceled') {
          console.warn('Speech synthesis error:', event.error)
        }
        setAiraIsSpeaking(false)
        currentUtteranceRef.current = null
        resolve()
      }
      
      // Handle word boundaries for caption synchronization
      utterance.onboundary = (event) => {
        options.onBoundary?.(event)
      }
      
      speechSynthesis.speak(utterance)
    })
  }, [femaleVoice, speechRate, speechPitch, isSynthesisSupported, setAiraIsSpeaking])

  // Stop Aira from speaking (for interruptions)
  const stopSpeaking = useCallback(() => {
    if (speechSynthesis) {
      speechSynthesis.cancel()
    }
    setAiraIsSpeaking(false)
  }, [setAiraIsSpeaking])

  // ============================================
  // SPEECH RECOGNITION (User speaks → text)
  // ============================================
  
  const startListening = useCallback((callbacks = {}) => {
    if (!isRecognitionSupported) {
      callbacks.onError?.('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    onResultRef.current = callbacks.onResult
    onEndRef.current = callbacks.onEnd

    recognition.continuous = false         // Stop after each sentence
    recognition.interimResults = true      // Show text while speaking
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setMicPermission('granted')
      callbacks.onStart?.()
    }

    // This fires as the user speaks - shows interim (temporary) text
    recognition.onresult = (event) => {
      let interimText = ''
      let finalText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interimText += result[0].transcript
        }
      }

      setInterimTranscript(interimText)
      
      if (finalText) {
        onResultRef.current?.(finalText.trim())
        setInterimTranscript('')
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
      onEndRef.current?.()
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      setInterimTranscript('')
      
      let errorMessage = ''
      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.'
          setMicPermission('denied')
          break
        case 'no-speech':
          errorMessage = 'No speech detected. Please speak clearly into your microphone.'
          break
        case 'network':
          errorMessage = 'Network error during speech recognition. Please check your internet connection.'
          break
        case 'audio-capture':
          errorMessage = 'No microphone found. Please connect a microphone and try again.'
          break
        default:
          errorMessage = `Speech recognition error: ${event.error}`
      }
      
      callbacks.onError?.(errorMessage)
    }

    recognition.start()
  }, [isRecognitionSupported, setIsListening, setInterimTranscript])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    setInterimTranscript('')
  }, [setIsListening, setInterimTranscript])

  // Request microphone permission
  const requestMicPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // Stop immediately, just checking permission
      setMicPermission('granted')
      return true
    } catch (error) {
      setMicPermission('denied')
      return false
    }
  }, [])

  return {
    // State
    availableVoices,
    femaleVoice,
    micPermission,
    isRecognitionSupported,
    isSynthesisSupported,
    
    // Actions
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    requestMicPermission,
  }
}
