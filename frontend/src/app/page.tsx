"use client";

import React from 'react';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { login, user } = useAuth();
  const router = useRouter();

  const handleStart = () => {
    console.log('Start button clicked');
    if (user) {
      router.push('/story');
    } else {
      console.log('Initiating login...');
      login();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-6"
        >
          Unleash Your Imagination
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl"
        >
          Create immersive, dynamic stories with consistent characters powered by Gemini AI.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Button size="lg" onClick={handleStart}>
            {user ? 'Continue Your Journey' : 'Start Creating Now'}
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
