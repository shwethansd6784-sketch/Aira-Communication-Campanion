// aiPrompts.js - Situation and mode specific conversation starters
// These are the opening messages Aira sends when a session starts

export const SITUATIONS = {
  college: {
    id: 'college',
    name: 'College Conversation',
    emoji: '🎓',
    description: 'Practice speaking with classmates, lecturers, and seniors',
    color: '#6366f1',
    bgGradient: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))',
    topics: ['Introducing yourself', 'Talking to classmates', 'Asking questions', 'Discussing assignments', 'College activities']
  },
  interview: {
    id: 'interview',
    name: 'Job Interview',
    emoji: '💼',
    description: 'Practice job and internship interviews with an AI interviewer',
    color: '#06b6d4',
    bgGradient: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(99,102,241,0.2))',
    topics: ['Tell me about yourself', 'Strengths & weaknesses', 'Career goals', 'Project explanations', 'Technical questions']
  },
  discussion: {
    id: 'discussion',
    name: 'Group Discussion',
    emoji: '🗣️',
    description: 'Learn to express opinions, argue politely, and lead discussions',
    color: '#10b981',
    bgGradient: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(6,182,212,0.2))',
    topics: ['Expressing opinions', 'Agreeing/disagreeing', 'Supporting arguments', 'Entering discussions', 'Concluding ideas']
  },
  speaking: {
    id: 'speaking',
    name: 'Public Speaking',
    emoji: '🎤',
    description: 'Improve your presentation and speech delivery skills',
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(239,68,68,0.2))',
    topics: ['Speech introductions', 'Organizing ideas', 'Using examples', 'Smooth transitions', 'Powerful conclusions']
  },
  everyday: {
    id: 'everyday',
    name: 'Everyday English',
    emoji: '☀️',
    description: 'Practice natural English for daily life situations',
    color: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(99,102,241,0.2))',
    topics: ['Meeting people', 'Shopping', 'Ordering food', 'Asking directions', 'Casual conversations']
  }
}

export const MODES = {
  learn: {
    id: 'learn',
    name: 'Learn',
    emoji: '📚',
    description: 'Study phrases, vocabulary, and sample conversations before practicing',
    color: '#6366f1'
  },
  practice: {
    id: 'practice',
    name: 'Practice',
    emoji: '🎯',
    description: 'Have a guided conversation with hints and gentle feedback',
    color: '#10b981'
  },
  challenge: {
    id: 'challenge',
    name: 'Challenge',
    emoji: '🏆',
    description: 'Real-world simulation with performance evaluation at the end',
    color: '#f59e0b'
  }
}

export const DIFFICULTIES = {
  beginner: {
    id: 'beginner',
    name: 'Beginner',
    emoji: '🌱',
    description: 'Simple questions, helpful hints, more time to answer',
    color: '#10b981'
  },
  intermediate: {
    id: 'intermediate',
    name: 'Intermediate',
    emoji: '🌿',
    description: 'More detailed questions, some follow-ups, fewer hints',
    color: '#f59e0b'
  },
  advanced: {
    id: 'advanced',
    name: 'Advanced',
    emoji: '🌳',
    description: 'Challenging questions, unexpected follow-ups, detailed evaluation',
    color: '#ef4444'
  }
}

// Opening messages Aira sends at the start of each situation + mode combination
export function getOpeningMessage(situation, mode, difficulty) {
  const openers = {
    college: {
      learn: "Hi there! 👋 I'm Aira, and today we'll learn how to have great conversations in college. College can feel overwhelming at first, but with the right words and phrases, you'll feel confident in no time! Let's start by understanding common college situations and how to handle them. Ready to learn?",
      practice: "Hey! Welcome to college conversation practice! 🎓 I'll be your classmate, senior, or lecturer depending on what we're practicing. Let's start with something simple — how would you introduce yourself to a new classmate on the first day of college?",
      challenge: "Welcome to the College Conversation Challenge! 🏆 I'll play different roles — classmate, senior, lecturer — and you need to respond naturally. I won't give hints, so do your best! We'll start with your first day of college. Ready? Let's go! 🎓"
    },
    interview: {
      learn: "Hello! 👋 Great choice — job interviews can be nerve-wracking, but practice makes perfect! Today I'll teach you everything about acing interviews: what questions to expect, how to structure your answers, what vocabulary to use, and common mistakes to avoid. Let's dive in!",
      practice: "Good day! I'm Aira, and today I'll be your interview practice partner. 💼 I'll ask you interview questions just like a real HR professional would, and I'll give you friendly feedback after each answer. Remember — this is a safe space to practice! Tell me, what position are you preparing for today?",
      challenge: "Welcome to the Job Interview Challenge! 🏆 This simulation will feel like a real interview. I won't give hints or corrections during the interview — just like the real thing. I'll evaluate your performance at the end. Take a deep breath, and let's begin! So, please tell me about yourself."
    },
    discussion: {
      learn: "Hello! 🗣️ Group discussions can feel intimidating — everyone speaks at once, ideas clash, and you need to make your point clearly. But don't worry! I'll teach you exactly how to enter discussions, express opinions, agree and disagree politely, and make a strong impression. Let's learn together!",
      practice: "Hi! Today we'll practice group discussion skills. 💬 I'll act as another participant in a discussion, and we'll explore different topics together. I'll help you practice expressing your opinions clearly and respectfully. Let's start with a simple topic: **Should mobile phones be allowed in classrooms?** What do you think?",
      challenge: "Welcome to the Group Discussion Challenge! 🏆 We'll have a real discussion on a topic, and I'll evaluate your participation, reasoning, and language use at the end. No hints this time! The topic is: **Social media has more negative effects than positive ones.** Please share your opening thoughts!"
    },
    speaking: {
      learn: "Hello! 🎤 Public speaking is one of the most valuable skills you can have — and it gets easier with practice! Today I'll teach you how to structure a speech, use connecting phrases, engage your audience, and conclude powerfully. These skills work for presentations, speeches, and even interviews!",
      practice: "Hi! Welcome to Public Speaking Practice! 🎤 I'll be your audience and coach today. We'll practice one speaking skill at a time — introductions, body, conclusions, and more. Let's start simple: **Can you introduce yourself in 30 seconds as if you're starting a speech?** Go ahead!",
      challenge: "Welcome to the Public Speaking Challenge! 🏆 You'll deliver a short speech or presentation, and I'll evaluate your structure, clarity, examples, and delivery. No hints or corrections during your speech. Your topic is: **Talk about a technology you think will change the world in the next 10 years.** Take a moment to think, then begin!"
    },
    everyday: {
      learn: "Hi there! ☀️ Everyday English is about communicating naturally in real-life situations — meeting people, shopping, asking for help, and more. Today I'll teach you practical phrases and expressions that native speakers actually use. No formal textbook language — just real, natural English!",
      practice: "Hey! 😊 Great to meet you! I'm Aira, and today we'll practice everyday English conversations together. I'll create different real-life situations, and you just respond naturally. Don't worry about being perfect — just communicate! Let's start: **Imagine we just met at a coffee shop. How would you start a conversation with me?**",
      challenge: "Welcome to the Everyday English Challenge! ☀️ I'll put you in various real-life situations, and you need to respond naturally. I'll score your vocabulary, grammar, and naturalness at the end. First scenario: **You need to ask a stranger for directions to the nearest bus stop. Go ahead!**"
    }
  }

  const difficultyNote = difficulty === 'beginner' 
    ? " (I'll keep things simple and give you hints when needed 😊)" 
    : difficulty === 'advanced' 
    ? " (I'll challenge you with complex scenarios — no easy passes! 💪)"
    : ""

  return (openers[situation]?.[mode] || "Hello! I'm Aira, your communication companion. Let's start practicing!") + difficultyNote
}
