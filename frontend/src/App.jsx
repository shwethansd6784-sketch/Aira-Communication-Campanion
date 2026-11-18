// App.jsx - Root component with routing
// React Router handles navigation between different pages

import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Conversation from './pages/Conversation'
import Learn from './pages/Learn'
import Dashboard from './pages/Dashboard'
import VocabularyPage from './pages/Vocabulary'
import Settings from './pages/Settings'
import Navigation from './components/UI/Navigation'

function App() {
  return (
    <Router>
      {/* Navigation bar shown on all pages */}
      <Navigation />
      
      {/* Routes define which component shows for which URL */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/conversation" element={<Conversation />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vocabulary" element={<VocabularyPage />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  )
}

export default App
