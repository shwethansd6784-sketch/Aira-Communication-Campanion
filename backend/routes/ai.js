// ai.js - AI conversation & evaluation routes powered by Google Gemini
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

// Situational definitions & prompts
const SITUATION_ROLES = {
  college: {
    role: "You are Aira, a supportive female college classmate, senior, or lecturer. Help the user practice college communication naturally.",
    topics: ["introductions", "classmate discussions", "asking lecturers questions", "assignments", "project presentations", "college campus life"]
  },
  interview: {
    role: "You are Aira, an encouraging yet professional female HR interviewer and communication coach. Conduct realistic job and internship interviews.",
    topics: ["tell me about yourself", "strengths & weaknesses", "why hire you", "project walkthrough", "career aspirations", "situational questions"]
  },
  discussion: {
    role: "You are Aira, a thoughtful female peer in a group discussion. Provide respectful counterpoints, help structure arguments, and guide discussion etiquette.",
    topics: ["opening statements", "expressing viewpoints", "constructive disagreement", "adding supporting data/examples", "summarizing discussions"]
  },
  speaking: {
    role: "You are Aira, an inspiring female public speaking coach. Guide the user through presentation hooks, clear structure, smooth transitions, and persuasive conclusions.",
    topics: ["speech openings", "signposting transitions", "using illustrative examples", "handling audience questions", "concluding with impact"]
  },
  everyday: {
    role: "You are Aira, a warm and friendly female communication companion for daily English conversations.",
    topics: ["meeting new people", "cafes and dining", "shopping", "asking directions", "casual catch-ups", "making travel plans"]
  }
};

const MODE_PROMPTS = {
  learn: "LEARN MODE: Teach and demonstrate English phrasing, vocabulary, and conversational tips step by step.",
  practice: "PRACTICE MODE: Ask ONE realistic question at a time. After the user responds, provide brief constructive feedback if needed and ask an organic follow-up.",
  challenge: "CHALLENGE MODE: Conduct a realistic mock session. Do not give direct hints during the session. Test the user's spontaneity and depth."
};

const DIFFICULTY_PROMPTS = {
  beginner: "BEGINNER LEVEL: Use simple, clear vocabulary and concise sentences. Be very encouraging, patient, and provide gentle guidance.",
  intermediate: "INTERMEDIATE LEVEL: Use natural professional/conversational English. Ask meaningful follow-ups. Expect structured thoughts.",
  advanced: "ADVANCED LEVEL: Use sophisticated vocabulary and nuanced reasoning. Ask challenging follow-up questions to test clarity and depth."
};

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { messages, situation = 'everyday', mode = 'practice', difficulty = 'intermediate', sessionContext = '' } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const genAI = getGeminiClient();
    const lastUserMessage = messages[messages.length - 1];

    if (!genAI) {
      // Offline fallback: intelligent situational responses
      const fallbackReply = generateFallbackChatResponse(situation, mode, difficulty, messages);
      return res.json({
        response: fallbackReply,
        isFallback: true
      });
    }

    const situationInfo = SITUATION_ROLES[situation] || SITUATION_ROLES.everyday;
    const modeInfo = MODE_PROMPTS[mode] || MODE_PROMPTS.practice;
    const diffInfo = DIFFICULTY_PROMPTS[difficulty] || DIFFICULTY_PROMPTS.intermediate;

    const systemInstruction = `
You are Aira, a warm, intelligent, and articulate female English communication companion.
Your goal is to help the user become a confident, natural English speaker.

ROLE & SITUATION:
${situationInfo.role}
Target Topics: ${situationInfo.topics.join(', ')}

CURRENT MODE:
${modeInfo}

DIFFICULTY LEVEL:
${diffInfo}

STRICT BEHAVIOR RULES:
1. Always maintain your persona as Aira: friendly, empathetic, honest, and constructive.
2. Listen carefully to what the user says. Always acknowledge their response specifically.
3. In Practice & Challenge mode, keep responses conversational and concise (2-4 sentences). Ask ONE follow-up question at a time.
4. Do NOT blindly praise poor or incomplete answers. Be constructively honest: mention what was good, what could be improved, and how.
5. If the user answers well, validate specifically what worked (e.g. "I love how you gave a concrete example...").
6. Remember facts the user shared earlier in this conversation (e.g., their background, major, or goals) and weave them into follow-ups.
7. Never invent personal achievements or experiences on the user's behalf.
8. Adapt your sentence complexity to the chosen difficulty level (${difficulty}).
${sessionContext ? `Session Context: ${sessionContext}` : ''}
    `.trim();

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction
    });

    // Format previous messages for Gemini chat history
    const history = [];
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      if (msg.role === 'user') {
        history.push({ role: 'user', parts: [{ text: msg.content }] });
      } else if (msg.role === 'aira' || msg.role === 'assistant' || msg.role === 'model') {
        history.push({ role: 'model', parts: [{ text: msg.content }] });
      }
    }

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastUserMessage.content);
    const responseText = result.response.text();

    return res.json({
      response: responseText.trim(),
      isFallback: false
    });

  } catch (error) {
    console.error('Gemini Chat Error:', error);
    const fallbackReply = generateFallbackChatResponse(req.body.situation, req.body.mode, req.body.difficulty, req.body.messages || []);
    return res.json({
      response: fallbackReply,
      isFallback: true,
      error: error.message
    });
  }
});

// POST /api/ai/evaluate
// Smart answer evaluation meeting Section 7 criteria
router.post('/evaluate', async (req, res) => {
  try {
    const { question = '', answer = '', situation = 'everyday', difficulty = 'intermediate' } = req.body;

    if (!answer || answer.trim() === '') {
      return res.status(400).json({ error: 'Answer cannot be empty' });
    }

    const genAI = getGeminiClient();

    if (!genAI) {
      const fallbackEval = generateFallbackEvaluation(question, answer, situation, difficulty);
      return res.json(fallbackEval);
    }

    const prompt = `
You are Aira, an expert English communication evaluator.
Evaluate the user's answer thoroughly and constructively based on these rules:
1. Understand what the question asks: "${question}"
2. Check whether the answer addresses it directly: "${answer}"
3. Identify what was good (strengths).
4. Identify what was missing or incomplete.
5. Identify weak, irrelevant, or grammatically awkward points.
6. Suggest improvements and explain why those points help.
7. Provide a realistic, improved sample answer in simple, natural English.
8. Score honestly between 0 and 100 (Relevance, Grammar, Vocabulary, Completeness, Overall).
9. Context: Situation is "${situation}", Difficulty is "${difficulty}".

Return ONLY valid JSON in this exact structure without markdown backticks:
{
  "scores": {
    "relevance": 80,
    "grammar": 75,
    "vocabulary": 70,
    "completeness": 65,
    "overall": 73
  },
  "strengths": ["Clear mention of your key interest", "Spoke in complete sentences"],
  "missingPoints": ["Did not connect your skills to the team's needs", "Missing a concrete example"],
  "weakPoints": ["The opening phrase was slightly informal for this context"],
  "whyImprovementHelps": "Giving a specific project example gives the interviewer tangible proof of your abilities rather than just claims.",
  "betterAnswer": "I have experience with Python and web development through my university projects. For instance, I built a data analysis tool that streamlined reporting, and I am excited to contribute that hands-on problem-solving to your team.",
  "encouragement": "You have a solid foundation! Try answering again by adding one specific project you worked on."
}
    `.trim();

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    let rawText = result.response.text().trim();
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(rawText);
    return res.json(parsed);

  } catch (error) {
    console.error('Gemini Evaluation Error:', error);
    const fallbackEval = generateFallbackEvaluation(req.body.question, req.body.answer, req.body.situation, req.body.difficulty);
    return res.json(fallbackEval);
  }
});

// POST /api/ai/learn-content
router.post('/learn-content', async (req, res) => {
  try {
    const { situation = 'interview', difficulty = 'intermediate' } = req.body;
    const genAI = getGeminiClient();

    if (!genAI) {
      return res.json({ content: getStaticLearnData(situation, difficulty), isFallback: true });
    }

    const prompt = `
Create comprehensive, high quality English learning content for situation: "${situation}" at "${difficulty}" level.
Return ONLY valid JSON without markdown fences:
{
  "introduction": "A welcoming 2-3 sentence overview of this situation.",
  "keyPhrases": [
    {"phrase": "Key phrase here", "usage": "When to use it", "example": "Real-world example"}
  ],
  "vocabulary": [
    {"word": "Word", "meaning": "Clear simple definition", "example": "Example in sentence"}
  ],
  "sampleConversation": [
    {"speaker": "Aira", "text": "Opening question or statement"},
    {"speaker": "You", "text": "Natural response"},
    {"speaker": "Aira", "text": "Follow-up question"},
    {"speaker": "You", "text": "Follow-up response"}
  ],
  "tips": ["Practical actionable tip 1", "Tip 2", "Tip 3", "Tip 4"],
  "commonMistakes": ["Common mistake 1", "Common mistake 2", "Common mistake 3"]
}
    `.trim();

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    let rawText = result.response.text().trim();
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(rawText);
    return res.json({ content: parsed, isFallback: false });

  } catch (error) {
    console.error('Learn Content Error:', error);
    return res.json({ content: getStaticLearnData(req.body.situation, req.body.difficulty), isFallback: true });
  }
});

// Rule-based fallback evaluator when API key is not yet set
function generateFallbackEvaluation(question, answer, situation, difficulty) {
  const text = (answer || '').trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  let relevance = 70;
  let grammar = 75;
  let vocabulary = 70;
  let completeness = 65;

  if (wordCount < 6) {
    relevance = 55;
    completeness = 45;
    vocabulary = 60;
  } else if (wordCount > 25) {
    relevance = 85;
    completeness = 85;
    vocabulary = 80;
  } else {
    relevance = 75;
    completeness = 70;
    vocabulary = 75;
  }

  // Check for common lower-case start or basic punctuation
  if (!/^[A-Z]/.test(text)) grammar -= 10;
  if (!/[.!?]$/.test(text)) grammar -= 10;

  const overall = Math.round((relevance + grammar + vocabulary + completeness) / 4);

  return {
    scores: { relevance, grammar, vocabulary, completeness, overall },
    strengths: [
      wordCount >= 6 ? "Good attempt expressing your thought clearly" : "Direct response",
      "Engaged with the question directly"
    ],
    missingPoints: [
      wordCount < 15 ? "Add more detail or an example to make your answer more convincing." : "Connect your thought to the bigger picture."
    ],
    weakPoints: [
      wordCount < 8 ? "Answer is quite short; in real conversations, elaborate slightly more." : "Try varying your sentence structure for smoother flow."
    ],
    whyImprovementHelps: "Giving extra context or a brief example helps the listener understand your thought process and demonstrates confidence.",
    betterAnswer: generateImprovedSample(question, answer, situation),
    encouragement: "Great effort! Try answering again using the suggested structure in your own natural style."
  };
}

function generateImprovedSample(question, answer, situation) {
  const cleanQ = (question || '').toLowerCase();
  if (cleanQ.includes('yourself')) {
    return "I am a dedicated student with a strong passion for technology and communication. Over the past year, I have built several projects that improved my practical skills, and I am always excited to learn and collaborate with others.";
  }
  if (cleanQ.includes('strength') || cleanQ.includes('hire')) {
    return "One of my greatest strengths is my adaptability and problem-solving mindset. For instance, when learning a new framework or tackling an unexpected challenge, I take the initiative to research and see it through to completion.";
  }
  if (cleanQ.includes('opinion') || cleanQ.includes('think')) {
    return "In my opinion, there are compelling points on both sides. On one hand, it brings great convenience, but on the other hand, we need thoughtful boundaries so that quality and focus are preserved.";
  }
  return `Building upon what you said: "${answer}", you can enrich it by saying: "To expand on that, I believe taking an active approach makes a meaningful difference, especially when collaborating towards a common goal."`;
}

function generateFallbackChatResponse(situation, mode, difficulty, messages) {
  const userMessages = messages.filter(m => m.role === 'user');
  const count = userMessages.length;
  const lastText = (userMessages[userMessages.length - 1]?.content || '').toLowerCase();

  const responses = {
    college: [
      "That is a great perspective! When you are talking with classmates or seniors, sharing your personal experience makes the conversation much more memorable. How do you usually like to approach group assignments?",
      "I completely agree. Lecturers really appreciate it when students explain their thinking before asking for help. Have you ever had to ask for an extension or clarification on a difficult topic?",
      "That is wonderful. Introducing yourself with genuine curiosity is the fastest way to make friends on campus. What extracurricular activities or clubs are you interested in joining?"
    ],
    interview: [
      "Thank you for sharing that. You highlighted your technical interest well. To make your response even stronger, mention a specific project where you applied those skills. Could you walk me through one achievement you are proud of?",
      "That shows great self-awareness. When discussing areas you are improving, always share the proactive steps you are taking to grow. What is a skill you have worked hard to develop recently?",
      "Excellent. Interviewers love hearing how your values align with their team culture. What kind of work environment brings out your best performance?"
    ],
    discussion: [
      "That is an interesting point. You stated your stance clearly. In a group discussion, you can build on that by saying 'To support this view, consider...' How would you respond if another participant politely disagreed with you?",
      "Well said! Acknowledging the other side before presenting your counter-argument makes you sound diplomatic and persuasive. What is the biggest advantage of the position you just shared?",
      "Good logic! Now, let's practice summarizing. If you were concluding this group discussion, how would you wrap up all the key ideas in two sentences?"
    ],
    speaking: [
      "I love the energy in that thought! In public speaking, your opening hook determines whether the audience listens. What is an engaging question or surprising fact you could start your presentation with?",
      "Clear articulation! Remember to use vocal variety—pause right before your key point to build anticipation. Can you try stating your core message again with a deliberate pause?",
      "That connects smoothly to your main theme. How would you handle an unexpected question from the audience regarding this point?"
    ],
    everyday: [
      "That sounds very natural! In everyday conversations, asking a friendly return question keeps the chat flowing effortlessly. How was the rest of your day today?",
      "I love that! Casual English uses great phrases like 'That makes sense' or 'I know what you mean'. What do you usually enjoy doing when you want to unwind on weekends?",
      "That is a great way to put it! Communicating comfortably in daily life is all about expressing yourself without overthinking. What is something exciting you are looking forward to this week?"
    ]
  };

  const sitList = responses[situation] || responses.everyday;
  return sitList[(count - 1) % sitList.length];
}

function getStaticLearnData(situation, difficulty) {
  return {
    introduction: `Mastering English for ${situation} gives you the confidence to communicate effectively, build relationships, and succeed in real-world scenarios.`,
    keyPhrases: [
      { phrase: "From my perspective...", usage: "To introduce your viewpoint politely", example: "From my perspective, hands-on practice is the fastest way to improve." },
      { phrase: "Could you please elaborate on that?", usage: "To ask someone to explain further", example: "That sounds intriguing, could you please elaborate on that approach?" },
      { phrase: "I would like to highlight...", usage: "To draw attention to an important point", example: "I would like to highlight the practical results of our project." },
      { phrase: "I completely understand your point, and...", usage: "To agree respectfully while adding thoughts", example: "I understand your point, and we should also consider the timeline." }
    ],
    vocabulary: [
      { word: "Articulate", meaning: "Able to express ideas clearly and fluently in speech", example: "She gave an articulate summary of the proposal." },
      { word: "Constructive", meaning: "Serving a useful purpose; helpful and positive", example: "Aira provides constructive feedback after every answer." },
      { word: "Initiative", meaning: "The ability to assess and initiate things independently", example: "He took the initiative to start the discussion." },
      { word: "Perspective", meaning: "A particular attitude toward or way of regarding something", example: "Hearing different perspectives helped us find the best solution." }
    ],
    sampleConversation: [
      { speaker: "Aira", text: "Welcome! What is the main communication goal you want to achieve today?" },
      { speaker: "You", text: "I want to speak more fluently and stop hesitating before each sentence." },
      { speaker: "Aira", text: "That is a wonderful goal! Remember, natural pauses are healthy—focus on expressing your idea rather than perfection. Ready to begin?" },
      { speaker: "You", text: "Yes, I am ready!" }
    ],
    tips: [
      "Focus on clarity over complex vocabulary.",
      "Pause for a breath instead of using filler sounds like 'um' or 'uh'.",
      "Always ground your points in a tangible example or personal experience.",
      "Listen actively so your answers directly address what was asked."
    ],
    commonMistakes: [
      "Speaking too fast when feeling nervous.",
      "Memorizing rigid scripts instead of understanding key points.",
      "Giving single-word answers rather than conversational sentences."
    ]
  };
}

module.exports = router;
