// Learn.jsx - The Learn mode page
// Shows educational content about the selected situation before practicing

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLearnContent } from '../utils/api'
import useAppStore from '../store/appStore'
import { SITUATIONS, DIFFICULTIES } from '../utils/aiPrompts'
import { useSpeech } from '../hooks/useSpeech'

// Static fallback content when AI is unavailable
const STATIC_CONTENT = {
  interview: {
    introduction: "A job interview is a conversation where an employer asks you questions to decide if you are the right person for the job. Being prepared, confident, and clear will help you make a great impression.",
    keyPhrases: [
      { phrase: "I have experience in...", usage: "To mention your skills or background", example: "I have experience in web development and worked on several React projects." },
      { phrase: "My greatest strength is...", usage: "To highlight a positive quality about yourself", example: "My greatest strength is my ability to learn new technologies quickly." },
      { phrase: "I am particularly interested in...", usage: "To show enthusiasm for the role", example: "I am particularly interested in this role because it aligns with my career goals in AI." },
      { phrase: "I believe I can contribute by...", usage: "To explain what you offer the company", example: "I believe I can contribute by bringing fresh ideas and strong technical skills." },
      { phrase: "One challenge I faced was...", usage: "To explain how you handle difficulties", example: "One challenge I faced was managing a tight deadline, but I prioritized tasks effectively." },
    ],
    vocabulary: [
      { word: "Professional", meaning: "Related to work or career; skilled and competent", example: "She always maintains a professional attitude during meetings." },
      { word: "Initiative", meaning: "The ability to take action without being told to", example: "He showed great initiative by volunteering to lead the project." },
      { word: "Collaborate", meaning: "To work together with others toward a common goal", example: "I love to collaborate with my teammates to solve complex problems." },
      { word: "Motivated", meaning: "Having a strong desire to achieve something", example: "I am motivated to continuously improve my technical skills." },
      { word: "Adaptable", meaning: "Able to change to suit new situations", example: "Being adaptable helped me succeed in different types of projects." },
    ],
    sampleConversation: [
      { speaker: "Aira (Interviewer)", text: "Tell me about yourself." },
      { speaker: "You", text: "I'm a final-year Computer Science student with a passion for web development. I've built several projects using React and Node.js, and I'm eager to apply my skills in a real-world setting." },
      { speaker: "Aira", text: "That's great! Can you tell me about one project you're particularly proud of?" },
      { speaker: "You", text: "I built a task management app that helps students organize their college work. It has features like deadlines, reminders, and progress tracking." },
      { speaker: "Aira", text: "Impressive! What technologies did you use for that?" },
      { speaker: "You", text: "I used React for the frontend, Node.js and Express for the backend, and MongoDB for the database." },
    ],
    tips: [
      "Research the company before the interview — know their products, values, and recent news",
      "Practice your answers out loud — speaking is different from writing",
      "Use the STAR method: Situation, Task, Action, Result — for behavioral questions",
      "Prepare 2-3 questions to ask the interviewer at the end",
      "Speak slowly and clearly — it shows confidence, not nervousness",
    ],
    commonMistakes: [
      "Giving vague answers without specific examples — always use real situations",
      "Speaking too fast when nervous — take a breath and slow down",
      "Not asking any questions at the end — it shows you're not interested",
      "Being negative about previous experiences or people",
    ]
  },
  college: {
    introduction: "College conversations happen every day — from introducing yourself on the first day to discussing assignments with classmates or asking lecturers for help. Clear, friendly communication makes college life much easier and more enjoyable.",
    keyPhrases: [
      { phrase: "Hi, I'm... I'm studying...", usage: "To introduce yourself to new classmates", example: "Hi, I'm Priya. I'm studying Computer Science, second year." },
      { phrase: "Could you explain...?", usage: "To politely ask for clarification", example: "Could you explain how recursion works? I'm a bit confused." },
      { phrase: "I was wondering if...", usage: "To ask a question politely", example: "I was wondering if we could form a study group for the exam." },
      { phrase: "In my opinion...", usage: "To share your view in a discussion", example: "In my opinion, the best approach for this project is to use agile methods." },
      { phrase: "Could I ask for an extension on...?", usage: "To request more time from a lecturer", example: "Could I ask for an extension on the assignment? I've been unwell this week." },
    ],
    vocabulary: [
      { word: "Assignment", meaning: "A task or piece of work given by a teacher", example: "The assignment is due next Friday." },
      { word: "Curriculum", meaning: "The subjects included in a course of study", example: "The curriculum includes mathematics, programming, and databases." },
      { word: "Semester", meaning: "Half of an academic year", example: "We have six subjects this semester." },
      { word: "Faculty", meaning: "The teachers and professors at a college", example: "The faculty is very supportive of student research." },
      { word: "Extracurricular", meaning: "Activities outside the regular academic program", example: "I enjoy extracurricular activities like debate and robotics." },
    ],
    sampleConversation: [
      { speaker: "Aira (Classmate)", text: "Hi! I haven't seen you before. Are you new here?" },
      { speaker: "You", text: "Yes, I just joined this semester. I'm studying Computer Science. My name is Rahul." },
      { speaker: "Aira", text: "Oh nice! I'm Aira. I'm in my second year of CS too. Which subjects are you taking?" },
      { speaker: "You", text: "I have Data Structures, Operating Systems, and Web Development. What about you?" },
      { speaker: "Aira", text: "Same! Maybe we can study together for Data Structures — that one's tough!" },
    ],
    tips: [
      "Use polite language when speaking with lecturers — it shows respect",
      "It's okay to say 'I don't understand — could you please repeat that?'",
      "Join study groups — discussing topics with others helps you remember better",
      "Be confident when asking questions in class — others probably have the same question",
    ],
    commonMistakes: [
      "Being too formal with classmates — keep it friendly and natural",
      "Saying 'Sir/Ma'am' excessively — use it once, then continue naturally",
      "Staying silent when you're confused — always ask for help",
    ]
  },
  discussion: {
    introduction: "Group discussions test your ability to think clearly, express your opinions confidently, and engage respectfully with others' ideas. The goal is not to 'win' the discussion, but to contribute meaningfully.",
    keyPhrases: [
      { phrase: "I would like to start by saying...", usage: "To open a discussion confidently", example: "I would like to start by saying that social media has both positive and negative effects." },
      { phrase: "I agree with your point, and I would add...", usage: "To agree and build on someone's idea", example: "I agree with your point about technology, and I would add that it also creates job opportunities." },
      { phrase: "I see your point, however...", usage: "To politely disagree", example: "I see your point about privacy concerns, however, the benefits of digital connectivity outweigh the risks." },
      { phrase: "Could you elaborate on that?", usage: "To ask someone to explain further", example: "That's an interesting point. Could you elaborate on how that would work in practice?" },
      { phrase: "To summarize what we've discussed...", usage: "To conclude a discussion", example: "To summarize what we've discussed, most of us agree that regulation is needed." },
    ],
    vocabulary: [
      { word: "Perspective", meaning: "A particular way of thinking about something", example: "From a student's perspective, online learning has many advantages." },
      { word: "Argument", meaning: "A reason given to support or oppose an idea", example: "Her argument about climate change was very well supported." },
      { word: "Consensus", meaning: "General agreement among a group", example: "The team reached a consensus that the project should be delayed." },
      { word: "Counterpoint", meaning: "An argument made against another argument", example: "He raised an interesting counterpoint about the cost of renewable energy." },
    ],
    sampleConversation: [
      { speaker: "Aira", text: "Let's discuss whether social media does more harm than good. I'll start — I think it creates more harm because it spreads misinformation quickly." },
      { speaker: "You", text: "I see your point about misinformation. However, social media also allows people to connect across the world and share important information during emergencies." },
      { speaker: "Aira", text: "That's a fair point. But doesn't it also increase anxiety and comparison among young people?" },
      { speaker: "You", text: "Yes, that's a valid concern. I think the key is regulation and digital literacy education rather than avoiding it altogether." },
    ],
    tips: [
      "Listen actively — don't just wait for your turn to speak",
      "Support your opinions with examples and facts",
      "Acknowledge other people's points before disagreeing — it shows respect",
      "Keep your language calm and professional even when disagreeing",
    ],
    commonMistakes: [
      "Dominating the discussion — give others a chance to speak",
      "Saying 'You're wrong' — instead say 'I see it differently'",
      "Going off-topic — always relate your points back to the main discussion",
    ]
  },
  speaking: {
    introduction: "Public speaking is about communicating your ideas clearly and confidently to an audience. Whether it's a college presentation, a speech, or an interview, the same principles apply: structure, clarity, and confidence.",
    keyPhrases: [
      { phrase: "Good morning/afternoon, today I'll be speaking about...", usage: "To start a speech or presentation", example: "Good afternoon. Today I'll be speaking about the impact of artificial intelligence on education." },
      { phrase: "Let me start with...", usage: "To introduce your first point", example: "Let me start with the history of AI and how it has evolved over the last decade." },
      { phrase: "Moving on to...", usage: "To transition between topics smoothly", example: "Moving on to the practical applications, let's look at how AI is used in classrooms today." },
      { phrase: "For example...", usage: "To give a concrete example", example: "For example, tools like ChatGPT help students understand difficult concepts." },
      { phrase: "In conclusion, I'd like to say...", usage: "To wrap up your speech", example: "In conclusion, I'd like to say that AI is not a threat to education, but a powerful tool." },
    ],
    vocabulary: [
      { word: "Articulate", meaning: "To express ideas clearly and effectively", example: "She articulated her points very clearly during the presentation." },
      { word: "Engage", meaning: "To capture and hold the audience's attention", example: "He used humor to engage the audience during his speech." },
      { word: "Transition", meaning: "Moving smoothly from one topic to another", example: "Good transitions make a speech flow naturally." },
    ],
    sampleConversation: [
      { speaker: "You (opening)", text: "Good afternoon, everyone. Today I'm going to talk about renewable energy and why it matters for our future." },
      { speaker: "Aira (audience)", text: "Great introduction! Now explain your first main point." },
      { speaker: "You", text: "Let me start with the problem. Currently, 80% of our energy comes from fossil fuels, which release carbon dioxide and contribute to climate change." },
      { speaker: "Aira", text: "Good! Now give an example to make it more concrete." },
    ],
    tips: [
      "Practice your speech out loud multiple times before delivering it",
      "Make eye contact with different parts of the audience",
      "Use pauses deliberately — they give the audience time to absorb your points",
      "Start with a strong opening: a question, a fact, or a short story",
    ],
    commonMistakes: [
      "Reading directly from slides or notes — know your content well",
      "Speaking too fast when nervous — slow down and breathe",
      "Using 'um', 'uh', 'like' too often — practice replacing these with pauses",
    ]
  },
  everyday: {
    introduction: "Everyday English is the natural, informal language we use in daily life. It's different from formal English — it's more relaxed, uses contractions, and relies on common expressions. The goal is to communicate naturally and comfortably.",
    keyPhrases: [
      { phrase: "Nice to meet you!", usage: "When meeting someone for the first time", example: "Hi! I'm Rahul. Nice to meet you!" },
      { phrase: "How's it going?", usage: "A casual greeting (similar to 'How are you?')", example: "Hey! How's it going? Haven't seen you in a while!" },
      { phrase: "Could you help me with...?", usage: "To politely ask for help", example: "Excuse me, could you help me find the nearest bus stop?" },
      { phrase: "I'll take...", usage: "When ordering food or choosing something", example: "I'll take a coffee and a sandwich, please." },
      { phrase: "Actually...", usage: "To gently correct or add information", example: "Actually, I think the library closes at 6 PM, not 5 PM." },
    ],
    vocabulary: [
      { word: "Grab", meaning: "To get something quickly (informal)", example: "Let's grab some coffee before class." },
      { word: "Catch up", meaning: "To talk with someone you haven't seen recently", example: "We should catch up sometime — it's been ages!" },
      { word: "Figure out", meaning: "To understand or solve something", example: "I'm still trying to figure out how to get to the new campus." },
    ],
    sampleConversation: [
      { speaker: "Aira", text: "Hey! Are you new here? I haven't seen you around before." },
      { speaker: "You", text: "Yes, I just moved here last week! I'm still getting used to everything. My name's Priya." },
      { speaker: "Aira", text: "Oh cool! Welcome! I'm Aira. What do you think of the area so far?" },
      { speaker: "You", text: "It seems really nice! But I'm still figuring out where everything is. Do you know any good cafes nearby?" },
      { speaker: "Aira", text: "Oh definitely! There's a great place called 'The Bean' about five minutes from here. They have amazing coffee!" },
    ],
    tips: [
      "Listen to English podcasts and music to pick up natural expressions",
      "Don't be afraid of making mistakes — native speakers make mistakes too",
      "Use contractions (I'm, don't, can't) to sound more natural",
      "Learn common phrasal verbs like 'give up', 'look forward to', 'run into'",
    ],
    commonMistakes: [
      "Being too formal in casual conversations — it can sound awkward",
      "Translating directly from your native language — think in English",
      "Not using filler words when needed — 'Well...', 'So...', 'Actually...' sound natural",
    ]
  }
}

export default function Learn() {
  const navigate = useNavigate()
  const { selectedSituation, selectedDifficulty, setMode } = useAppStore()
  const { speak, stopSpeaking, isSynthesisSupported } = useSpeech()
  
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('intro')
  const [playingPhrase, setPlayingPhrase] = useState(null)

  useEffect(() => {
    if (!selectedSituation) { navigate('/'); return }
    loadContent()
  }, [selectedSituation, selectedDifficulty])

  const loadContent = async () => {
    setLoading(true)
    try {
      // Try to get AI-generated content
      const result = await getLearnContent({ 
        situation: selectedSituation, 
        difficulty: selectedDifficulty 
      })
      setContent(result.content)
    } catch (err) {
      // Fall back to static content
      setContent(STATIC_CONTENT[selectedSituation] || STATIC_CONTENT.interview)
    } finally {
      setLoading(false)
    }
  }

  const playPhrase = async (text, id) => {
    if (!isSynthesisSupported) return
    if (playingPhrase === id) {
      stopSpeaking()
      setPlayingPhrase(null)
      return
    }
    setPlayingPhrase(id)
    await speak(text, { onEnd: () => setPlayingPhrase(null) })
  }

  const startPractice = () => {
    setMode('practice')
    navigate('/conversation')
  }

  if (!selectedSituation) return null

  const sit = SITUATIONS[selectedSituation]
  const tabs = [
    { id: 'intro', label: '📖 Introduction' },
    { id: 'phrases', label: '💬 Key Phrases' },
    { id: 'vocab', label: '📚 Vocabulary' },
    { id: 'conversation', label: '🗣️ Sample Conversation' },
    { id: 'tips', label: '💡 Tips' },
  ]

  return (
    <div style={{ 
      minHeight: '100vh', 
      paddingTop: '80px',
      background: 'linear-gradient(180deg, #0f0a1e 0%, #1a1335 100%)',
      padding: '80px 1.5rem 3rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button onClick={() => navigate('/')} style={{
            background: 'none', border: 'none', color: '#9d99b8', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            marginBottom: '1rem', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem'
          }}>
            ← Back to Home
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '3rem' }}>{sit?.emoji}</div>
            <div>
              <h1 style={{ 
                fontFamily: 'Poppins, sans-serif', 
                color: '#f1f0f7', 
                fontSize: '1.75rem',
                marginBottom: '0.25rem'
              }}>
                Learn: {sit?.name}
              </h1>
              <p style={{ color: '#9d99b8', fontSize: '0.9rem' }}>
                {DIFFICULTIES[selectedDifficulty]?.emoji} {DIFFICULTIES[selectedDifficulty]?.name} level · Study the content below, then start practicing
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(35,26,64,0.8)',
                border: `1px solid ${activeTab === tab.id ? '#6366f1' : 'rgba(99,102,241,0.2)'}`,
                borderRadius: '10px',
                padding: '0.5rem 0.9rem',
                color: activeTab === tab.id ? '#fff' : '#9d99b8',
                cursor: 'pointer',
                fontSize: '0.82rem',
                whiteSpace: 'nowrap',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9d99b8' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Loading learning content...</p>
          </div>
        )}

        {/* Content */}
        {!loading && content && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            
            {/* Introduction Tab */}
            {activeTab === 'intro' && (
              <div style={{ 
                background: 'rgba(35,26,64,0.8)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '20px',
                padding: '1.75rem'
              }}>
                <h2 style={{ color: '#a5b4fc', marginBottom: '1rem', fontFamily: 'Poppins, sans-serif' }}>
                  What is {sit?.name}?
                </h2>
                <p style={{ color: '#d4d2e3', lineHeight: 1.8, fontSize: '0.95rem' }}>
                  {content.introduction}
                </p>
                
                {content.commonMistakes && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ color: '#fcd34d', marginBottom: '0.75rem', fontSize: '1rem' }}>
                      ⚠️ Common Mistakes to Avoid
                    </h3>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {content.commonMistakes.map((mistake, i) => (
                        <li key={i} style={{
                          display: 'flex', gap: '0.75rem',
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.15)',
                          borderRadius: '10px',
                          padding: '0.6rem 0.9rem',
                          color: '#fca5a5',
                          fontSize: '0.875rem'
                        }}>
                          <span>✗</span> {mistake}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Key Phrases Tab */}
            {activeTab === 'phrases' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {content.keyPhrases?.map((item, i) => (
                  <div key={i} style={{
                    background: 'rgba(35,26,64,0.8)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: '16px',
                    padding: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          color: '#a5b4fc', 
                          fontWeight: 600, 
                          fontSize: '1rem',
                          marginBottom: '0.25rem',
                          fontFamily: 'Poppins, sans-serif'
                        }}>
                          "{item.phrase}"
                        </div>
                        <div style={{ color: '#9d99b8', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                          📌 {item.usage}
                        </div>
                        <div style={{ 
                          color: '#d4d2e3', 
                          fontSize: '0.875rem',
                          background: 'rgba(99,102,241,0.08)',
                          borderRadius: '8px',
                          padding: '0.5rem 0.75rem',
                          borderLeft: '3px solid #6366f1'
                        }}>
                          💬 {item.example}
                        </div>
                      </div>
                      {isSynthesisSupported && (
                        <button
                          onClick={() => playPhrase(item.example, `phrase-${i}`)}
                          style={{
                            background: playingPhrase === `phrase-${i}` ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.1)',
                            border: '1px solid rgba(99,102,241,0.3)',
                            borderRadius: '10px',
                            padding: '0.4rem 0.75rem',
                            color: '#a5b4fc',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            flexShrink: 0,
                            fontFamily: 'Inter, sans-serif'
                          }}
                        >
                          {playingPhrase === `phrase-${i}` ? '⏸ Stop' : '🔊 Hear'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vocabulary Tab */}
            {activeTab === 'vocab' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {content.vocabulary?.map((item, i) => (
                  <div key={i} style={{
                    background: 'rgba(35,26,64,0.8)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: '16px',
                    padding: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ 
                        color: '#c4b5fd', 
                        fontWeight: 700, 
                        fontSize: '1.1rem',
                        fontFamily: 'Poppins, sans-serif'
                      }}>
                        {item.word}
                      </span>
                      {isSynthesisSupported && (
                        <button
                          onClick={() => playPhrase(item.word, `word-${i}`)}
                          style={{
                            background: 'rgba(99,102,241,0.1)',
                            border: 'none', borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            color: '#a5b4fc', cursor: 'pointer', fontSize: '0.75rem',
                            fontFamily: 'Inter, sans-serif'
                          }}
                        >
                          🔊
                        </button>
                      )}
                    </div>
                    <p style={{ color: '#9d99b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      {item.meaning}
                    </p>
                    <p style={{ 
                      color: '#d4d2e3', fontSize: '0.82rem',
                      background: 'rgba(99,102,241,0.08)',
                      borderRadius: '6px', padding: '0.4rem 0.6rem',
                      borderLeft: '2px solid #8b5cf6',
                      fontStyle: 'italic'
                    }}>
                      "{item.example}"
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Sample Conversation Tab */}
            {activeTab === 'conversation' && (
              <div style={{
                background: 'rgba(35,26,64,0.8)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '20px',
                padding: '1.5rem'
              }}>
                <h2 style={{ color: '#a5b4fc', marginBottom: '1.25rem', fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem' }}>
                  📝 Sample Conversation
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {content.sampleConversation?.map((line, i) => {
                    const isAira = line.speaker.toLowerCase().includes('aira')
                    return (
                      <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '32px', height: '32px',
                          borderRadius: '50%',
                          background: isAira 
                            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                            : 'rgba(99,102,241,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.85rem', flexShrink: 0
                        }}>
                          {isAira ? '✨' : '👤'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#6b6887', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                            {line.speaker}
                          </div>
                          <div style={{
                            background: isAira ? 'rgba(99,102,241,0.08)' : 'rgba(139,92,246,0.1)',
                            border: `1px solid ${isAira ? 'rgba(99,102,241,0.2)' : 'rgba(139,92,246,0.2)'}`,
                            borderRadius: isAira ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                            padding: '0.65rem 0.9rem',
                            color: '#d4d2e3',
                            fontSize: '0.9rem',
                            lineHeight: 1.5
                          }}>
                            {line.text}
                          </div>
                        </div>
                        {isSynthesisSupported && (
                          <button
                            onClick={() => playPhrase(line.text, `conv-${i}`)}
                            style={{
                              background: 'none', border: 'none',
                              color: '#6b6887', cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0
                            }}
                          >
                            {playingPhrase === `conv-${i}` ? '⏸' : '🔊'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tips Tab */}
            {activeTab === 'tips' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{
                  background: 'rgba(35,26,64,0.8)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '20px',
                  padding: '1.5rem'
                }}>
                  <h2 style={{ color: '#a5b4fc', marginBottom: '1.25rem', fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem' }}>
                    💡 Expert Tips for {sit?.name}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {content.tips?.map((tip, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                        background: 'rgba(99,102,241,0.08)',
                        border: '1px solid rgba(99,102,241,0.15)',
                        borderRadius: '12px',
                        padding: '0.75rem 1rem'
                      }}>
                        <span style={{ 
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          borderRadius: '50%',
                          width: '24px', height: '24px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                          flexShrink: 0
                        }}>
                          {i + 1}
                        </span>
                        <p style={{ color: '#d4d2e3', fontSize: '0.9rem', lineHeight: 1.6 }}>{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA at bottom */}
        {!loading && (
          <div style={{ 
            marginTop: '2rem',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button onClick={startPractice} className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
              🎙️ Start Practicing Now
            </button>
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              ← Change Situation
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}
