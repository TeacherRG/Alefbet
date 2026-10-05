import React, { useState, useEffect } from "react";
import { sound } from "./sound";
import PlayAloneGame from "./components/PlayAloneGame";
import ReadTogether from "./components/ReadTogether";
import { Volume2, VolumeX, Sparkles, BookOpen, UserCheck, Play, HelpCircle, Award } from "lucide-react";

export default function App() {
  const [activeMode, setActiveMode] = useState<'menu' | 'play_alone' | 'read_together'>('menu');
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem("tanya_kids_muted");
    return saved === "true";
  });

  // Track if they have unlocked levels
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);

  useEffect(() => {
    // Read cached state
    const level = localStorage.getItem("tanya_kids_level");
    if (level) {
      setUnlockedLevel(parseInt(level, 10));
    }
  }, [activeMode]);

  useEffect(() => {
    sound.setMuted(isMuted);
    localStorage.setItem("tanya_kids_muted", isMuted ? "true" : "false");
  }, [isMuted]);

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
    // Play a short chime if unmuting as speaker feedback
    if (isMuted) {
      setTimeout(() => {
        sound.playCorrectHit();
      }, 50);
    }
  };

  const handleModeChange = (mode: 'menu' | 'play_alone' | 'read_together') => {
    setActiveMode(mode);
    if (mode === 'play_alone') {
      sound.playLevelUnlock();
    } else if (mode === 'read_together') {
      sound.playHintShowing();
    } else {
      sound.playCorrectHit();
    }
  };

  const handleTestSound = () => {
    sound.playVictory();
  };

  if (activeMode === 'play_alone') {
    return (
      <PlayAloneGame
        onBack={() => handleModeChange('menu')}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />
    );
  }

  if (activeMode === 'read_together') {
    return (
      <ReadTogether
        onBack={() => handleModeChange('menu')}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-amber-50/50 via-orange-50/20 to-amber-100/40 font-sans flex flex-col justify-between select-none relative overflow-x-hidden">
      
      {/* Decorative Golden Ambient Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-orange-400/5 blur-3xl pointer-events-none" />

      {/* Navigation Top Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between border-b border-amber-100/40 relative z-10">
        <div className="flex items-center gap-2">
          {/* Logo Bee helper */}
          <div className="w-10 h-10 bg-amber-400 hover:bg-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-amber-500/10 hover:rotate-12 transition-all">
            🐝
          </div>
          <div>
            <h1 className="text-md sm:text-lg font-extrabold text-amber-950 font-serif leading-none">Тания Малышам</h1>
            <span className="text-[9px] uppercase tracking-widest font-mono text-amber-800 font-bold block mt-1">Обучение Алеф-Бет</span>
          </div>
        </div>

        {/* Global Speaker Control */}
        <button
          onClick={handleToggleMute}
          id="btn-toggle-mute-menu"
          className="p-2.5 rounded-xl bg-white hover:bg-amber-50 text-amber-900 border border-amber-100 flex items-center justify-center transition-all shadow-xs cursor-pointer"
          title={isMuted ? "Включить звук" : "Выключить звук"}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-red-500 animate-pulse" />
          ) : (
            <Volume2 className="w-5 h-5 text-emerald-600" />
          )}
        </button>
      </header>

      {/* Main Branding Center Block with illustration */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center relative z-10">
        
        {/* Animated Brand Mascot Board */}
        <div className="flex flex-col items-center text-center max-w-2xl mb-12 animate-fade-in">
          
          {/* Sweet Honey bee illustration inside circle */}
          <div className="relative w-32 h-32 mb-6">
            <div className="absolute inset-0 rounded-full bg-amber-400/20 border-2 border-dashed border-amber-400/40 animate-spin" style={{ animationDuration: '30s' }} />
            
            {/* The Cute Queen Bee drawing in SVG */}
            <div className="absolute inset-2 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full border-2 border-amber-950 flex items-center justify-center shadow-lg relative overflow-hidden">
              <span className="text-6xl animate-bounce">🐝</span>
              {/* Dripping honey drops overlay */}
              <div className="absolute bottom-2 font-bold text-white text-[10px] uppercase font-mono tracking-widest text-shadow">МЁД</div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-amber-950 font-serif mb-4 tracking-tight drop-shadow-xs">
            Тания Малышам
          </h1>

          <p className="text-base sm:text-lg text-amber-900/80 font-medium font-serif leading-relaxed max-w-xl">
            Интерактивное изучение священного еврейского алфавита через подлинный титульный лист книги <strong>Тания</strong>. Дети учат буквы на реальном тексте, прикасаясь к мудрости!
          </p>

          {/* Sparkles bullet points */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4 text-xs font-bold text-amber-800">
            <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> 100% без рекламы</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> Web Audio звуки</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> Одобрено родителями</span>
          </div>
        </div>

        {/* Two Game Mode Selection Buttons Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mb-12">
          
          {/* CARD 1: BEE PLAY GAME MODE */}
          <button
            onClick={() => handleModeChange('play_alone')}
            id="btn-play-alone-mode"
            className="group block bg-white hover:bg-amber-50/30 rounded-3xl border-2 border-amber-100 hover:border-amber-400 p-6 text-left shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden active:scale-98"
          >
            {/* Ambient gold card fill */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-bl-3xl group-hover:bg-amber-400/10 transition-all" />

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-amber-500/10 group-hover:scale-105 transition-transform">
                🐝
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block mb-1">Ребёнок играет сам</span>
                <h3 className="text-xl font-bold text-amber-950 font-serif mb-1">Я играю сам</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-[280px]">
                  Пчёлка ведёт малыша за руку: показывает буквы на листе, даёт подсказки и забавно летает. Игровые уровни, весёлые проверки и сладкий мёд в награду.
                </p>
              </div>
            </div>

            {/* Level unlock badge */}
            <div className="mt-5 pt-3.5 border-t border-amber-50 flex items-center justify-between text-xs text-amber-800/80 font-bold">
              <span>Доступные уровни: 6</span>
              <span className="px-2.5 py-1 bg-amber-100 rounded-full text-[10px]">
                {unlockedLevel > 1 ? `Открыто: Уровень ${unlockedLevel}` : "Начать с Уровня 1 🚀"}
              </span>
            </div>
          </button>

          {/* CARD 2: PARENT-CHILD SHARING STUDY ROOM */}
          <button
            onClick={() => handleModeChange('read_together')}
            id="btn-read-together-mode"
            className="group block bg-white hover:bg-orange-50/30 rounded-3xl border-2 border-orange-100 hover:border-orange-400 p-6 text-left shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden active:scale-98"
          >
            {/* Ambient orange card fill */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-400/5 rounded-bl-3xl group-hover:bg-orange-400/10 transition-all" />

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-orange-200 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-orange-300/10 group-hover:scale-105 transition-transform">
                👨‍👩‍👧
              </div>
              <div>
                <span className="text-[10px] font-bold text-orange-850 uppercase tracking-widest block mb-1">Совместное чтение</span>
                <h3 className="text-xl font-bold text-amber-950 font-serif mb-1">Читаем вместе</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-[280px]">
                  Экран для совместных занятий с родителем. Любая буква в тексте кликабельна + подробнейший справочник Алеф-Бет с методическими подсказками и традицией.
                </p>
              </div>
            </div>

            {/* Systematic features stats bar */}
            <div className="mt-5 pt-3.5 border-t border-orange-50 flex items-center justify-between text-xs text-orange-900/80 font-bold">
              <span>Интерактивный Алеф-Бет</span>
              <span className="px-2.5 py-1 bg-orange-100 rounded-full text-[10px] flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-orange-600" /> Мемуары, Советы
              </span>
            </div>
          </button>
          
        </div>

        {/* Speakers dynamic sound test checker card */}
        <div className="bg-white rounded-2xl border border-amber-100/60 p-4 shadow-2xs max-w-md w-full flex items-center justify-between text-xs font-semibold gap-3 select-none">
          <div className="flex items-center gap-2 text-amber-900">
            <Volume2 className="w-4 h-4 text-amber-500 animate-bounce" />
            <span>Не слышно звука? Нажмите кнопку справа:</span>
          </div>
          
          <button
            onClick={handleTestSound}
            id="btn-test-sound-check"
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 text-[11px] font-extrabold border border-amber-200/40 cursor-pointer active:scale-95 transition-all"
          >
            🔔 Проверить звук
          </button>
        </div>

      </main>

      {/* Dynamic educational philosophy list block at bottom */}
      <footer className="w-full bg-amber-950 text-amber-100/85 py-6 px-4 relative z-10 border-t-2 border-amber-500/20">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium">
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <p>Педагогический принцип обучения на подлинном тексте Книги Тания</p>
          </div>

          <div className="flex items-center gap-4 text-amber-300">
            <span>Аутентичность традиции</span>
            <span>•</span>
            <span>Мягкое повторение</span>
            <span>•</span>
            <span>Радость учёбы</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
