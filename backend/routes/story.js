const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Story = require('../models/Story');
const jwt = require('jsonwebtoken');
const connectDB = require('../lib/dbConnect');
const router = express.Router();

// Middleware to verify JWT
const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        await connectDB(); // Ensure DB is connected for subsequent operations
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

// Start a new story
router.post('/start', authenticate, async (req, res) => {
    const { prompt } = req.body;

    try {
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "You are a creative storyteller. Create a story based on the user's prompt. Define the main characters and the first scene. Return the response in JSON format with the following structure: { title: 'Story Title', characters: [{ name: 'Name', description: 'Description', traits: ['Trait1', 'Trait2'] }], firstScene: { text: 'Scene text...', choices: ['Choice 1', 'Choice 2'] } }" }],
                },
            ],
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up the response to ensure it's valid JSON
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const storyData = JSON.parse(jsonString);

        const newStory = new Story({
            userId: req.user.userId,
            title: storyData.title,
            characters: storyData.characters,
            scenes: [{
                text: storyData.firstScene.text,
                choices: storyData.firstScene.choices.map(c => ({ text: c })),
            }],
        });

        await newStory.save();
        res.status(201).json(newStory);
    } catch (error) {
        console.error('Story generation error:', error);
        res.status(500).json({ message: 'Failed to generate story' });
    }
});

// Continue a story
router.post('/:id/continue', authenticate, async (req, res) => {
    const { choice } = req.body;
    const storyId = req.params.id;

    try {
        const story = await Story.findById(storyId);
        if (!story) return res.status(404).json({ message: 'Story not found' });

        // Constructing history from previous scenes
        const history = [
            {
                role: "user",
                parts: [{ text: "You are a creative storyteller. Continue the story based on the user's choice. Maintain character consistency. Return the response in JSON format with the following structure: { text: 'Scene text...', choices: ['Choice 1', 'Choice 2'] }" }]
            }
        ];

        // Add context from the story so far (simplified)
        const context = `Title: ${story.title}\nCharacters: ${JSON.stringify(story.characters)}\nPrevious Scenes: ${story.scenes.map(s => s.text).join('\n')}\nUser Choice: ${choice}`;

        const result = await model.generateContent(context);
        const response = await result.response;
        const text = response.text();

        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const nextSceneData = JSON.parse(jsonString);

        story.scenes.push({
            text: nextSceneData.text,
            choices: nextSceneData.choices.map(c => ({ text: c })),
        });

        await story.save();
        res.status(200).json(story);
    } catch (error) {
        console.error('Story continuation error:', error);
        res.status(500).json({ message: 'Failed to continue story' });
    }
});

// Get all stories for a user
router.get('/', authenticate, async (req, res) => {
    try {
        const stories = await Story.find({ userId: req.user.userId }).sort({ updatedAt: -1 });
        res.status(200).json(stories);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stories' });
    }
});

// Get a single story
router.get('/:id', authenticate, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: 'Story not found' });
        res.status(200).json(story);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch story' });
    }
});

// Delete a story
router.delete('/:id', authenticate, async (req, res) => {
    try {
        await connectDB();
        const story = await Story.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });

        if (!story) {
            return res.status(404).json({ message: 'Story not found or unauthorized' });
        }

        res.status(200).json({ message: 'Story deleted successfully' });
    } catch (error) {
        console.error('Delete story error:', error);
        res.status(500).json({ message: 'Failed to delete story' });
    }
});

module.exports = router;
