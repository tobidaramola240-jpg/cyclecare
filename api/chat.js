/**
 * CycleCare — Vercel Serverless Function for Generative AI Chat
 * Endpoint: POST /api/chat
 */

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, cycleStatus, profile, conversationHistory, apiKey: clientApiKey } = req.body || {};
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY || '';

    if (!apiKey) {
      return res.status(200).json({
        hasApiKey: false,
        fallback: true,
        notice: 'No Gemini API key configured.'
      });
    }

    const currentDay = cycleStatus?.currentCycleDay || 1;
    const phaseTitle = cycleStatus?.phaseTitle || 'Cycle';
    const phaseDesc = cycleStatus?.phaseDescription || 'Natural hormonal rhythms';
    const userName = profile?.isAnonymous ? 'Friend' : ((profile?.name || 'there').split(' ')[0]);

    const systemInstruction = `You are Maya, a warm, compassionate, highly knowledgeable, and medically responsible women's health companion inside CycleCare.
Current User Context:
- User Name: ${userName}
- Current Cycle Day: Day ${currentDay} (${phaseTitle} Phase)
- Phase Biology: ${phaseDesc}

Guidelines:
1. Answer the user's specific question directly, warmly, and conversationally—just like ChatGPT, but tailored as an empathetic women's health companion.
2. If the user asks casual or personal questions (e.g. "can you be honest with me", "who are you", "tell me a joke", "how are you feeling"), answer warmly and genuinely like a caring companion. Do NOT force cycle explanations unless relevant.
3. For medical, reproductive, menstrual, or nutritional questions, provide clear evidence-based guidance based on ACOG, WHO, and endocrine standards.
4. Maintain medical responsibility: clarify that you provide clinical wellness awareness, not formal medical diagnosis. If symptoms are severe, red-flag, or persistent, kindly suggest consulting a healthcare provider.
5. Keep responses concise, warm, structured with bullet points where helpful.`;

    const contents = [];
    if (Array.isArray(conversationHistory)) {
      conversationHistory.slice(-6).forEach(msg => {
        if (msg.sender && msg.text) {
          contents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        }
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 900,
        }
      })
    });

    const data = await geminiRes.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const generatedText = data.candidates[0].content.parts[0].text;
      return res.status(200).json({
        hasApiKey: true,
        reply: generatedText,
        sources: 'Maya AI · Powered by Google Gemini 1.5 Flash (Generative Intelligence)',
        title: 'Maya AI Companion'
      });
    } else {
      return res.status(200).json({
        hasApiKey: true,
        fallback: true,
        error: data?.error?.message || 'Could not generate response'
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message, fallback: true });
  }
};
