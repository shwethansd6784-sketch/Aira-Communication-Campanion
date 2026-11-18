// Vocabulary.jsx - Personal vocabulary notebook
// Users can save, search, and review words they learn during conversations

import React, { useState, useEffect, useCallback } from 'react'
import { getVocabulary, saveVocabWord, deleteVocabWord } from '../utils/api'
import { useSpeech } from '../hooks/useSpeech'

export default function VocabularyPage() {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [playingWord, setPlayingWord] = useState(null)
  const [error, setError] = useState(null)
  const [addForm, setAddForm] = useState({ word: '', meaning: '', example: '', pronunciation: '' })
  const [addError, setAddError] = useState(null)
  const [addSuccess, setAddSuccess] = useState(false)
  
  const { speak, stopSpeaking, isSynthesisSupported } = useSpeech()

  const loadWords = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getVocabulary(search)
      setWords(result.words || [])
      setError(null)
    } catch (err) {
      setError('Could not load vocabulary. Make sure the backend server is running.')
      setWords([])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(loadWords, 300) // Debounce search
    return () => clearTimeout(timer)
  }, [loadWords])

  const handleAddWord = async (e) => {
    e.preventDefault()
    setAddError(null)
    
    if (!addForm.word.trim() || !addForm.meaning.trim()) {
      setAddError('Word and meaning are required')
      return
    }
    
    try {
      await saveVocabWord(addForm)
      setAddForm({ word: '', meaning: '', example: '', pronunciation: '' })
      setAddSuccess(true)
      setTimeout(() => setAddSuccess(false), 2000)
      setShowAddForm(false)
      loadWords()
    } catch (err) {
      setAddError('Failed to save word. ' + err.message)
    }
  }

  const handleDelete = async (id, word) => {
    if (!window.confirm(`Remove "${word}" from your vocabulary notebook?`)) return
    try {
      await deleteVocabWord(id)
      setWords(w => w.filter(word => word.id !== id))
    } catch (err) {
      alert('Failed to remove word')
    }
  }

  const handlePlayWord = async (word, id) => {
    if (!isSynthesisSupported) return
    if (playingWord === id) {
      stopSpeaking()
      setPlayingWord(null)
      return
    }
    setPlayingWord(id)
    await speak(word, { onEnd: () => setPlayingWord(null) })
  }

  return (
    <div style={{
      minHeight: '100vh',
      paddingTop: '80px',
      background: 'linear-gradient(180deg, #0f0a1e 0%, #1a1335 100%)',
      padding: '80px 1.5rem 3rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', color: '#f1f0f7', fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              📖 Vocabulary Notebook
            </h1>
            <p style={{ color: '#9d99b8', fontSize: '0.9rem' }}>
              Save and review words you learn during your practice sessions
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
          >
            + Add Word
          </button>
        </div>

        {/* Add word form */}
        {showAddForm && (
          <div style={{
            background: 'rgba(35,26,64,0.9)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '20px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            animation: 'slideInUp 0.3s ease'
          }}>
            <h3 style={{ color: '#a5b4fc', marginBottom: '1.25rem', fontFamily: 'Poppins, sans-serif' }}>
              Add New Word
            </h3>
            <form onSubmit={handleAddWord}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ color: '#9d99b8', fontSize: '0.82rem', display: 'block', marginBottom: '0.4rem' }}>
                    Word *
                  </label>
                  <input
                    className="input"
                    placeholder="e.g., Eloquent"
                    value={addForm.word}
                    onChange={e => setAddForm(f => ({ ...f, word: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ color: '#9d99b8', fontSize: '0.82rem', display: 'block', marginBottom: '0.4rem' }}>
                    Meaning *
                  </label>
                  <input
                    className="input"
                    placeholder="e.g., Speaking fluently and clearly"
                    value={addForm.meaning}
                    onChange={e => setAddForm(f => ({ ...f, meaning: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ color: '#9d99b8', fontSize: '0.82rem', display: 'block', marginBottom: '0.4rem' }}>
                    Example sentence
                  </label>
                  <input
                    className="input"
                    placeholder="e.g., She gave an eloquent speech."
                    value={addForm.example}
                    onChange={e => setAddForm(f => ({ ...f, example: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ color: '#9d99b8', fontSize: '0.82rem', display: 'block', marginBottom: '0.4rem' }}>
                    Pronunciation hint (optional)
                  </label>
                  <input
                    className="input"
                    placeholder="e.g., EL-uh-kwent"
                    value={addForm.pronunciation}
                    onChange={e => setAddForm(f => ({ ...f, pronunciation: e.target.value }))}
                  />
                </div>
              </div>
              
              {addError && (
                <div style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  ⚠️ {addError}
                </div>
              )}
              
              {addSuccess && (
                <div style={{ color: '#6ee7b7', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  ✅ Word saved successfully!
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary">Save Word</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <span style={{
            position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
            color: '#6b6887', fontSize: '1rem'
          }}>🔍</span>
          <input
            className="input"
            placeholder="Search your vocabulary..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Word count */}
        {!loading && (
          <div style={{ color: '#6b6887', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {words.length} word{words.length !== 1 ? 's' : ''} in your notebook
            {search && ` matching "${search}"`}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '16px', padding: '1.5rem', textAlign: 'center'
          }}>
            <p style={{ color: '#fca5a5' }}>⚠️ {error}</p>
            <p style={{ color: '#9d99b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Make sure the backend server is running. Run <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>npm start</code> in the backend folder.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9d99b8' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Loading vocabulary...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && words.length === 0 && (
          <div style={{
            background: 'rgba(35,26,64,0.8)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '24px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
            <h3 style={{ color: '#a5b4fc', fontFamily: 'Poppins, sans-serif', marginBottom: '0.5rem' }}>
              {search ? `No words found for "${search}"` : 'Your vocabulary notebook is empty'}
            </h3>
            <p style={{ color: '#9d99b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {search 
                ? 'Try a different search term or add this word manually.'
                : 'Save words you encounter during practice sessions, or add them manually using the button above.'
              }
            </p>
            {!search && (
              <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
                + Add Your First Word
              </button>
            )}
          </div>
        )}

        {/* Words grid */}
        {!loading && !error && words.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {words.map(word => (
              <div key={word.id} style={{
                background: 'rgba(35,26,64,0.8)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '16px',
                padding: '1.25rem',
                transition: 'all 0.3s',
                animation: 'fadeIn 0.3s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ 
                    color: '#c4b5fd', 
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '1.1rem',
                    textTransform: 'capitalize'
                  }}>
                    {word.word}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {isSynthesisSupported && (
                      <button
                        onClick={() => handlePlayWord(word.word, word.id)}
                        style={{
                          background: playingWord === word.id ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.1)',
                          border: 'none', borderRadius: '8px',
                          padding: '0.3rem 0.5rem',
                          color: '#a5b4fc', cursor: 'pointer', fontSize: '0.85rem',
                          fontFamily: 'Inter, sans-serif'
                        }}
                      >
                        {playingWord === word.id ? '⏸' : '🔊'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(word.id, word.word)}
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: 'none', borderRadius: '8px',
                        padding: '0.3rem 0.5rem',
                        color: '#fca5a5', cursor: 'pointer', fontSize: '0.85rem',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {word.pronunciation && (
                  <div style={{ color: '#6b6887', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                    /{word.pronunciation}/
                  </div>
                )}
                
                <p style={{ color: '#d4d2e3', fontSize: '0.875rem', marginBottom: '0.6rem', lineHeight: 1.5 }}>
                  {word.meaning}
                </p>
                
                {word.example && (
                  <p style={{ 
                    color: '#9d99b8', 
                    fontSize: '0.82rem',
                    background: 'rgba(99,102,241,0.08)',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                    borderLeft: '2px solid #6366f1',
                    fontStyle: 'italic',
                    lineHeight: 1.5
                  }}>
                    "{word.example}"
                  </p>
                )}
                
                <div style={{ marginTop: '0.75rem', color: '#6b6887', fontSize: '0.72rem' }}>
                  Saved {new Date(word.saved_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        {!loading && !error && (
          <div style={{
            marginTop: '2rem',
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: '16px',
            padding: '1.25rem'
          }}>
            <h3 style={{ color: '#a5b4fc', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              💡 Vocabulary Building Tips
            </h3>
            <ul style={{ color: '#9d99b8', fontSize: '0.85rem', lineHeight: 1.9, listStyle: 'none' }}>
              <li>📌 Save words you encounter during Aira conversations</li>
              <li>🔊 Click the speaker icon to hear the correct pronunciation</li>
              <li>✍️ Try using new words in your next practice session</li>
              <li>🔄 Review your saved words regularly to remember them</li>
            </ul>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
