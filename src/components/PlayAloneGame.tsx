import React, { useState, useEffect, useRef } from "react";
import { sound } from "../sound";
import { LETTERS, LEVEL_TO_LETTERS, TANYA_SHAAR_LINES, Letter } from "../lettersData";
import { parseHebrewLineToClusters, HebrewCluster } from "../utils/hebrewParser";
import { ArrowLeft, RefreshCw, Volume2, VolumeX, Shield, Award, HelpCircle } from "lucide-react";

interface PlayAloneGameProps {
  onBack: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function PlayAloneGame({ onBack, isMuted, onToggleMute }: PlayAloneGameProps) {
  // Level and phase state
  const [currentLevel, setCurrentLevel] = useState<number>(() => {
    const saved = localStorage.getItem("tanya_kids_level");
    return saved ? parseInt(saved, 10) : 1;
  });

  // Current sub-phase
  // 'intro': Showing the "Мы учим буквы!" popup
  // 'learning': Phase 1 - Learning with bee hints
  // 'transition': Popup "Мы ищем буквы!" between phases
  // 'testing': Phase 2 - Testing letters without bee
  // 'success': Popup "Молодец!" after passing level
  // 'fail': Popup "Учимся снова!" after 3 mistakes
  const [gameState, setGameState] = useState<'intro' | 'learning' | 'transition' | 'testing' | 'success' | 'fail'>('intro');

  // Indexes in the current level's letters array
  const [currentLetterIdx, setCurrentLetterIdx] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(3); // 3 Honey pots
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");

  // Track letters that has been covered in honey in the current level
  const [honeyedClusterIds, setHoneyedClusterIds] = useState<Set<string>>(new Set());

  // Bee coordinate tracking
  const [beeCoords, setBeeCoords] = useState<{ x: number; y: number } | null>(null);
  const [beeAction, setBeeAction] = useState<'idle' | 'flying' | 'jumping' | 'happy'>('idle');
  const [beeVisible, setBeeVisible] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Get letters for the current level
  const levelLettersIds = LEVEL_TO_LETTERS[currentLevel] || LEVEL_TO_LETTERS[1];
  const levelLetters: Letter[] = levelLettersIds.map(id => LETTERS[id]);
  const activeLetter = levelLetters[currentLetterIdx] || levelLetters[0];

  // Parse lines of Tanya Title Page
  const parsedLines = React.useMemo(() => {
    return TANYA_SHAAR_LINES.map((lineText, lineIdx) =>
      parseHebrewLineToClusters(lineText, lineIdx)
    );
  }, []);

  // Find the target cluster for the current letter in learning phase
  const targetCluster = React.useMemo(() => {
    if (!activeLetter) return null;
    // Walk through and find the first matching cluster
    for (const line of parsedLines) {
      for (const cluster of line) {
        if (cluster.letterId === activeLetter.id) {
          return cluster;
        }
      }
    }
    return null;
  }, [activeLetter, parsedLines]);

  // Position the bee over the target cluster
  const updateBeePosition = () => {
    if (gameState !== 'learning' && gameState !== 'fail') {
      // Move bee back to its home spot (left panel) in testing phase
      setBeeCoords(null);
      return;
    }

    if (!targetCluster || !containerRef.current) return;

    const targetEl = document.getElementById(`cluster-${targetCluster.id}`);
    const parentEl = containerRef.current;

    if (targetEl && parentEl) {
      const targetRect = targetEl.getBoundingClientRect();
      const parentRect = parentEl.getBoundingClientRect();

      // Calculate center coordinates relative to parent text container
      const x = (targetRect.left + targetRect.width / 2) - parentRect.left;
      const y = (targetRect.top + targetRect.height / 2) - parentRect.top;

      setBeeAction('flying');
      sound.playBeeFlight();

      setTimeout(() => {
        setBeeCoords({ x, y });
        setBeeAction('jumping'); // sit and bob happily
      }, 50);
    }
  };

  // Run bee positioning on letter change or phase change
  useEffect(() => {
    // Small timeout to guarantee DOM is rendered
    const timer = setTimeout(() => {
      updateBeePosition();
    }, 150);

    return () => clearTimeout(timer);
  }, [currentLetterIdx, gameState, targetCluster, currentLevel]);

  // Handle window resizing to keep bee at the exact letter
  useEffect(() => {
    window.addEventListener("resize", updateBeePosition);
    return () => window.removeEventListener("resize", updateBeePosition);
  }, [currentLetterIdx, gameState, targetCluster]);

  const handleStartLevel = () => {
    setHoneyedClusterIds(new Set());
    setCurrentLetterIdx(0);
    setAttempts(3);
    setGameState('learning');
    sound.playLetterSound(levelLetters[0].soundPitch);
  };

  const handleStartTesting = () => {
    setHoneyedClusterIds(new Set()); // Reset honey for test phase
    setCurrentLetterIdx(0);
    setAttempts(3);
    setGameState('testing');
    sound.playLevelUnlock();
  };

  const restartCurrentLevel = () => {
    handleStartLevel();
  };

  // Triggers when correct letter touched in Phase 1 (Learning)
  const handleCorrectTouchLearning = (cluster: HebrewCluster) => {
    if (gameState !== 'learning') return;

    sound.playCorrectHit();
    sound.playLetterSound(activeLetter.soundPitch);

    // Apply honey coating to the touched cluster
    setHoneyedClusterIds(prev => {
      const copy = new Set(prev);
      copy.add(cluster.id);
      return copy;
    });

    setBeeAction('happy');

    // Proceed to next letter in 1.1s
    setTimeout(() => {
      if (currentLetterIdx + 1 < levelLetters.length) {
        setCurrentLetterIdx(prev => prev + 1);
      } else {
        // Learning phase complete! Show transition popup
        setGameState('transition');
        sound.playVictory();
      }
    }, 1100);
  };

  // Triggers in Phase 2 (Testing) on any cluster click
  const handleClusterClickTesting = (cluster: HebrewCluster) => {
    if (gameState !== 'testing') return;

    if (cluster.letterId === activeLetter.id) {
      // CORRECT!
      sound.playCorrectHit();
      sound.playLetterSound(activeLetter.soundPitch);

      setHoneyedClusterIds(prev => {
        const copy = new Set(prev);
        copy.add(cluster.id);
        return copy;
      });

      // Show checkmark animation
      setFeedbackMessage("correct");

      setTimeout(() => {
        setFeedbackMessage("");
        if (currentLetterIdx + 1 < levelLetters.length) {
          setCurrentLetterIdx(prev => prev + 1);
        } else {
          // Success! Passed level
          setGameState('success');
          sound.playVictory();

          // Save unlocked progress in localStorage
          const nextLv = Math.min(6, currentLevel + 1);
          localStorage.setItem("tanya_kids_level", nextLv.toString());
        }
      }, 1200);

    } else {
      // INCORRECT!
      sound.playError();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 450);

      const nextAttempts = attempts - 1;
      setAttempts(nextAttempts);

      if (nextAttempts === 0) {
        // Failed the test. Let the bee fly automatically to show correct letter
        setTimeout(() => {
          sound.playHintShowing();
          updateBeePosition(); // fly to core correct target
          setGameState('fail'); // trigger learning again modal after 2.5s review
        }, 800);
      }
    }
  };

  // Go to next level
  const handleNextLevel = () => {
    const nextL = Math.min(6, currentLevel + 1);
    setCurrentLevel(nextL);
    setGameState('intro');
    setCurrentLetterIdx(0);
    setAttempts(3);
    setHoneyedClusterIds(new Set());
  };

  const handleSelectLevelBadge = (levelNum: number) => {
    // Only allow level transition if unlocked or passed
    const maxUnlocked = parseInt(localStorage.getItem("tanya_kids_level") || "1", 10);
    if (levelNum <= maxUnlocked) {
      setCurrentLevel(levelNum);
      setGameState('intro');
      setCurrentLetterIdx(0);
      setAttempts(3);
      setHoneyedClusterIds(new Set());
    }
  };

  const currentMaxUnlocked = parseInt(localStorage.getItem("tanya_kids_level") || "1", 10);

  return (
    <div className="flex flex-col min-h-screen bg-linear-to-b from-amber-50/50 via-orange-50/30 to-amber-100/40 font-sans relative overflow-x-hidden">
      
      {/* Upper Navigation and Stars Row */}
      <div className="w-full bg-white/80 backdrop-blur-md border-b border-amber-100/70 py-3.5 px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 z-45 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            id="back-to-menu-btn"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-100 font-medium transition-all text-sm group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Назад
          </button>
          
          <div className="h-4 w-px bg-amber-200 hidden sm:block" />
          <h1 className="text-lg font-bold text-amber-950 font-serif">Тания Малышам</h1>
        </div>

        {/* Level Select stars panel */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-amber-800/80 uppercase tracking-wider mr-2">Уровни:</span>
          <div className="flex bg-amber-50/70 p-1.5 rounded-2xl border border-amber-100/60 gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((lNum) => {
              const isPassed = lNum < currentMaxUnlocked;
              const isCurrent = lNum === currentLevel;
              const isLocked = lNum > currentMaxUnlocked;

              return (
                <button
                  key={lNum}
                  id={`level-star-btn-${lNum}`}
                  disabled={isLocked}
                  onClick={() => handleSelectLevelBadge(lNum)}
                  className={`relative flex items-center justify-center w-8.5 h-8.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isPassed
                      ? "bg-amber-400 hover:bg-amber-500 text-white shadow-xs"
                      : isCurrent
                      ? "bg-amber-600 text-white border-2 border-amber-400 shadow-md scale-105"
                      : isLocked
                      ? "bg-slate-200/60 text-slate-400 cursor-not-allowed"
                      : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  }`}
                  title={`Уровень ${lNum}`}
                >
                  {isLocked ? "🔒" : isPassed ? "🌟" : "⭐"}
                  <span className="absolute -bottom-5 text-[9px] font-medium text-amber-900/60">{lNum}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio helper toggle */}
        <button
          onClick={onToggleMute}
          id="toggle-mute-game-btn"
          className="p-2 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-100 flex items-center gap-1.5 transition-all cursor-pointer text-xs"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-red-500" />
              <span>Звук выкл</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Звук вкл</span>
            </>
          )}
        </button>
      </div>

      {/* Progress horizontal row containing the 5 letters of level */}
      <div className="w-full bg-amber-400/10 py-2 border-b border-amber-100/30 flex justify-center items-center gap-2">
        <span className="text-xs font-bold text-amber-950 font-serif mr-1">Прогресс уровня:</span>
        <div className="flex gap-1.5">
          {levelLetters.map((letter, idx) => {
            const isCompleted = idx < currentLetterIdx;
            const isCurrent = idx === currentLetterIdx && (gameState === 'learning' || gameState === 'testing');
            
            return (
              <div
                key={letter.id}
                id={`progress-node-${idx}`}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-serif font-bold transition-all ${
                  isCompleted
                    ? "bg-amber-400 border-amber-500 text-amber-950 shadow-xs"
                    : isCurrent
                    ? "bg-white border-2 border-amber-600 text-amber-950 scale-105"
                    : "bg-white/40 border-slate-200/60 text-slate-400"
                }`}
              >
                {isCompleted ? "✓" : letter.char}
              </div>
            );
          })}
        </div>
      </div>

      {/* Workspace Area: Left side bar (status/guides) & Right side (Tanya interactive panel) */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto p-4 gap-4 items-stretch relative">
        
        {/* Left Side Fixed Board */}
        <div className="w-full md:w-80 bg-white/95 rounded-2xl border border-amber-100 p-5 flex flex-col justify-between shadow-md relative z-10 select-none">
          <div className="flex flex-col items-center">
            
            {/* Phase header indicator */}
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${
              gameState === 'testing' 
                ? "bg-blue-100 text-blue-800 border border-blue-200" 
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}>
              {gameState === 'testing' ? "🔍 Фаза Игры: Проверка" : "🐝 Фаза Игры: Обучение"}
            </div>

            {/* Target Letter Large Panel */}
            <div className="relative mb-5 w-44 h-44 rounded-2xl bg-linear-to-br from-amber-50 to-orange-100/50 border border-amber-200/60 flex flex-col items-center justify-center shadow-inner group">
              
              {/* Massive Hebrew Character display */}
              <div 
                className={`text-[88px] font-serif font-bold h-24 flex items-center justify-center transition-all duration-300 drop-shadow-md select-none ${
                  gameState === 'testing' ? "text-blue-700" : "text-amber-500 animate-pulse"
                }`}
              >
                {activeLetter.char}
              </div>

              {/* Verified Badge */}
              {feedbackMessage === "correct" && (
                <div className="absolute inset-0 bg-amber-400/90 rounded-2xl flex items-center justify-center transition-all animate-bounce">
                  <span className="text-white text-5xl font-bold">✅</span>
                </div>
              )}

              {/* Status bar description (Letter Name and Gematria help) */}
              <div className="absolute bottom-2 inset-x-0 text-center flex flex-col">
                <span className="text-xs font-bold text-amber-900 group-hover:scale-105 transition-all">
                  Буква {activeLetter.nameRu} ({activeLetter.nameHe})
                </span>
                <span className="text-[10px] text-amber-700 font-mono">
                  Гематрия (Число): {activeLetter.gematria}
                </span>
              </div>
            </div>

            {/* Instruction Bubble for kid */}
            <div className="w-full bg-amber-50 border border-amber-200/50 p-3 rounded-xl mb-4 text-center">
              <span className="text-xs font-bold text-amber-950 block mb-0.5">💡 Задание:</span>
              <p className="text-sm font-semibold text-amber-800 font-serif">
                {gameState === 'testing' 
                  ? `Найди букву "${activeLetter.char}" в тексте!` 
                  : `Коснись мигающей буквы "${activeLetter.char}"!`
                }
              </p>
            </div>

            {/* Pedagogical support box for mothers/fathers to view/learn */}
            <div className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <div className="flex items-center gap-1 mb-1 justify-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Родителю: совет</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 italic">
                {activeLetter.pedagogicalTip}
              </p>
            </div>

          </div>

          {/* Bottom stats block: attempts / lives in testing mode, static bee home placement */}
          <div className="mt-5 border-t border-slate-100 pt-4 flex flex-col items-center">
            
            {/* Lives / Attempt count */}
            {gameState === 'testing' ? (
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Попытки (мёд):</span>
                <div className="flex gap-3">
                  {[1, 2, 3].map((val) => {
                    const isLeft = val <= attempts;
                    return (
                      <span
                        key={val}
                        id={`honey-heart-${val}`}
                        className={`text-3xl transition-transform duration-300 ${
                          isLeft ? "opacity-100 scale-110 drop-shadow-[0_2px_4px_rgba(245,158,11,0.2)]" : "opacity-25 grayscale scale-90"
                        }`}
                      >
                        🍯
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Static Bee rest-area banner for kids */
              <div className="flex items-center gap-2 bg-amber-50/40 px-3.5 py-1.5 rounded-xl border border-amber-100/40 text-amber-900/80">
                <div className="w-8 h-8 flex items-center justify-center relative">
                  {/* Simple Bee icon helper */}
                  <span className="text-xl animate-bounce">🐝</span>
                </div>
                <span className="text-xs font-semibold">Пчёлка учит буквы!</span>
              </div>
            )}

            {/* Audio key reminder */}
            <span className="text-[10px] text-slate-400 mt-3 font-mono">
              Играет на Web Audio API • Без рекламы
            </span>
          </div>

        </div>

        {/* Right Side: Tanya Book Title Page Text Area */}
        <div className="flex-1 bg-white rounded-2xl border border-amber-100/70 shadow-md p-6 flex flex-col justify-between relative overflow-hidden select-none">
          
          {/* Header wood frame */}
          <div className="text-center mb-5 border-b border-amber-100/60 pb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-900/60 font-serif">Титульный лист святой книги Тания (Шаар)</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Справа налево (רוח המלכות)</p>
          </div>

          {/* Interactive Letters board container */}
          <div 
            id="tanya-text-container"
            ref={containerRef}
            dir="rtl" // Right to left reading
            className={`relative flex-1 py-4 flex flex-col justify-center gap-2.5 sm:gap-4 md:gap-4.5 select-none transition-transform duration-300 ${
              isShaking ? "animate-shake" : ""
            }`}
          >
            
            {/* The Flight path animated Bee SVG component! ONLY render if coords exist and bee visible */}
            {beeVisible && beeCoords && (
              <div
                id="flying-bee-node"
                className="absolute z-50 pointer-events-none transition-all duration-750 ease-out"
                style={{
                  left: `${beeCoords.x}px`,
                  top: `${beeCoords.y}px`,
                  transform: `translate(-50%, -100%) ${beeAction === 'happy' ? 'scale(1.2) rotate(10deg)' : 'scale(1)'}`,
                }}
              >
                {/* Visual Bee markup */}
                <div className="relative flex flex-col items-center">
                  
                  {/* Double flapping angel wings */}
                  <div className="absolute -top-3.5 flex gap-1 justify-center z-10 w-full">
                    {/* Left wing */}
                    <svg className="w-4 h-4 fill-sky-200/85 stroke-sky-400/80 stroke-1 transform -rotate-12 origin-bottom-right" viewBox="0 0 24 24">
                      <path d="M12 21.5C12 21.5 5 15.5 5 10C5 6.5 7.5 4 10.5 4C13.5 4 15 7.5 15 10" />
                    </svg>
                    {/* Right wing (mirror) */}
                    <svg className="w-4 h-4 fill-sky-200/85 stroke-sky-400/80 stroke-1 transform rotate-12 origin-bottom-left" viewBox="0 0 24 24">
                      <path d="M12 21.5C12 21.5 19 15.5 19 10C19 6.5 16.5 4 13.5 4C10.5 4 9 7.5 9 10" />
                    </svg>
                  </div>

                  {/* Bee main core container with yellow striped circles */}
                  <div className="w-10 h-10 rounded-full bg-amber-400 border-2 border-slate-900 shadow-md flex flex-col items-center justify-center relative overflow-hidden animate-pulse">
                    
                    {/* Striped stripes inside bee */}
                    <div className="w-full h-1.5 bg-slate-950 absolute top-2 rotate-6 opacity-85" />
                    <div className="w-full h-1.5 bg-slate-950 absolute top-5 rotate-6 opacity-85" />

                    {/* Kawaii Face eyes */}
                    <div className="flex justify-between w-5 absolute top-2.5 z-20">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-bounce" />
                    </div>

                    {/* Cute cheeks blush */}
                    <div className="flex justify-between w-6 absolute top-4 z-15">
                      <div className="w-1 h-1 rounded-full bg-rose-400/80" />
                      <div className="w-1 h-1 rounded-full bg-rose-400/80" />
                    </div>

                    {/* Little smile */}
                    <div className="w-2.5 h-1 border-b border-slate-950 absolute bottom-3 z-20 rounded-full" />
                  </div>

                  {/* Stinger */}
                  <div className="w-1.5 h-2 bg-slate-900 clip-path-polygon transform rotate-180 absolute -bottom-1" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />

                  {/* Tiny flying golden stars trail */}
                  <span className="text-[10px] absolute -right-2 top-2 animate-bounce">✨</span>
                </div>
              </div>
            )}

            {/* Map each line onto rows */}
            {parsedLines.map((rowClusters, lineIdx) => (
              <div 
                key={lineIdx}
                id={`tanya-row-${lineIdx}`}
                className="flex items-center justify-center flex-wrap gap-x-0.5 sm:gap-x-1"
              >
                {rowClusters.map((cluster) => {
                  if (cluster.isSpace) {
                    return (
                      <span 
                        key={cluster.id} 
                        className="text-slate-400/70 font-serif text-lg select-none px-0.5"
                      >
                        {cluster.originalText === " " ? "\u00A0" : cluster.originalText}
                      </span>
                    );
                  }

                  // Check honey status
                  const isHoneyed = honeyedClusterIds.has(cluster.id);

                  // Highlights / flashing circles for learning phase
                  const isLearningTarget = gameState === 'learning' && cluster.letterId === activeLetter.id;

                  // High-contrast highlighting for fail-state (when bee sits for 2.5s to show where correct letter lay)
                  const isCorrectAnswerHighlight = (gameState === 'fail' || isMuted === false && attempts === 0) && cluster.letterId === activeLetter.id;

                  return (
                    <button
                      key={cluster.id}
                      id={`cluster-${cluster.id}`}
                      disabled={gameState !== 'testing' && !isLearningTarget}
                      onClick={() => {
                        if (gameState === 'learning' && isLearningTarget) {
                          handleCorrectTouchLearning(cluster);
                        } else if (gameState === 'testing') {
                          handleClusterClickTesting(cluster);
                        }
                      }}
                      className={`relative font-serif font-bold text-lg sm:text-2xl py-0.5 px-1 rounded-md transition-all duration-300 focus:outline-hidden ${
                        isHoneyed
                          ? "bg-amber-400 text-amber-950 font-extrabold shadow-sm honey-active scale-110 z-10"
                          : isLearningTarget
                          ? "bg-amber-100 hover:bg-amber-200 text-amber-950 border border-dashed border-amber-400 animate-pulse cursor-pointer shadow-lg scale-110"
                          : isCorrectAnswerHighlight
                          ? "bg-red-100 border-2 border-red-500 scale-120 animate-bounce text-red-950 z-20 shadow-xl"
                          : gameState === 'testing'
                          ? "hover:bg-slate-100 text-slate-800 cursor-pointer active:scale-95"
                          : "text-slate-400 hover:text-slate-500/80 disabled:opacity-40"
                      }`}
                    >
                      {/* Voweled Hebrew cluster */}
                      <span>{cluster.originalText}</span>

                      {/* Floating honey drips visual indicator overlay */}
                      {isHoneyed && (
                        <span className="absolute -top-1.5 -right-1 text-xs drop-shadow-xs z-25">🍯</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer visual indicators */}
          <div className="mt-4 border-t border-slate-100 pt-3 flex justify-between text-[11px] text-slate-400 font-medium">
            <span>Буквы уровня: {levelLetters.map(l => l.char).join(', ')}</span>
            <span>Изучено букв: {currentLetterIdx} из {levelLetters.length}</span>
          </div>

        </div>
      </div>

      {/* MODAL 1: "Мы учим буквы!" (Intro popup) */}
      {gameState === 'intro' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-90">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-amber-100 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center animate-bounce-in relative">
            <span className="text-5xl mb-3">🐝</span>
            
            <h2 className="text-2xl font-bold text-amber-950 font-serif mb-1 uppercase tracking-tight">Мы учим буквы!</h2>
            <p className="text-[15px] font-medium text-slate-500 font-serif dir-rtl mb-4">כָּאן לוֹמְדִים אוֹתִיּוֹת הַתּוֹרָה</p>

            <p className="text-sm text-slate-600 mb-6">
              Мы начинаем <strong className="text-amber-800">Уровень {currentLevel}</strong>! На первом шаге пчёлка полетит и покажет буквы на священном листе Тании. Коснись каждой золотой буквы!
            </p>

            <div className="bg-amber-50/70 p-4.5 rounded-2xl border border-amber-100/50 w-full mb-6">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-widest block mb-2.5">Малыш выучит эти {levelLetters.length} букв:</span>
              <div className="flex justify-center items-center gap-3">
                {levelLetters.map((l) => (
                  <div key={l.id} className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-xs border border-amber-100 flex items-center justify-center text-2xl font-serif font-bold text-amber-950">
                      {l.char}
                    </div>
                    <span className="text-[10px] text-amber-900/80 font-bold mt-1.5">{l.nameRu}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartLevel}
              id="intro-modal-start-btn"
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 group"
            >
              🚀 Поехали!
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: "Мы ищем буквы!" (Transition popup to phase 2) */}
      {gameState === 'transition' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-90">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-amber-100 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center animate-scale-up relative">
            <span className="text-5xl mb-2.5 animate-bounce">🍯</span>
            
            <h2 className="text-2xl font-bold text-amber-950 font-serif mb-1">Мы ищем буквы!</h2>
            <p className="text-[15px] font-medium text-slate-500 font-serif mb-4">כָּל הַכָּבוֹד — מְחַפְּשִׂים אוֹתִיּוֹת</p>

            <p className="text-sm text-slate-600 mb-6">
              Великолепно! Ты коснулся всех букв. А теперь давай <strong className="text-emerald-700">поищем буквы самостоятельно</strong> без подсказки пчёлки! Ищи нужную букву и покрывай её сладким мёдом!
            </p>

            <button
              onClick={handleStartTesting}
              id="transition-modal-start-btn"
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              🔍 Начнём Поиск!
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: "Молодец! כָּל הַכָּבוֹД" (Level success popup) */}
      {gameState === 'success' && (
        <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md flex items-center justify-center p-4 z-90">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-amber-100 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center animate-scale-up relative">
            {/* Crown reward */}
            <div className="w-18 h-18 rounded-full bg-amber-100 flex items-center justify-center text-4xl mb-4 animate-pulse">
              👑
            </div>
            
            <h2 className="text-3xl font-bold text-amber-950 font-serif mb-1">Молодец!</h2>
            <h3 className="text-2xl font-serif text-amber-600 mb-4 font-bold">כָּל הַכָּבוֹד!</h3>

            <p className="text-sm text-slate-600 mb-6">
              Ты отлично справился, нашёл все спрятанные буквы уровня и угостил пчёлку мёдом! Книга гордится твоими знаниями.
            </p>

            <div className="bg-amber-50/70 p-4.5 rounded-2xl border border-amber-100/50 w-full mb-6">
              <span className="text-xs font-bold text-amber-800 uppercase block mb-2.5">Твой прогресс сохранён:</span>
              <div className="flex justify-center items-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((lNum) => {
                  const isPassed = lNum <= currentLevel;
                  return (
                    <span key={lNum} className={`text-2xl ${isPassed ? "opacity-100" : "opacity-20"}`}>🌟</span>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={restartCurrentLevel}
                id="success-modal-restart-btn"
                className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-md transition-all cursor-pointer"
              >
                🔁 Снова
              </button>
              
              {currentLevel < 6 ? (
                <button
                  onClick={handleNextLevel}
                  id="success-modal-next-btn"
                  className="flex-2 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-md shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Звезда {currentLevel + 1}! Полетели 🚀
                </button>
              ) : (
                <button
                  onClick={onBack}
                  id="success-modal-home-btn"
                  className="flex-2 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-md shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  🎉 В Главное Меню
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: "Учимся снова!" (Fail state popup) */}
      {gameState === 'fail' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-90">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-rose-100 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center animate-scale-up relative">
            <span className="text-5xl mb-3 animate-pulse">🎓</span>
            
            <h2 className="text-2xl font-bold text-amber-950 font-serif mb-1">Учимся снова!</h2>
            <p className="text-[15px] font-medium text-slate-500 font-serif mb-4">חוֹזְרִים עַל הַחֹמֶר בְּאַהֲבָה</p>

            <p className="text-sm text-slate-600 mb-6 font-medium">
              Ой, мёд пролился! Но мы не унываем. Наука требует повторения. Давай пчёлка покажет буквы ещё раз, и всё у нас получится!
            </p>

            <button
              onClick={restartCurrentLevel}
              id="fail-modal-retry-btn"
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              🐝 Давай, Пчёлка!
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
