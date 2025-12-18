
import React from 'react';
import { Gift, AppPhase } from '../types';
import { Lock, Trophy, Zap, FlaskConical, Beaker, Minus, Plus, Heart, Timer } from 'lucide-react';

interface GiftCardProps {
  gift: Gift;
  userPointsAllocated: number;
  remainingUserCredits?: number;
  phase: AppPhase;
  canAllocate: boolean;
  timeLeft: number;
  isAdmin: boolean;
  onAllocate: (giftId: string, amount: number) => void;
  onAdminReveal?: (giftId: string) => void;
  currentUserName: string;
}

export const GiftCard: React.FC<GiftCardProps> = ({
  gift,
  userPointsAllocated,
  remainingUserCredits = 0,
  phase,
  canAllocate,
  timeLeft,
  isAdmin,
  onAllocate,
  onAdminReveal,
  currentUserName,
}) => {
  const isRevealPhase = phase === AppPhase.ROUND_REVEAL || phase === AppPhase.ROUND_LOCKED;
  const isBettingPhase = phase === AppPhase.ROUND_ACTIVE;
  const canAdminReveal = isAdmin && isRevealPhase && (!gift.isContentRevealed || !gift.isWinnerRevealed);

  // VISTA PARA ADMINISTRADORES (PROYECTOR)
  if (isAdmin) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 h-full flex items-center justify-center">
        <div 
          onClick={() => canAdminReveal && onAdminReveal && onAdminReveal(gift.id)}
          className={`relative flex flex-col lg:flex-row bg-black border-[4px] border-white w-full h-[85vh] rounded-[20px] overflow-hidden ${
            canAdminReveal ? 'cursor-pointer hover:bg-white/5' : ''
          }`}
        >
          {/* Lado Izquierdo: Info Premio (Stark White on Black) */}
          <div className="w-full lg:w-7/12 relative flex items-center justify-center p-12 border-r-[4px] border-white">
               <div className="relative z-10 flex flex-col items-center text-center">
                  {gift.isContentRevealed ? (
                      <div className="animate-in fade-in duration-500">
                          <div className="text-[180px] mb-8 leading-none">{gift.emoji}</div>
                          <h3 className="text-7xl font-black text-white mb-8 uppercase tracking-tighter leading-none">{gift.revealedName}</h3>
                          <div className="inline-flex items-center gap-4 px-10 py-5 bg-white text-black rounded-none font-black uppercase text-xl">
                              {gift.packs} UNIDADES
                          </div>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center">
                          <div className="w-80 h-80 border-[6px] border-white rounded-none flex items-center justify-center bg-black mb-12">
                             {isBettingPhase ? <Beaker size={100} className="text-white animate-pulse" /> : <Lock size={100} className="text-white/30" />}
                          </div>
                          <h3 className="text-2xl font-black tracking-[0.8em] uppercase text-white/50 mb-6">LOTE: {gift.hiddenName}</h3>
                          <div className="py-10 px-16 bg-white text-black">
                              <span className="block text-xl font-black uppercase tracking-widest mb-2">Packs Disponibles</span>
                              <span className="text-9xl font-black tracking-tighter leading-none">{gift.packs}</span>
                          </div>
                      </div>
                  )}
               </div>
          </div>
          {/* Lado Derecho: Listado (High Contrast) */}
          <div className="w-full lg:w-5/12 flex flex-col bg-black">
              <div className="p-8 bg-white text-black flex justify-between items-center border-b-[4px] border-black">
                  <span className="text-xl font-black uppercase tracking-widest">Estado de Sala</span>
                  {isBettingPhase && <div className="text-6xl font-black font-mono">{timeLeft}s</div>}
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                  {gift.isWinnerRevealed && gift.winners ? (
                      gift.winners.map((w, i) => (
                          <div key={i} className="p-8 bg-white text-black border-[4px] border-white flex justify-between items-center animate-in zoom-in">
                              <span className="text-4xl font-black uppercase truncate pr-4">{w}</span>
                              <Trophy size={40} />
                          </div>
                      ))
                  ) : (
                      gift.allocations.sort((a,b) => b.points - a.points).map((a, i) => (
                          <div key={i} className="p-6 border-[3px] border-white flex justify-between items-center">
                              <span className="text-2xl font-black uppercase truncate text-white">{a.userName}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-6xl font-black text-white">{a.points}</span>
                                <span className="text-sm font-bold text-white/50 uppercase vertical-rl">PTS</span>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
        </div>
      </div>
    );
  }

  // VISTA PARA PARTICIPANTES (SMARTPHONE)
  return (
    <div className="w-full h-full max-h-[100vh] flex flex-col overflow-hidden px-4 py-4">
      <div className="flex-1 bg-black border-[3px] border-white rounded-[20px] overflow-hidden flex flex-col shadow-none relative">
        <div className="h-[40%] bg-white text-black flex flex-col items-center justify-center p-6 text-center shrink-0 border-b-[3px] border-black">
           {gift.isContentRevealed ? (
             <div>
               <div className="text-7xl mb-2">{gift.emoji}</div>
               <h3 className="text-2xl font-black uppercase leading-tight">{gift.revealedName}</h3>
               <span className="text-[10px] font-black uppercase bg-black text-white px-3 py-1 mt-2 inline-block">
                 {gift.packs} PREMIOS
               </span>
             </div>
           ) : (
             <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-none border-[3px] border-black bg-white flex items-center justify-center mb-3">
                  {isBettingPhase ? <Beaker size={32} className="text-black animate-pulse" /> : <Lock size={32} className="text-black/30" />}
                </div>
                <h3 className="text-[10px] font-black tracking-widest mb-1 uppercase">LOTE {gift.hiddenName}</h3>
                <span className="text-4xl font-black">{gift.packs} PACKS</span>
             </div>
           )}
        </div>

        <div className="flex-1 p-4 flex flex-col items-center justify-center text-center overflow-hidden">
           {gift.isWinnerRevealed && gift.winners ? (
             <div className="w-full flex flex-col gap-3">
               <span className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Ganadores</span>
               {gift.winners.slice(0, 4).map((w, i) => (
                 <div key={i} className={`p-4 border-[2px] flex justify-between items-center ${w === currentUserName ? 'bg-white text-black font-black' : 'bg-black text-white border-white/30'}`}>
                    <span className="text-lg uppercase truncate pr-2">{w}</span>
                    <Trophy size={18} />
                 </div>
               ))}
             </div>
           ) : (
             <div className="flex flex-col items-center gap-4 w-full">
                <div className={`w-40 h-40 border-[4px] flex flex-col items-center justify-center transition-all ${userPointsAllocated > 0 ? 'bg-white text-black border-white' : 'bg-black text-white border-white/20'}`}>
                   <span className="text-[10px] font-black uppercase">Has Apostado</span>
                   <span className="text-7xl font-black leading-none">{userPointsAllocated}</span>
                </div>
                {!isBettingPhase && <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Esperando Inicio</span>}
             </div>
           )}
        </div>

        {!gift.isWinnerRevealed && (
          <div className="p-6 bg-black border-t-[3px] border-white shrink-0">
             <div className="flex justify-between items-center mb-6 px-6 py-4 border-[3px] border-white">
                <span className="text-[10px] font-black uppercase text-white/60">Tus Créditos</span>
                <span className={`text-4xl font-black ${remainingUserCredits > 0 ? 'text-white' : 'text-red-500 animate-pulse'}`}>
                    {remainingUserCredits}
                </span>
             </div>

             <div className="flex gap-4 h-20">
                <button 
                   onClick={(e) => { e.stopPropagation(); onAllocate(gift.id, -1); }}
                   disabled={userPointsAllocated <= 0 || !isBettingPhase}
                   className="w-20 border-[3px] border-white flex items-center justify-center text-white disabled:opacity-10"
                >
                   <Minus size={28} strokeWidth={4} />
                </button>
                <button 
                   onClick={(e) => { e.stopPropagation(); onAllocate(gift.id, 1); }}
                   disabled={!canAllocate || !isBettingPhase}
                   className={`flex-1 flex items-center justify-between px-8 border-[3px] border-white ${
                     isBettingPhase && canAllocate ? 'bg-white text-black' : 'bg-black text-white/10'
                   }`}
                >
                   <span className="text-lg font-black uppercase">Añadir</span>
                   <Plus size={24} strokeWidth={4} />
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
