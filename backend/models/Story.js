
const mongoose = require('mongoose');

const SceneSchema = new mongoose.Schema({
    segments: [{
        type: {
            type: String,
            enum: ['narrative', 'dialogue'],
            required: true
        },
        text: {
            type: String,
            required: true
        },
        speaker: {
            type: String // for dialogue
        }
    }],
    vocabulary: [{
        word: String,
        definition: String
    }],
    choices: [{
        text: String,
        nextSceneId: String, // Reference to the next scene
    }],
});

const StorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    characters: [{
        name: String,
        description: String,
        traits: [String],
    }],
    scenes: [SceneSchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Story', StorySchema);
