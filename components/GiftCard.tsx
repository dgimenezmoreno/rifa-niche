
import React from 'react';
import { Gift, AppPhase } from '../types';
import { Lock, Trophy, Zap, FlaskConical, Beaker, Activity, Minus, Plus, Heart, Timer } from 'lucide-react';

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

  // VISTA PARA ADMINISTRADORES
  if (isAdmin) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 overflow-y-auto custom-scrollbar max-h-[calc(100vh-160px)]">
        <div 
          onClick={() => canAdminReveal && onAdminReveal && onAdminReveal(gift.id)}
          className={`relative flex flex-col lg:flex-row bg-[#18181b] border border-white/20 transition-all duration-500 h-auto lg:h-[720px] rounded-[40px] overflow-hidden shadow-2xl ${
            canAdminReveal ? 'cursor-pointer hover:border-white/40 ring-1 ring-white/10' : ''
          }`}
        >
          {/* Lado Izquierdo: Info Premio (Admin) */}
          <div className="w-full lg:w-7/12 relative flex items-center justify-center p-12 bg-gradient-to-br from-[#27272a] to-[#18181b] border-r border-white/10">
               <div className="relative z-10 flex flex-col items-center text-center">
                  {gift.isContentRevealed ? (
                      <div className="animate-in fade-in zoom-in duration-1000">
                          <div className="text-[140px] mb-8 filter drop-shadow-2xl">{gift.emoji}</div>
                          <h3 className="text-6xl font-black text-white mb-6 uppercase tracking-tighter leading-none">{gift.revealedName}</h3>
                          <div className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[12px]">
                              <FlaskConical size={18} /> {gift.packs} UNIDADES DISPONIBLES
                          </div>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center">
                          <div className="w-64 h-64 border-2 border-white/10 rounded-[56px] flex items-center justify-center bg-[#09090b] mb-12 shadow-2xl">
                             {isBettingPhase ? <Beaker size={56} className="text-white/20 animate-bounce" /> : <Lock size={64} className="text-white/5" />}
                          </div>
                          <div className="space-y-6">
                              <h3 className="text-xs font-black tracking-[0.6em] uppercase text-white/20">LOTE: {gift.hiddenName}</h3>
                              <div className="py-8 px-12 bg-white/5 border border-white/10 rounded-[40px]">
                                  <span className="block text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-3">Packs</span>
                                  <span className="text-8xl font-black text-white tracking-tighter">{gift.packs}</span>
                              </div>
                          </div>
                      </div>
                  )}
               </div>
          </div>
          {/* Lado Derecho: Monitor Admin (Listado) */}
          <div className="w-full lg:w-5/12 flex flex-col bg-[#09090b]">
              <div className="p-8 bg-[#18181b] border-b border-white/10 flex justify-between items-center">
                  <span className="text-[12px] font-black uppercase tracking-[0.4em] text-white/30">Monitor de Red</span>
                  {isBettingPhase && <div className="text-5xl font-mono font-black text-white">{timeLeft}s</div>}
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-5 custom-scrollbar">
                  {gift.isWinnerRevealed && gift.winners ? (
                      gift.winners.map((w, i) => (
                          <div key={i} className="p-7 bg-white text-black rounded-[30px] flex justify-between items-center shadow-lg transform transition-all hover:scale-[1.02]">
                              <span className="text-3xl font-black uppercase truncate pr-4">{w}</span>
                              <Trophy size={28} />
                          </div>
                      ))
                  ) : (
                      gift.allocations.sort((a,b) => b.points - a.points).map((a, i) => (
                          <div key={i} className="p-6 bg-[#18181b] border border-white/5 rounded-[30px] flex justify-between items-center group hover:border-white/20 transition-all">
                              <span className="text-xl font-bold uppercase truncate max-w-[220px] text-white/80">{a.userName}</span>
                              <div className="flex flex-col items-end">
                                <span className="text-6xl font-black font-mono text-white group-hover:text-glow transition-all duration-300">{a.points}</span>
                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Créditos</span>
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

  // VISTA PARA PARTICIPANTES (MÓVIL / 'ONE-SCREEN')
  return (
    <div className="w-full h-full max-h-[100vh] flex flex-col overflow-hidden px-4 py-4 md:px-8">
      <div className="flex-1 bg-[#18181b] border border-white/20 rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Parte Superior: Información del Premio (Visual) */}
        <div className="h-[40%] bg-gradient-to-b from-white/5 to-transparent flex flex-col items-center justify-center p-6 text-center shrink-0 border-b border-white/10">
           {gift.isContentRevealed ? (
             <div className="animate-in fade-in zoom-in duration-700">
               <div className="text-8xl md:text-9xl mb-3 filter drop-shadow-xl">{gift.emoji}</div>
               <h3 className="text-2xl md:text-3xl font-black uppercase text-white leading-tight px-2">{gift.revealedName}</h3>
               <div className="mt-3 inline-block px-4 py-1 bg-white/5 border border-white/10 rounded-full">
                  <span className="text-[10px] font-black text-white/40 tracking-widest uppercase">{gift.packs} PREMIOS EN JUEGO</span>
               </div>
             </div>
           ) : (
             <div className="flex flex-col items-center">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[30px] border-2 border-white/10 bg-[#09090b] flex items-center justify-center mb-4 relative shadow-inner">
                  {isBettingPhase ? (
                    <>
                      <div className="absolute inset-0 bg-white/5 animate-pulse rounded-[30px]"></div>
                      <Beaker size={40} className="text-white/20 relative z-10" />
                    </>
                  ) : (
                    <Lock size={32} className="text-white/10" />
                  )}
                </div>
                <h3 className="text-xs font-black tracking-[0.5em] text-white/20 uppercase mb-1">{gift.hiddenName}</h3>
                <div className="flex items-center gap-2">
                   <span className="text-4xl font-black text-white">{gift.packs}</span>
                   <span className="text-[10px] font-black text-white/40 uppercase">LOTES</span>
                </div>
             </div>
           )}
        </div>

        {/* Parte Central: Estado de Apuesta / Resultados */}
        <div className="flex-1 p-4 flex flex-col items-center justify-center text-center overflow-hidden">
           {gift.isWinnerRevealed && gift.winners ? (
             <div className="w-full animate-in slide-in-from-bottom duration-500 flex flex-col gap-3 max-h-full overflow-y-auto custom-scrollbar px-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Ganadores Seleccionados</span>
               {gift.winners.slice(0, 4).map((w, i) => (
                 <div key={i} className={`p-4 rounded-2xl flex justify-between items-center shadow-lg transition-all ${w === currentUserName ? 'bg-white text-black scale-105 z-10' : 'bg-[#09090b] text-white border border-white/10 opacity-60'}`}>
                    <span className="text-lg font-black uppercase truncate pr-2">{w}</span>
                    <Trophy size={18} className={w === currentUserName ? 'text-black' : 'text-white/20'} />
                 </div>
               ))}
               {gift.winners.length > 4 && (
                  <span className="text-[8px] font-bold text-white/20 uppercase">Protocolo Finalizado para este Lote</span>
               )}
             </div>
           ) : (
             <div className="flex flex-col items-center gap-4 w-full">
                <div className={`relative w-36 h-36 md:w-44 md:h-44 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-700 ${userPointsAllocated > 0 ? 'bg-white/10 border-white/50 shadow-[0_0_50px_rgba(255,255,255,0.1)]' : 'bg-white/5 border-white/5'}`}>
                   {userPointsAllocated > 0 && <Heart className="absolute top-6 text-white/20 animate-pulse" size={18} />}
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Has Apostado</span>
                   <span className="text-6xl md:text-7xl font-black text-white leading-none">{userPointsAllocated}</span>
                   <span className="text-[9px] font-bold text-white/30 uppercase mt-1">Créditos</span>
                </div>
                {!isBettingPhase && (
                  <div className="flex items-center gap-2 text-white/20 animate-in fade-in duration-1000">
                    <Timer size={12} />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em]">Espera del ROOT</span>
                  </div>
                )}
             </div>
           )}
        </div>

        {/* Parte Inferior: Controles de Apuesta (Fijos) */}
        {!gift.isWinnerRevealed && (
          <div className="p-6 bg-[#09090b] border-t border-white/20 shrink-0">
             {/* Indicador de créditos restantes MEJORADO */}
             <div className="flex justify-between items-center mb-6 px-6 py-4 bg-white/10 rounded-[24px] border-2 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)] ring-1 ring-white/5">
                <div className="flex flex-col items-start">
                   <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">Saldo Disponible</span>
                   <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Protocolo Activo</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-4xl font-black ${remainingUserCredits > 0 ? 'text-white' : 'text-red-500 animate-pulse'}`}>
                        {remainingUserCredits}
                    </span>
                    <Zap size={20} className={remainingUserCredits > 0 ? 'text-emerald-500 fill-emerald-500 animate-pulse' : 'text-red-500'} />
                </div>
             </div>

             <div className="flex gap-4 h-20 max-w-md mx-auto">
                <button 
                   onClick={(e) => { e.stopPropagation(); onAllocate(gift.id, -1); }}
                   disabled={userPointsAllocated <= 0 || !isBettingPhase}
                   className="w-20 rounded-3xl bg-[#27272a] border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all disabled:opacity-20 shadow-xl"
                >
                   <Minus size={28} strokeWidth={3} />
                </button>
                <button 
                   onClick={(e) => { e.stopPropagation(); onAllocate(gift.id, 1); }}
                   disabled={!canAllocate || !isBettingPhase}
                   className={`flex-1 rounded-3xl flex items-center justify-between px-8 active:scale-95 transition-all shadow-xl relative overflow-hidden group ${
                     isBettingPhase && canAllocate ? 'bg-white text-black' : 'bg-[#18181b] text-white/10 grayscale cursor-not-allowed'
                   }`}
                >
                   <div className="flex flex-col items-start relative z-10 text-left">
                      <span className="text-lg font-black uppercase">Añadir</span>
                      <span className="text-[9px] opacity-40 uppercase tracking-widest font-bold">1 Crédito</span>
                   </div>
                   <div className="relative z-10">
                      <Plus size={24} strokeWidth={3} />
                   </div>
                </button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};
