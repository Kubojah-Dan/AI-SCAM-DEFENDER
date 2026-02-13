const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/ask', async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      messages: [
        {
          role: 'system',
          content: 'You are a helpful coding assistant. Provide short, clear answers about programming, coding concepts, and technical questions. Keep responses concise and practical.'
        },
        {
          role: 'user',
          content: question
        }
      ],
      model: 'llama3-8b-8192',
      max_tokens: 150
    }, {
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json'
      }
    });
    
    res.json({ answer: response.data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: 'Sorry, I couldn\'t process your coding question right now.' });
  }
});

module.exports = router;