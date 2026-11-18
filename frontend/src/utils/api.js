// api.js - All API calls to the backend server
// This file is the "bridge" between the frontend and backend
// The backend keeps the AI API key safe - it never goes to the browser

const BASE_URL = 'http://localhost:3001/api'

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(error.error || `HTTP error ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    // If backend is not running, provide a helpful message
    if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.name === 'TypeError') {
      throw new Error('Cannot connect to Aira backend. Make sure the backend server is running on port 3001.')
    }
    throw error
  }
}

// ============================================
// AI CONVERSATION API
// ============================================

// Send a message and get Aira's response
export async function sendChatMessage({ messages, situation, mode, difficulty, sessionContext }) {
  return apiRequest('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, situation, mode, difficulty, sessionContext })
  })
}

// Evaluate a user's answer
export async function evaluateAnswer({ question, answer, situation, difficulty }) {
  return apiRequest('/ai/evaluate', {
    method: 'POST',
    body: JSON.stringify({ question, answer, situation, difficulty })
  })
}

// Get learning content for a situation
export async function getLearnContent({ situation, difficulty }) {
  return apiRequest('/ai/learn-content', {
    method: 'POST',
    body: JSON.stringify({ situation, difficulty })
  })
}

// ============================================
// PROGRESS TRACKING API
// ============================================

// Start a new practice session
export async function startSession({ situation, mode, difficulty }) {
  return apiRequest('/progress/session/start', {
    method: 'POST',
    body: JSON.stringify({ situation, mode, difficulty })
  })
}

// End a session with final scores
export async function endSession({ sessionId, duration, messageCount, scores, feedbackSummary }) {
  return apiRequest('/progress/session/end', {
    method: 'POST',
    body: JSON.stringify({ sessionId, duration, messageCount, scores, feedbackSummary })
  })
}

// Save a conversation message
export async function saveMessage({ sessionId, speaker, text, evaluation }) {
  return apiRequest('/progress/message', {
    method: 'POST',
    body: JSON.stringify({ sessionId, speaker, text, evaluation })
  })
}

// Get dashboard data
export async function getDashboard() {
  return apiRequest('/progress/dashboard')
}

// Get session history
export async function getSessions() {
  return apiRequest('/progress/sessions')
}

// Clear all history
export async function clearHistory() {
  return apiRequest('/progress/history', { method: 'DELETE' })
}

// ============================================
// VOCABULARY API
// ============================================

// Get all vocabulary words (optionally filtered by search)
export async function getVocabulary(search = '') {
  const params = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiRequest(`/vocabulary${params}`)
}

// Save a new word
export async function saveVocabWord({ word, meaning, example, pronunciation }) {
  return apiRequest('/vocabulary', {
    method: 'POST',
    body: JSON.stringify({ word, meaning, example, pronunciation })
  })
}

// Delete a vocabulary word
export async function deleteVocabWord(id) {
  return apiRequest(`/vocabulary/${id}`, { method: 'DELETE' })
}

// Get random words for revision
export async function getRandomVocab() {
  return apiRequest('/vocabulary/random')
}

// ============================================
// GOALS API
// ============================================

export async function getGoals() {
  return apiRequest('/goals')
}

export async function setGoal({ type, target }) {
  return apiRequest('/goals', {
    method: 'POST',
    body: JSON.stringify({ type, target })
  })
}

export async function updateGoalProgress(id, increment = 1) {
  return apiRequest(`/goals/${id}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ increment })
  })
}

// ============================================
// HEALTH CHECK
// ============================================

export async function checkBackendHealth() {
  return apiRequest('/health')
}
