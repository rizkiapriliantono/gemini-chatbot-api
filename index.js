const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');


dotenv.config();

const app = express();
const port = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Gemini Studio
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash"});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Route
app.post('/api/chat', async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: 'Please provide a message' });
  }

  try {
    const result = await model.generateContentStream(userMessage);

    // Set headers for a streaming response
    res.setHeader('Content-Type', 'text/plain');

    // Pipe the stream to the response
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        res.write(chunkText);
      }
    }

    res.end();
  } catch (error) {
    console.error('Error during Gemini stream:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Something went wrong while generating the response.' });
    }
  }
});
