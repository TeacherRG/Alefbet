import React, { useState } from "react";
import { sound } from "../sound";
import { LETTERS, TANYA_SHAAR_LINES, Letter } from "../lettersData";
import { parseHebrewLineToClusters, HebrewCluster } from "../utils/hebrewParser";
import { ArrowLeft, BookOpen, Compass, ChevronLeft, ChevronRight, Award, Shield, User, Heart, MessageCircle } from "lucide-react";

interface ReadTogetherProps {
  onBack: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function ReadTogether({ onBack, isMuted, onToggleMute }: ReadTogetherProps) {
  const [activeTab, setActiveTab] = useState<'tanya' | 'alefbet'>('tanya');

  // "Тания" tab states
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [honeyedClusterIds, setHoneyedClusterIds] = useState<Set<string>>(new Set());
  const [showParentAdvice, setShowParentAdvice] = useState<boolean>(true);

  // "Алеф-Бет" tab states
  const [currentAlphabetIndex, setCurrentAlphabetIndex] = useState<number>(0);

  // Parse lines of Tanya Title Page
  const parsedLines = React.useMemo(() => {
    return TANYA_SHAAR_LINES.map((lineText, lineIdx) =>
      parseHebrewLineToClusters(lineText, lineIdx)
    );
  }, []);

  // Handle click on cluster in Tanya Tab
  const handleClusterClick = (cluster: HebrewCluster) => {
    const letter = LETTERS.find(l => l.id === cluster.letterId);
    if (!letter) return;

    setSelectedClusterId(cluster.id);
    setSelectedLetter(letter);
    sound.playCorrectHit();
    sound.playLetterSound(letter.soundPitch);

    // Cover letter in honey
    setHoneyedClusterIds(prev => {
      const copy = new Set(prev);
      copy.add(cluster.id);
      return copy;
    });
  };

  // Navigators for Alef-Bet Tab
  const handlePrevLetter = () => {
    setCurrentAlphabetIndex(prev => (prev === 0 ? LETTERS.length - 1 : prev - 1));
    const nextLetter = LETTERS[currentAlphabetIndex === 0 ? LETTERS.length - 1 : currentAlphabetIndex - 1];
    sound.playLetterSound(nextLetter.soundPitch);
  };

  const handleNextLetter = () => {
    setCurrentAlphabetIndex(prev => (prev === LETTERS.length - 1 ? 0 : prev + 1));
    const nextLetter = LETTERS[currentAlphabetIndex === LETTERS.length - 1 ? 0 : currentAlphabetIndex + 1];
    sound.playLetterSound(nextLetter.soundPitch);
  };

  const handleSelectRibbonLetter = (idx: number) => {
    setCurrentAlphabetIndex(idx);
    sound.playLetterSound(LETTERS[idx].soundPitch);
  };

  const activeAlefBetLetter = LETTERS[currentAlphabetIndex] || LETTERS[0];

  return (
    <div className="flex flex-col min-h-screen bg-linear-to-b from-amber-50/40 via-orange-50/20 to-amber-100/30 font-sans relative">
      
      {/* Header controls bar */}
      <div className="w-full bg-white/80 backdrop-blur-md border-b border-amber-100/70 py-3.5 px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            id="back-btn-study"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-100 font-medium transition-all text-sm group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Назад
          </button>
          
          <div className="h-4 w-px bg-amber-200 hidden sm:block" />
          <h1 className="text-lg font-bold text-amber-950 font-serif">Читаем вместе с родителями</h1>
        </div>

        {/* Tab selector buttons */}
        <div className="flex p-1 bg-amber-100/80 rounded-2xl border border-amber-200/50">
          <button
            onClick={() => setActiveTab('tanya')}
            id="tab-tanya-btn"
            className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'tanya'
                ? "bg-white text-amber-950 shadow-sm"
                : "text-amber-800 hover:text-amber-950"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Книга Тания
          </button>
          
          <button
            onClick={() => setActiveTab('alefbet')}
            id="tab-alefbet-btn"
            className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'alefbet'
                ? "bg-white text-amber-950 shadow-sm"
                : "text-amber-800 hover:text-amber-950"
            }`}
          >
            <Compass className="w-4 h-4" />
            Алеф-Бет Справочник
          </button>
        </div>

        {/* Audio helper toggle */}
        <button
          onClick={onToggleMute}
          id="toggle-mute-study-btn"
          className="p-2 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-100 flex items-center gap-1.5 transition-all cursor-pointer text-xs font-semibold"
        >
          {isMuted ? "🔇 Звук выкл" : "🔊 Звук включен"}
        </button>
      </div>

      {/* --- TAB 1: ТАНИЯ (INTERACTIVE STORY BOOK PAGE) --- */}
      {activeTab === 'tanya' && (
        <div className="flex-1 flex flex-col lg:flex-row w-full max-w-7xl mx-auto p-4 gap-4 items-stretch select-none">
          
          {/* Left panel: Info booklet for the touched character */}
          <div className="w-full lg:w-96 bg-white rounded-3xl border border-amber-100/80 shadow-md p-5 flex flex-col justify-between select-none relative z-10">
            {selectedLetter ? (
              <div className="flex flex-col h-full justify-between">
                <div>
                  {/* Card Title */}
                  <div className="text-center pb-4 border-b border-amber-50 mb-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Выбранная буква Текста</span>
                    <h2 className="text-xl font-bold font-serif text-amber-950">Карточка Буквы</h2>
                  </div>

                  {/* Gigantic visual Letter sphere */}
                  <div className="w-36 h-36 bg-linear-to-br from-amber-50 to-orange-100/60 rounded-3xl border border-orange-100 mx-auto flex items-center justify-center shadow-inner relative group mb-4">
                    <span className="text-7xl font-serif text-amber-600 font-bold group-hover:scale-105 transition-transform duration-300 select-none">
                      {selectedLetter.char}
                    </span>
                    <span className="absolute bottom-2 font-mono text-[10px] text-amber-800 font-semibold uppercase tracking-wider">
                      {selectedLetter.nameRu} ({selectedLetter.nameHe})
                    </span>
                    <span className="absolute -top-2.5 -right-2.5 text-2xl animate-pulse">🍯</span>
                  </div>

                  {/* Letter Properties lists */}
                  <div className="space-y-3 mb-5">
                    
                    <div className="flex justify-between items-center text-sm p-2 rounded-xl bg-amber-50/40 border border-amber-100/30">
                      <span className="text-slate-500 font-medium">Произношение:</span>
                      <span className="font-bold text-amber-900 font-serif">{selectedLetter.pronunciation}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm p-2 rounded-xl bg-amber-50/40 border border-amber-100/30">
                      <span className="text-slate-500 font-medium">Числовое значение (Гематрия):</span>
                      <span className="font-mono font-bold text-orange-700">{selectedLetter.gematria}</span>
                    </div>

                    {/* Hasidic and pedagogical tips tabs toggles */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex gap-2 mb-2 justify-center">
                        <button
                          onClick={() => setShowParentAdvice(true)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            showParentAdvice 
                              ? "bg-amber-600 text-white shadow-xs" 
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          👨 Совет Родителю
                        </button>
                        <button
                          onClick={() => setShowParentAdvice(false)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            !showParentAdvice 
                              ? "bg-amber-600 text-white shadow-xs" 
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          📜 Духовный Смысл (Хасидут)
                        </button>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl min-h-[120px] max-h-[160px] overflow-y-auto">
                        {showParentAdvice ? (
                          <p className="text-xs leading-relaxed text-slate-600 italic">
                            {selectedLetter.pedagogicalTip}
                          </p>
                        ) : (
                          <div className="text-xs text-slate-700 leading-relaxed font-serif">
                            <span className="font-bold text-amber-900 block mb-1 font-sans text-[11px] uppercase tracking-wider">Хасидский урок:</span>
                            {selectedLetter.hasidicMeaning}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                <div className="bg-amber-50/30 p-2 text-center rounded-xl border border-amber-100/30">
                  <span className="text-[10px] text-slate-500">Нажми на другую букву справа, чтобы изучить!</span>
                </div>
              </div>
            ) : (
              /* Intro helper slot when no letter clicked */
              <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                <span className="text-5xl mb-3 animate-bounce">📚</span>
                <h3 className="text-lg font-bold text-amber-950 font-serif mb-2">Нажмите на букву</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-[240px]">
                  Коснитесь любой буквы на священной странице Тании справа. Буква нальётся сладким мёдом Традиции, а здесь откроется её секретное хасидское значение!
                </p>
              </div>
            )}
          </div>

          {/* Right Area: Large, glorious scrolls with the 18 Tanya lines (clickable) */}
          <div className="flex-1 bg-white rounded-3xl border border-amber-100/70 shadow-md p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden select-none">
            
            {/* Header frame */}
            <div className="text-center mb-6 pb-2 border-b border-amber-100/50">
              <span className="text-emerald-800 font-bold uppercase text-[10px] tracking-widest font-serif block">СВЯЩЕННАЯ СТРАНИЦА КНИГИ</span>
              <h2 className="text-lg font-bold font-serif text-amber-950">Титульный Шаар Тании</h2>
            </div>

            {/* Book text reading interface */}
            <div 
              dir="rtl" // Right-to-left
              className="flex-1 py-4 flex flex-col justify-center gap-2.5 sm:gap-4.5 select-none"
            >
              {parsedLines.map((rowClusters, lineIdx) => (
                <div 
                  key={lineIdx} 
                  className="flex items-center justify-center flex-wrap gap-x-0.5 sm:gap-x-1"
                >
                  {rowClusters.map((cluster) => {
                    if (cluster.isSpace) {
                      return (
                        <span 
                          key={cluster.id} 
                          className="text-slate-300 font-serif text-lg sm:text-2xl select-none px-0.5"
                        >
                          {cluster.originalText === " " ? "\u00A0" : cluster.originalText}
                        </span>
                      );
                    }

                    const isHoneyed = honeyedClusterIds.has(cluster.id);
                    const isSelected = selectedClusterId === cluster.id;

                    return (
                      <button
                        key={cluster.id}
                        onClick={() => handleClusterClick(cluster)}
                        className={`font-serif text-xl sm:text-2xl md:text-3xl py-0.5 px-0.5 rounded-md transition-all duration-300 focus:outline-hidden cursor-pointer ${
                          isHoneyed
                            ? "bg-amber-400 text-amber-950 font-extrabold shadow-xs hover:border-amber-500 scale-105"
                            : isSelected
                            ? "bg-amber-100 border-2 border-amber-400 scale-110 z-10"
                            : "hover:bg-amber-50 text-slate-800"
                        }`}
                      >
                        {cluster.originalText}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Interactive footer tracker */}
            <div className="mt-4 border-t border-slate-100 pt-3 flex justify-between text-xs text-slate-400">
              <span>Собрано буквенного мёда: {honeyedClusterIds.size} шт.</span>
              <span>100% аутентичный еврейский текст</span>
            </div>

          </div>

        </div>
      )}


      {/* --- TAB 2: АЛЕФ-БЕТ (SYSTEMATIC VISUAL MANUAL) --- */}
      {activeTab === 'alefbet' && (
        <div className="flex-1 w-full max-w-5xl mx-auto p-4 flex flex-col items-center select-none justify-center">
          
          {/* Horizontal scrollable select-ribbon row of the 32 letter variants at the top */}
          <div className="w-full bg-white/95 rounded-2xl border border-amber-100 shadow-sm p-4.5 mb-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center mb-3">Лента букв Алеф-Бет</span>
            
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none justify-start px-2 sm:justify-center">
              {LETTERS.map((letter, idx) => {
                const isSelected = idx === currentAlphabetIndex;
                return (
                  <button
                    key={letter.id}
                    id={`alefbet-ribbon-btn-${idx}`}
                    onClick={() => handleSelectRibbonLetter(idx)}
                    className={`flex-shrink-0 w-11 h-11 rounded-full font-serif font-bold text-lg.5 transition-all cursor-pointer flex items-center justify-center border ${
                      isSelected
                        ? "bg-amber-500 border-amber-600 text-white shadow-md scale-110"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-3xs"
                    }`}
                  >
                    {letter.char}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Interactive Card Display */}
          <div className="w-full max-w-xl bg-white rounded-3xl border border-amber-100 shadow-lg p-6 sm:p-8 flex flex-col justify-between items-center text-center relative overflow-hidden select-none">
            
            {/* Top row with index badge indicator */}
            <div className="w-full flex justify-between items-center border-b border-amber-50 pb-4 mb-4">
              <span className="text-xs font-bold text-slate-400 tracking-wider">СПРАВОЧНИК ОЛИМП</span>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold font-mono rounded-full">
                Буква {currentAlphabetIndex + 1} из {LETTERS.length}
              </span>
            </div>

            {/* Carousel navigation arrow-letter block */}
            <div className="w-full flex items-center justify-between gap-4 mb-5">
              
              {/* Left back button */}
              <button
                onClick={handlePrevLetter}
                id="alefbet-prev-btn"
                className="p-3 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-100 hover:border-amber-200 text-amber-800 shadow-xs cursor-pointer active:scale-95 transition-all"
                title="Назад"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Massive Center Letter Card */}
              <div className="flex-1 max-w-xs bg-linear-to-b from-amber-50 to-orange-100/50 rounded-3xl border border-amber-100 p-6 flex flex-col items-center shadow-inner relative group">
                
                {/* Drip honey crown icon absolute */}
                <span className="text-4xl absolute -top-4 -right-2 transform rotate-12 drop-shadow-md group-hover:scale-110 transition-transform">🍯</span>

                {/* Massive 108px Hebrew lettering display */}
                <div className="text-[120px] font-serif font-extrabold text-amber-600 h-32 flex items-center justify-center drop-shadow-sm select-none">
                  {activeAlefBetLetter.char}
                </div>

                {/* Letter title */}
                <h2 className="text-2xl font-bold text-amber-950 font-serif mb-1 mt-4">
                  {activeAlefBetLetter.nameRu}
                </h2>
                <h3 className="text-md text-amber-800 font-bold font-serif mb-3">
                  {activeAlefBetLetter.nameHe}
                </h3>

                {/* Properties grid block */}
                <div className="w-full space-y-1.5 border-t border-amber-200/50 pt-3 mt-1.5 text-xs text-left">
                  <div className="flex justify-between py-1 border-b border-dashed border-amber-100">
                    <span className="text-slate-500 font-medium">Произношение:</span>
                    <span className="font-bold text-slate-800 font-serif">{activeAlefBetLetter.pronunciation}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dashed border-amber-100">
                    <span className="text-slate-500 font-medium">Число (Гематрия):</span>
                    <span className="font-bold font-mono text-orange-700 text-sm">{activeAlefBetLetter.gematria}</span>
                  </div>
                </div>

              </div>

              {/* Right forward button */}
              <button
                onClick={handleNextLetter}
                id="alefbet-next-btn"
                className="p-3 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-100 hover:border-amber-200 text-amber-800 shadow-xs cursor-pointer active:scale-95 transition-all"
                title="Вперед"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

            </div>

            {/* Advice panel scroll block */}
            <div className="w-full bg-slate-50 border border-slate-200 p-4.5 rounded-2xl text-left max-h-[160px] overflow-y-auto">
              {/* Gematria / spiritual depth */}
              <div className="mb-3">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">📜 Духовное хасидское учение:</span>
                <p className="text-xs text-slate-700 font-serif leading-relaxed">
                  {activeAlefBetLetter.hasidicMeaning}
                </p>
              </div>

              {/* Pedagogical info */}
              <div className="border-t border-slate-200/60 pt-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">👨 Педагогический совет по букве:</span>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  {activeAlefBetLetter.pedagogicalTip}
                </p>
              </div>
            </div>

            {/* Direct counter */}
            <span className="text-[10px] text-slate-400 mt-4 font-mono">
              Позиция в Алеф-Бет: индекс `{activeAlefBetLetter.id + 1}` • Башня мудрости
            </span>

          </div>

        </div>
      )}

    </div>
  );
}
