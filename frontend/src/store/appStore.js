// appStore.js - Global state management using Zustand
// Zustand is a simple state manager - think of it as a shared "memory" for the whole app
// Any component can read or update these values

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // CONVERSATION SETTINGS
      // ============================================
      
      // Which conversation situation is selected
      // Options: 'college', 'interview', 'discussion', 'speaking', 'everyday'
      selectedSituation: null,
      
      // Which mode is active
      // Options: 'learn', 'practice', 'challenge'
      selectedMode: 'practice',
      
      // How difficult the questions are
      // Options: 'beginner', 'intermediate', 'advanced'
      selectedDifficulty: 'intermediate',
      
      // Current active session ID (from database)
      currentSessionId: null,
      
      // ============================================
      // CONVERSATION MESSAGES
      // ============================================
      
      // Array of all messages in current conversation
      // Each message: { id, role: 'aira'|'user', content, timestamp, evaluation, audioUrl }
      messages: [],
      
      // Is Aira currently speaking?
      airaIsSpeaking: false,
      
      // Is the microphone listening?
      isListening: false,
      
      // Text currently being recognized by speech recognition
      interimTranscript: '',
      
      // ============================================
      // UI STATE
      // ============================================
      
      // Should captions be shown?
      captionsEnabled: true,
      
      // Current avatar expression
      avatarExpression: 'neutral', // 'neutral', 'happy', 'thinking', 'speaking'
      
      // Is a conversation active?
      conversationActive: false,
      
      // Session start time
      sessionStartTime: null,
      
      // ============================================
      // SETTINGS
      // ============================================
      
      // User's preferred voice (browser voice name)
      preferredVoice: null,
      
      // Speech rate (0.5 to 2.0)
      speechRate: 0.95,
      
      // Speech pitch (0.5 to 2.0)
      speechPitch: 1.1,
      
      // ============================================
      // ACTIONS - Functions that update the state
      // ============================================
      
      // Set the selected conversation situation
      setSituation: (situation) => set({ selectedSituation: situation }),
      
      // Set the learning mode
      setMode: (mode) => set({ selectedMode: mode }),
      
      // Set difficulty level
      setDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),
      
      // Set current session ID
      setSessionId: (id) => set({ currentSessionId: id }),
      
      // Add a new message to the conversation
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          ...message
        }]
      })),
      
      // Update the last message (useful for updating evaluations)
      updateLastMessage: (updates) => set((state) => {
        const messages = [...state.messages]
        if (messages.length > 0) {
          messages[messages.length - 1] = { ...messages[messages.length - 1], ...updates }
        }
        return { messages }
      }),
      
      // Clear all messages (start fresh conversation)
      clearMessages: () => set({ messages: [] }),
      
      // Set whether Aira is speaking
      setAiraIsSpeaking: (speaking) => set({ 
        airaIsSpeaking: speaking,
        avatarExpression: speaking ? 'speaking' : 'neutral'
      }),
      
      // Set whether microphone is listening
      setIsListening: (listening) => set({ isListening: listening }),
      
      // Update the text being recognized in real-time
      setInterimTranscript: (text) => set({ interimTranscript: text }),
      
      // Toggle captions on/off
      toggleCaptions: () => set((state) => ({ captionsEnabled: !state.captionsEnabled })),
      
      // Set avatar expression
      setAvatarExpression: (expression) => set({ avatarExpression: expression }),
      
      // Start a new conversation
      startConversation: () => set({ 
        conversationActive: true,
        sessionStartTime: Date.now(),
        messages: []
      }),
      
      // End the conversation
      endConversation: () => set({ 
        conversationActive: false,
        airaIsSpeaking: false,
        isListening: false,
        currentSessionId: null
      }),
      
      // Update voice settings
      setVoiceSettings: (settings) => set(settings),
      
      // Get session duration in seconds
      getSessionDuration: () => {
        const { sessionStartTime } = get()
        if (!sessionStartTime) return 0
        return Math.round((Date.now() - sessionStartTime) / 1000)
      }
    }),
    {
      name: 'aira-storage',  // localStorage key name
      // Only persist settings, not active conversation state
      partialize: (state) => ({
        selectedSituation: state.selectedSituation,
        selectedMode: state.selectedMode,
        selectedDifficulty: state.selectedDifficulty,
        captionsEnabled: state.captionsEnabled,
        preferredVoice: state.preferredVoice,
        speechRate: state.speechRate,
        speechPitch: state.speechPitch,
      })
    }
  )
)

export default useAppStore
