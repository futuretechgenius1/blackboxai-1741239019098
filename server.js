import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Groq from "groq-sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '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'
});

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a helpful AI assistant. If you're providing code examples, wrap them in triple backticks with the appropriate language identifier. For example:

\`\`\`javascript
console.log('Hello World');
\`\`\`

Always format code responses neatly and provide clear explanations.`
                },
                {
                    role: "user",
                    content: message
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 1,
            stream: false
        });

        const response = chatCompletion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
        res.json({ response });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'An error occurred while processing your request',
            details: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something broke!',
        details: err.message 
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
