/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Crown, Sparkles, Flower2, Star, Heart, Music, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Background floating elements component
const FloatingBackground = () => {
  const elements = Array.from({ length: 35 }).map((_, i) => {
    const types = ['heart', 'star', 'sparkles', 'flower'];
    return {
      id: i,
      type: types[Math.floor(Math.random() * types.length)],
      x: Math.random() * 100, // vw
      delay: Math.random() * -20, // Negative delay so they are already on screen
      duration: 15 + Math.random() * 25,
      size: 14 + Math.random() * 18,
      opacity: 0.15 + Math.random() * 0.25
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {elements.map((el) => {
        let Icon = Heart;
        if (el.type === 'star') Icon = Star;
        if (el.type === 'sparkles') Icon = Sparkles;
        if (el.type === 'flower') Icon = Flower2;
        
        return (
          <motion.div
            key={el.id}
            className="absolute top-[-100px] text-[#ff66a3] drop-shadow-sm"
            style={{ left: `${el.x}vw`, opacity: el.opacity }}
            animate={{
              y: ['-10vh', '120vh'],
              rotate: [0, 360],
              x: [`${el.x}vw`, `${el.x + (Math.random() * 30 - 15)}vw`]
            }}
            transition={{
              duration: el.duration,
              repeat: Infinity,
              delay: el.delay,
              ease: "linear"
            }}
          >
            <Icon size={el.size} strokeWidth={1.5} />
          </motion.div>
        );
      })}
    </div>
  );
};

export default function App() {
  const [isOpened, setIsOpened] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [flyingHearts, setFlyingHearts] = useState<{ id: number; x: number, y: number, delay: number }[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const requestRef = useRef<number | null>(null);
  const profileImageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartButtonRef = useRef<HTMLDivElement>(null);

  // Handle Audio Beat & Visualizer
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      if (!audioContextRef.current) {
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContext();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          
          audioRef.current.crossOrigin = "anonymous";
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        } catch (e) {
          console.error("Web Audio API setup failed", e);
        }
      }

      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }

      const updateBeat = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Profile image pulse
        if (profileImageRef.current) {
          let sum = 0;
          for (let i = 0; i < 8; i++) {
            sum += dataArray[i];
          }
          const average = sum / 8;
          const scale = 1 + (average / 255) * 0.15;
          profileImageRef.current.style.transform = `scale(${scale})`;
          // Add dynamic shadow based on beat
          profileImageRef.current.style.boxShadow = `0 0 ${40 + (average / 255) * 60}px rgba(255,51,133,${0.5 + (average / 255) * 0.5})`;
        }

        // Canvas Visualizer
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 130; // Slightly larger than the profile image
            
            const bars = 64;
            const step = (Math.PI * 2) / bars;
            
            for (let i = 0; i < bars; i++) {
              // Use lower frequencies more
              const dataIndex = Math.floor(i * (dataArray.length * 0.5) / bars);
              const value = dataArray[dataIndex];
              const barHeight = (value / 255) * 40; // Max height 40px
              
              const angle = i * step - Math.PI / 2;
              
              const x1 = centerX + Math.cos(angle) * radius;
              const y1 = centerY + Math.sin(angle) * radius;
              const x2 = centerX + Math.cos(angle) * (radius + barHeight);
              const y2 = centerY + Math.sin(angle) * (radius + barHeight);
              
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.lineWidth = 3;
              ctx.lineCap = 'round';
              
              // Gradient color based on value
              ctx.strokeStyle = `rgba(255, 51, 133, ${0.2 + (value / 255) * 0.6})`;
              ctx.stroke();
            }
          }
        }
        
        requestRef.current = requestAnimationFrame(updateBeat);
      };
      
      updateBeat();
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (profileImageRef.current) {
        profileImageRef.current.style.transform = ``;
        profileImageRef.current.style.boxShadow = ``;
      }
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying]);

  const toggleMusic = () => {
    if (!isPlaying && audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setIsPlaying(!isPlaying);
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    // Get button position to spawn hearts from there
    const rect = heartButtonRef.current?.getBoundingClientRect();
    const startX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const startY = rect ? rect.top + rect.height / 2 : window.innerHeight - 150;

    const newHearts = Array.from({ length: 20 }).map((_, i) => ({
      id: Date.now() + i,
      x: startX,
      y: startY,
      delay: Math.random() * 0.15
    }));
    setFlyingHearts(prev => [...prev, ...newHearts]);
    
    setTimeout(() => {
      setFlyingHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
    }, 2500);
  };

  return (
    <>
      {/* Curtain Overlay */}
      <AnimatePresence>
        {!isOpened && (
          <div className="fixed inset-0 z-[100] flex cursor-pointer" onClick={() => setIsOpened(true)}>
            <motion.div 
              className="w-1/2 h-full bg-[#ff3385] border-r border-pink-400/30 shadow-[5px_0_15px_rgba(0,0,0,0.2)] z-10"
              initial={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div 
              className="w-1/2 h-full bg-[#ff3385] border-l border-pink-400/30 shadow-[-5px_0_15px_rgba(0,0,0,0.2)] z-10"
              initial={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
            
            <motion.div 
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20"
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.8, ease: "easeIn" }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-white text-center flex flex-col items-center"
              >
                <Heart size={80} className="mb-6 fill-white text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                <h2 className="font-serif text-4xl md:text-5xl font-bold drop-shadow-lg">Nhấn để mở thiệp</h2>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="min-h-screen bg-[#fff0f5] flex flex-col items-center pt-10 px-4 relative font-sans overflow-x-hidden">
        
        <FloatingBackground />

        {/* Audio Element */}
        <audio 
          ref={audioRef} 
          src="https://files.catbox.moe/qm5kko.mp3" 
          loop 
          crossOrigin="anonymous"
        />

        {/* Header */}
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isOpened ? 1 : 0, y: isOpened ? 0 : -20 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center font-serif text-3xl md:text-5xl font-bold text-[#e81e61] leading-tight mb-8 z-10"
        >
          Chúc mừng ngày<br />Quốc tế Phụ nữ 8/3
        </motion.h1>

        {/* Profile Section with Visualizer */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isOpened ? 1 : 0, scale: isOpened ? 1 : 0.8 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="relative mb-6 z-10 flex items-center justify-center"
        >
          {/* Audio Visualizer Canvas */}
          <canvas 
            ref={canvasRef}
            width={380}
            height={380}
            className="absolute z-0 pointer-events-none opacity-80"
          />

          {/* Elegant Animated Decorations Behind Profile */}
          <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none overflow-hidden h-[600px] -top-[100px]">
            {/* Elegant Sparkle 1 */}
            <motion.div
              className="absolute text-2xl md:text-3xl drop-shadow-sm opacity-40 text-pink-400"
              animate={{ 
                y: ['100%', '-500%'], 
                x: [-10, 10, -10],
                rotate: [0, 180] 
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              style={{ left: '-10%', bottom: '0' }}
            >
              ✧
            </motion.div>
            
            {/* Delicate Flower */}
            <motion.div
              className="absolute text-3xl md:text-4xl drop-shadow-sm opacity-30"
              animate={{ 
                y: ['100%', '-400%'], 
                x: [15, -15, 15],
                rotate: [0, -90] 
              }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 2 }}
              style={{ right: '-15%', bottom: '0' }}
            >
              🌸
            </motion.div>

            {/* Elegant Sparkle 2 */}
            <motion.div
              className="absolute text-xl md:text-2xl drop-shadow-sm opacity-50 text-pink-300"
              animate={{ 
                y: ['100%', '-600%'], 
                x: [-20, 20, -20],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 5 }}
              style={{ left: '-25%', bottom: '0' }}
            >
              ✦
            </motion.div>

            {/* Soft Heart */}
            <motion.div
              className="absolute text-2xl md:text-3xl drop-shadow-sm opacity-30"
              animate={{ 
                y: ['100%', '-450%'], 
                x: [20, -20, 20],
                rotate: [-15, 15, -15] 
              }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear", delay: 1 }}
              style={{ right: '-5%', bottom: '0' }}
            >
              🤍
            </motion.div>
            
            {/* Elegant Star */}
            <motion.div
              className="absolute text-2xl md:text-3xl drop-shadow-sm opacity-40 text-pink-500"
              animate={{ 
                y: ['100%', '-550%'], 
                x: [-15, 15, -15],
                rotate: [0, 360]
              }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear", delay: 7 }}
              style={{ right: '15%', bottom: '0' }}
            >
              ⋆
            </motion.div>

            {/* Small Sparkle */}
            <motion.div
              className="absolute text-lg md:text-xl drop-shadow-sm opacity-60 text-pink-400"
              animate={{ 
                y: ['100%', '-700%'], 
                x: [10, -10, 10],
                scale: [0.5, 1, 0.5]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 3 }}
              style={{ left: '10%', bottom: '0' }}
            >
              ✨
            </motion.div>
          </div>

          {/* Profile Image Container */}
          <div 
            ref={profileImageRef}
            className={`w-56 h-56 md:w-64 md:h-64 rounded-full p-1.5 bg-gradient-to-br from-[#ff66a3] via-[#ff3385] to-[#ff99c2] relative transition-transform duration-75 origin-center z-10 ${!isPlaying ? 'profile-pulse' : ''}`}
          >
            <div className="w-full h-full rounded-full border-[3px] border-white overflow-hidden bg-white">
              <img
                src="https://i.postimg.cc/9MND6zPS/589299562-1628454448563991-7712689348512289122-n.jpg" // Fixed direct image link
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Floating Icons - Faded */}
          <div className="absolute top-2 right-2 bg-white/70 backdrop-blur-sm p-3 rounded-full shadow-sm flex items-center justify-center z-20">
            <Crown className="text-[#e81e61]/80" size={26} strokeWidth={2} />
          </div>
          <div className="absolute bottom-8 -right-2 bg-white/70 backdrop-blur-sm p-2 rounded-full shadow-sm flex items-center justify-center z-20">
            <Sparkles className="text-[#ffc107]/80" size={24} strokeWidth={2} />
          </div>
          <div className="absolute bottom-2 left-0 bg-white/70 backdrop-blur-sm p-2.5 rounded-full shadow-sm flex items-center justify-center z-20">
            <Flower2 className="text-[#e81e61]/80" size={24} strokeWidth={2} />
          </div>
        </motion.div>

        {/* Name */}
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpened ? 1 : 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="font-cursive text-5xl md:text-7xl text-[#ff3385] mb-12 z-10 text-center px-4"
        >
          Chị em Video ồn
        </motion.h2>

        {/* Greeting Card */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: isOpened ? 1 : 0, y: isOpened ? 0 : 50 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="relative w-full max-w-md bg-white rounded-[32px] pt-14 pb-8 px-6 shadow-[0_8px_30px_rgba(255,105,180,0.15)] mt-auto mb-8 z-10"
        >
          {/* Dog Illustration */}
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-28 h-28 z-20">
            <img 
              src="https://i.postimg.cc/8zmLq3gd/From-Main-Klickpin-CF-ilikestickercom-7EAa-D5Jec-ezgif-com-loop-count.gif"
              alt="Cute Dog"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>

          {/* Top Left Star */}
          <div className="absolute -top-3 -left-3 bg-white p-2 rounded-full shadow-sm flex items-center justify-center">
            <Star className="text-pink-300" size={18} strokeWidth={2.5} />
          </div>

          {/* Message */}
          <p className="text-center font-serif text-[#b30047] text-[17px] md:text-xl leading-relaxed font-medium mb-6 px-2">
            Chúc chị em Video ồn luôn xinh đẹp, rạng rỡ, hạnh phúc và thành công trong cuộc sống. Hãy luôn mỉm cười thật tươi nhé ❤️
          </p>

          {/* Heart Button Area */}
          <div className="flex flex-col items-center mb-6">
            <div 
              ref={heartButtonRef}
              onClick={handleHeartClick}
              className="bg-[#ffe6f0] w-16 h-16 rounded-full shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center justify-center mb-2"
            >
              <Heart className="text-[#ff3385] fill-[#ff3385]" size={32} />
            </div>
            <span className="text-[#ff66a3] text-sm font-semibold">Nhấn để thả tim</span>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-pink-100 mb-6"></div>

          {/* Music Button */}
          <button 
            onClick={toggleMusic}
            className={`w-full py-4 px-6 rounded-full flex items-center relative font-bold text-[15px] md:text-lg transition-all duration-300 ${
              isPlaying 
                ? 'bg-[#ff3385] text-white shadow-[0_8px_25px_rgba(255,51,133,0.4)] scale-[1.02]' 
                : 'bg-[#ff4d94] text-white shadow-[0_8px_20px_rgba(255,77,148,0.3)] hover:bg-[#ff3385] hover:shadow-[0_8px_25px_rgba(255,51,133,0.4)]'
            }`}
          >
            <div className="absolute left-6">
              {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
            </div>
            <div className="flex-1 text-center flex flex-col items-center justify-center leading-tight">
              <span>Nhạc siêu cấp vippro</span>
              <span>của Thanks</span>
            </div>
          </button>

          {/* Dotted line at bottom */}
          <div className="mt-8 flex justify-center gap-1.5 opacity-60">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="w-2 h-1.5 bg-[#ff66a3] rounded-full"></div>
            ))}
          </div>

          {/* Bottom Right Star */}
          <div className="absolute -bottom-4 -right-4 bg-white p-2.5 rounded-full shadow-md flex items-center justify-center">
            <Star className="text-[#ff66a3]" size={22} strokeWidth={2.5} />
          </div>
        </motion.div>
      </div>

      {/* Flying Hearts Portal */}
      <div className="fixed inset-0 pointer-events-none z-[60]">
        <AnimatePresence>
          {flyingHearts.map(heart => (
            <motion.div
              key={heart.id}
              initial={{ opacity: 1, y: heart.y, x: heart.x, scale: 0.5 }}
              animate={{ 
                opacity: 0, 
                y: heart.y - 300 - Math.random() * 200,
                x: heart.x + (Math.random() - 0.5) * 200,
                scale: 1 + Math.random() * 1.2,
                rotate: (Math.random() - 0.5) * 90
              }}
              transition={{ 
                duration: 1.5 + Math.random() * 1, 
                ease: "easeOut",
                delay: heart.delay 
              }}
              className="absolute"
            >
              <Heart className="text-[#ff3385] fill-[#ff3385] drop-shadow-md" size={20} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
