"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

interface Character {
    name: string;
    description: string;
    traits: string[];
}

interface Segment {
    type: 'narrative' | 'dialogue';
    text: string;
    speaker?: string;
}

interface Vocabulary {
    word: string;
    definition: string;
}

interface Scene {
    segments: Segment[];
    vocabulary: Vocabulary[];
    choices: { text: string }[];
}

interface Story {
    _id: string;
    title: string;
    characters: Character[];
    scenes: Scene[];
}

export default function StoryPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [prompt, setPrompt] = useState('');
    const [story, setStory] = useState<Story | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [savedStories, setSavedStories] = useState<Story[]>([]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const fetchStories = async () => {
        try {
            const res = await api.get('/story');
            setSavedStories(res.data);
        } catch (error) {
            console.error('Failed to fetch stories:', error);
        }
    };

    const startStory = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        try {
            const res = await api.post('/story/start', { prompt });
            setStory(res.data);
            setShowGallery(false);
        } catch (error) {
            console.error('Failed to start story:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const continueStory = async (choice: string) => {
        if (!story) return;
        setIsGenerating(true);
        try {
            const res = await api.post(`/story/${story._id}/continue`, { choice });
            setStory(res.data);
        } catch (error) {
            console.error('Failed to continue story:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const toggleGallery = () => {
        if (!showGallery) {
            fetchStories();
        }
        setShowGallery(!showGallery);
    };

    const loadStory = (selectedStory: Story) => {
        setStory(selectedStory);
        setShowGallery(false);
    };

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

    // Get current vocabulary from the last scene
    const currentVocabulary = story?.scenes[story.scenes.length - 1]?.vocabulary || [];

    // to highlight vocabulary words in text
    const highlightText = (text: string) => {
        if (!currentVocabulary.length) return text;

        const pattern = new RegExp(`\\b(${currentVocabulary.map(v => v.word).join('|')})\\b`, 'gi');

        const parts = text.split(pattern);

        return parts.map((part, i) => {
            const vocabMatch = currentVocabulary.find(v => v.word.toLowerCase() === part.toLowerCase());
            if (vocabMatch) {
                return (
                    <span
                        key={i}
                        className="text-yellow-400 underline decoration-dotted cursor-help relative group"
                        title={vocabMatch.definition} //  fallback
                    >
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header / User Bar */}
            <div className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white tracking-wider">William Duck</h1>
                    {story && (
                        <Button
                            variant="outline"
                            onClick={() => setStory(null)}
                            className="text-gray-400 hover:text-white border-gray-700"
                        >
                            New Story
                        </Button>
                    )}
                    <Button variant="outline" onClick={toggleGallery} className="text-gray-400 hover:text-white border-gray-700">
                        {showGallery ? 'Back to Story' : 'Gallery'}
                    </Button>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">Storyteller: <span className="text-white font-bold">{user?.name}</span></span>
                    <Button variant="outline" onClick={handleLogout} className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs">
                        Sign Out
                    </Button>
                </div>
            </div>

            {showGallery ? (
                <div className="flex-1 p-8 overflow-y-auto">
                    <h2 className="text-3xl font-bold mb-8 text-center">Your Stories</h2>
                    {savedStories.length === 0 ? (
                        <p className="text-center text-gray-500">No stories found. Start a new adventure!</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {savedStories.map((s) => (
                                <div key={s._id} onClick={() => loadStory(s)} className="cursor-pointer">
                                    <Card className="bg-gray-900 border-gray-800 hover:border-gray-600 transition-colors p-6">
                                        <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                                        <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                                            {s.scenes[0]?.segments.find(seg => seg.type === 'narrative')?.text || 'No preview available.'}
                                        </p>
                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                            <span>{s.characters.length} Characters</span>
                                            <span>{s.scenes.length} Scenes</span>
                                        </div>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : !story ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <h2 className="text-4xl font-bold mb-8 text-center text-white">
                        What story do you want to tell?
                    </h2>
                    <Card className="w-full max-w-2xl space-y-4 bg-gray-900 border-gray-800">
                        <Input
                            placeholder="e.g., A cyberpunk detective in a rainy neo-tokyo..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="bg-black border-gray-700 text-white"
                        />
                        <Button
                            className="w-full bg-white text-black hover:bg-gray-200"
                            onClick={startStory}
                            disabled={isGenerating}
                        >
                            {isGenerating ? 'Generating World...' : 'Begin Adventure'}
                        </Button>
                    </Card>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden" style={{ height: 'calc(100vh - 73px)' }}>
                    {/* Left Sidebar: Characters */}
                    <div className="hidden lg:block lg:col-span-2 bg-gray-900 border-r border-gray-800 p-6 overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-6">Characters</h3>
                        <div className="space-y-6">
                            {story.characters.map((char, idx) => (
                                <div key={idx} className="space-y-2">
                                    <h4 className="font-bold text-lg text-gray-200">{char.name}</h4>
                                    <p className="text-sm text-gray-400">{char.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {char.traits.map((trait, i) => (
                                            <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full border border-gray-700">
                                                {trait}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Center: Story Feed */}
                    <div className="col-span-1 lg:col-span-8 flex flex-col h-full bg-black">
                        <div className="p-6 border-b border-gray-800">
                            <h1 className="text-2xl font-bold text-center text-white">{story.title}</h1>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
                            <AnimatePresence mode="wait">
                                {story.scenes.map((scene, sceneIdx) => (
                                    <div key={sceneIdx} className="space-y-6">
                                        {scene.segments.map((segment, segIdx) => (
                                            <motion.div
                                                key={`${sceneIdx}-${segIdx}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: segIdx * 0.1 }}
                                                className={`flex ${segment.type === 'dialogue' ? 'justify-start' : 'justify-center'}`}
                                            >
                                                {segment.type === 'narrative' ? (
                                                    <p className="text-gray-400 italic text-center max-w-2xl leading-relaxed">
                                                        {highlightText(segment.text)}
                                                    </p>
                                                ) : (
                                                    <div className="max-w-xl bg-gray-900 rounded-2xl p-4 border border-gray-800">
                                                        <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{segment.speaker}</p>
                                                        <p className="text-white text-lg leading-relaxed">{highlightText(segment.text)}</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                ))}
                            </AnimatePresence>

                            {/* Choices Area */}
                            <div className="pt-8 pb-12">
                                <h3 className="text-center text-gray-500 text-sm uppercase tracking-widest mb-6">What happens next?</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                                    {story.scenes[story.scenes.length - 1].choices.map((choice, idx) => (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            className="h-auto py-4 px-6 border-gray-700 hover:bg-gray-900 hover:text-white text-left justify-start transition-all"
                                            onClick={() => continueStory(choice.text)}
                                            disabled={isGenerating}
                                        >
                                            {choice.text}
                                        </Button>
                                    ))}
                                </div>
                                {isGenerating && <p className="text-center text-gray-500 mt-4 animate-pulse">Writing the next chapter...</p>}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar: Dictionary */}
                    <div className="hidden lg:block lg:col-span-2 bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-6">Dictionary</h3>
                        {currentVocabulary.length > 0 ? (
                            <div className="space-y-4">
                                {currentVocabulary.map((vocab, idx) => (
                                    <div key={idx} className="p-3 bg-black rounded-lg border border-gray-800">
                                        <p className="font-bold text-white mb-1">{vocab.word}</p>
                                        <p className="text-sm text-gray-400">{vocab.definition}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm italic">No difficult words in this scene.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
