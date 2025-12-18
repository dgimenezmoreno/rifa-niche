
import React from 'react';
import { Gift, AppPhase } from '../types';
// Added Timer to the lucide-react imports
import { Lock, Trophy, Zap, FlaskConical, Beaker, Activity, Minus, Plus, Heart, Timer } from 'lucide-react';

interface GiftCardProps {
  gift: Gift;
  userPointsAllocated: number;
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
                          <div className="text-[120px] mb-8 filter drop-shadow-2xl">{gift.emoji}</div>
                          <h3 className="text-5xl font-black text-white mb-6 uppercase tracking-tighter leading-none">{gift.revealedName}</h3>
                          <div className="inline-flex items-center gap-3 px-8 py-3 bg-white text-black rounded-2xl font-black uppercase text-[10px]">
                              <FlaskConical size={14} /> {gift.packs} UNIDADES DISPONIBLES
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
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Monitor de Red</span>
                  {isBettingPhase && <div className="text-3xl font-mono font-black text-white">{timeLeft}s</div>}
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                  {gift.isWinnerRevealed && gift.winners ? (
                      gift.winners.map((w, i) => (
                          <div key={i} className="p-5 bg-white text-black rounded-2xl flex justify-between items-center shadow-lg">
                              <span className="text-xl font-black uppercase truncate">{w}</span>
                              <Trophy size={20} />
                          </div>
                      ))
                  ) : (
                      gift.allocations.sort((a,b) => b.points - a.points).map((a, i) => (
                          <div key={i} className="p-4 bg-[#18181b] border border-white/5 rounded-xl flex justify-between items-center">
                              <span className="text-sm font-bold uppercase truncate max-w-[200px]">{a.userName}</span>
                              <span className="text-xs font-mono font-bold text-white/40">{a.points} CR.</span>
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
        <div className="h-[45%] bg-gradient-to-b from-white/5 to-transparent flex flex-col items-center justify-center p-6 text-center shrink-0 border-b border-white/10">
           {gift.isContentRevealed ? (
             <div className="animate-in fade-in zoom-in duration-700">
               <div className="text-8xl md:text-9xl mb-4 filter drop-shadow-xl">{gift.emoji}</div>
               <h3 className="text-3xl md:text-4xl font-black uppercase text-white leading-tight px-2">{gift.revealedName}</h3>
               <div className="mt-3 inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                  <span className="text-[10px] font-black text-white/40 tracking-widest uppercase">{gift.packs} PREMIOS EN JUEGO</span>
               </div>
             </div>
           ) : (
             <div className="flex flex-col items-center">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-[35px] border-2 border-white/10 bg-[#09090b] flex items-center justify-center mb-5 relative shadow-inner">
                  {isBettingPhase ? (
                    <>
                      <div className="absolute inset-0 bg-white/5 animate-pulse rounded-[35px]"></div>
                      <Beaker size={48} className="text-white/20 relative z-10" />
                    </>
                  ) : (
                    <Lock size={40} className="text-white/10" />
                  )}
                </div>
                <h3 className="text-xs font-black tracking-[0.5em] text-white/20 uppercase mb-2">{gift.hiddenName}</h3>
                <div className="flex items-center gap-2">
                   <span className="text-4xl font-black text-white">{gift.packs}</span>
                   <span className="text-[10px] font-black text-white/40 uppercase">LOTES</span>
                </div>
             </div>
           )}
        </div>

        {/* Parte Central: Estado de Apuesta / Resultados */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center overflow-hidden">
           {gift.isWinnerRevealed && gift.winners ? (
             <div className="w-full animate-in slide-in-from-bottom duration-500 flex flex-col gap-3">
               <span className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Resultados del Protocolo</span>
               {gift.winners.slice(0, 3).map((w, i) => (
                 <div key={i} className={`p-5 rounded-2xl flex justify-between items-center shadow-lg transition-all ${w === currentUserName ? 'bg-white text-black scale-105' : 'bg-[#09090b] text-white border border-white/10 opacity-60'}`}>
                    <span className="text-xl font-black uppercase truncate pr-4">{w}</span>
                    <Trophy size={20} className={w === currentUserName ? 'text-black' : 'text-white/20'} />
                 </div>
               ))}
               {gift.winners.length > 3 && (
                  <span className="text-[9px] font-bold text-white/20 uppercase">Y {gift.winners.length - 3} más...</span>
               )}
             </div>
           ) : (
             <div className="flex flex-col items-center gap-4 w-full">
                <div className={`relative w-40 h-40 md:w-48 md:h-48 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-700 ${userPointsAllocated > 0 ? 'bg-white/10 border-white/50 shadow-[0_0_50px_rgba(255,255,255,0.1)]' : 'bg-white/5 border-white/5'}`}>
                   {userPointsAllocated > 0 && <Heart className="absolute top-8 text-white/20 animate-pulse" size={20} />}
                   <span className="text-[11px] font-black uppercase tracking-widest text-white/20">Mis Créditos</span>
                   <span className="text-7xl md:text-8xl font-black text-white leading-none">{userPointsAllocated}</span>
                </div>
                {!isBettingPhase && (
                  <div className="flex items-center gap-2 text-white/20 animate-in fade-in duration-1000">
                    <Timer size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Protocolo Cerrado</span>
                  </div>
                )}
             </div>
           )}
        </div>

        {/* Parte Inferior: Controles de Apuesta (Fijos) */}
        {!gift.isWinnerRevealed && (
          <div className="p-6 md:p-10 bg-[#09090b] border-t border-white/20 shrink-0">
             <div className="flex gap-4 h-24 max-w-md mx-auto">
                <button 
                   onClick={(e) => { e.stopPropagation(); onAllocate(gift.id, -1); }}
                   disabled={userPointsAllocated <= 0 || !isBettingPhase}
                   className="w-24 rounded-3xl bg-[#27272a] border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all disabled:opacity-20 shadow-xl"
                >
                   <Minus size={32} strokeWidth={3} />
                </button>
                <button 
                   onClick={(e) => { e.stopPropagation(); onAllocate(gift.id, 1); }}
                   disabled={!canAllocate || !isBettingPhase}
                   className={`flex-1 rounded-3xl flex items-center justify-between px-10 active:scale-95 transition-all shadow-xl relative overflow-hidden group ${
                     isBettingPhase ? 'bg-white text-black' : 'bg-[#18181b] text-white/10 grayscale cursor-not-allowed'
                   }`}
                >
                   <div className="flex flex-col items-start relative z-10">
                      <span className="text-lg font-black uppercase">Añadir</span>
                      <span className="text-[10px] opacity-40 uppercase tracking-widest font-bold">Inyectar CR.</span>
                   </div>
                   <div className="relative z-10">
                      <Plus size={28} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                   </div>
                   {isBettingPhase && (
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                   )}
                </button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};
