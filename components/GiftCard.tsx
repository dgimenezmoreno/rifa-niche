import React from 'react';
import { Gift, AppPhase } from '../types';
import { Lock, Trophy, Zap, FlaskConical, Beaker, Activity } from 'lucide-react';

interface GiftCardProps {
  gift: Gift;
  userPointsAllocated: number;
  phase: AppPhase;
  canAllocate: boolean;
  timeLeft: number;
  isAdmin: boolean;
  onAllocate: (giftId: string) => void;
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

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div 
        onClick={() => canAdminReveal && onAdminReveal && onAdminReveal(gift.id)}
        className={`relative flex flex-col lg:flex-row bg-[#18181b] border border-white/20 transition-all duration-500 min-h-[450px] md:min-h-[680px] rounded-[32px] md:rounded-[40px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] ${
          canAdminReveal ? 'cursor-pointer hover:border-white/40 group/card ring-1 ring-white/10' : ''
        }`}
      >
        <div className="w-full lg:w-7/12 relative overflow-hidden flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-[#27272a] to-[#18181b] border-b lg:border-b-0 lg:border-r border-white/10">
             <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]"></div>
             
             <div className="relative z-10 flex flex-col items-center text-center w-full">
                {gift.isContentRevealed ? (
                    <div className="animate-in fade-in zoom-in duration-1000 flex flex-col items-center">
                        <div className="relative mb-6 md:mb-14 animate-float">
                            <div className="absolute -inset-10 md:-inset-20 bg-white/20 blur-[60px] md:blur-[120px] opacity-20 rounded-full"></div>
                            <div className="text-[80px] md:text-[140px] filter drop-shadow-[0_0_50px_rgba(255,255,255,0.4)]">{gift.emoji}</div>
                        </div>
                        <h3 className="text-3xl md:text-6xl font-black text-white mb-3 md:mb-6 tracking-tighter uppercase leading-tight px-4">{gift.revealedName}</h3>
                        <div className="px-5 py-2 md:px-10 md:py-4 bg-white text-black rounded-xl md:rounded-3xl font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-[7px] md:text-[10px] shadow-2xl flex items-center gap-2 md:gap-3">
                            <FlaskConical size={12} fill="black" className="md:size-16" /> ACTIVO ESTABILIZADO: {gift.packs} UNIDADES
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center animate-in fade-in duration-700 w-full">
                        <div className="mb-6 md:mb-14 relative">
                             <div className="absolute -inset-6 md:-inset-10 bg-white/10 blur-[40px] md:blur-[60px] animate-pulse rounded-full"></div>
                             <div className={`w-36 h-36 md:w-64 md:h-64 border-2 border-white/10 rounded-[32px] md:rounded-[56px] flex items-center justify-center bg-[#09090b] shadow-2xl relative overflow-hidden`}>
                                {isBettingPhase ? (
                                    <div className="flex flex-col items-center text-center px-4 md:px-6">
                                        <div className="absolute inset-0 bg-white/[0.03] animate-[pulse_1.5s_infinite]"></div>
                                        <Beaker size={28} className="text-white/20 mb-3 md:mb-4 animate-bounce md:size-48" />
                                        <span className="text-[8px] md:text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] md:tracking-[0.3em] relative z-10">Sintetizando...</span>
                                    </div>
                                ) : (
                                    <Lock size={36} className="text-white/5 md:size-64" />
                                )}
                             </div>
                        </div>
                        <div className="space-y-3 md:space-y-6 text-center w-full max-w-sm mx-auto">
                            <h3 className="text-[9px] md:text-[12px] font-black tracking-[0.3em] md:tracking-[0.6em] uppercase text-white/20 px-2 truncate">IDENTIFICADOR: {gift.hiddenName}</h3>
                            <div className="relative py-5 md:py-8 px-8 md:px-10 bg-gradient-to-b from-white/10 to-transparent border-t border-white/20 rounded-[28px] md:rounded-[40px] shadow-2xl">
                                <span className="block text-[8px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/40 mb-2 md:mb-3">Rendimiento de Lote</span>
                                <div className="flex items-center justify-center gap-3 md:gap-6">
                                    <span className="text-5xl md:text-8xl font-black text-white leading-none tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">{gift.packs}</span>
                                    <div className="text-left flex flex-col">
                                        <span className="text-base md:text-xl font-black text-white uppercase tracking-tight leading-none">Ganadores</span>
                                        <span className="text-[7px] md:text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] md:tracking-[0.2em] mt-1">Disponibles</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
             </div>
        </div>

        <div className="w-full lg:w-5/12 flex flex-col bg-[#09090b]">
            <div className="p-5 md:p-10 bg-[#18181b] border-b border-white/10 flex justify-between items-center shadow-lg shrink-0">
                <div>
                     <span className="block text-[7px] md:text-[9px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/30 mb-1 tracking-widest">Protocolo de Red</span>
                     <div className="flex items-center gap-2 md:gap-3">
                        <div className={`h-1.5 w-1.5 md:h-2.5 md:w-2.5 rounded-full ${isBettingPhase ? 'bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-white/10'}`}></div>
                        <span className={`text-[8px] md:text-[11px] font-black tracking-widest uppercase ${isBettingPhase ? 'text-white' : 'text-white/20'}`}>
                            {isBettingPhase ? "TRANSMISIÓN ACTIVA" : "NODO EN STANDBY"}
                        </span>
                     </div>
                </div>
                {isBettingPhase && (
                    <div className="bg-[#09090b] px-4 py-1.5 md:px-7 md:py-3 rounded-lg md:rounded-2xl border border-white/20 shadow-inner">
                         <div className="text-xl md:text-4xl font-mono font-black tracking-tighter text-white tabular-nums">{timeLeft.toString().padStart(2, '0')}</div>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col overflow-hidden min-h-[250px] md:min-h-[300px]">
                {gift.isWinnerRevealed && gift.winners ? (
                    <div className="flex-1 flex flex-col p-6 md:p-10 animate-in slide-in-from-bottom duration-700 bg-gradient-to-t from-[#18181b]/20 to-transparent overflow-hidden">
                        <div className="flex items-center gap-2 md:gap-3 mb-5 md:mb-10 shrink-0">
                            {/* FIX: Removed invalid 'md:size' prop and moved responsive sizing to className using Tailwind classes */}
                            <Trophy className="text-amber-400 md:size-[18px]" size={16} />
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/50 italic">Sujetos Seleccionados:</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2 md:space-y-4">
                            {gift.winners.map((winner, i) => (
                                <div key={i} className={`p-4 md:p-6 rounded-xl md:rounded-[24px] border-2 ${winner === currentUserName ? 'bg-white text-black border-white shadow-2xl scale-[1.01] md:scale-[1.03]' : 'bg-[#18181b] border-white/5 hover:border-white/20'} transition-all`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-base md:text-2xl font-black tracking-tight uppercase truncate mr-2">{winner}</span>
                                        <span className={`text-[8px] md:text-[10px] font-mono font-bold shrink-0 ${winner === currentUserName ? 'text-black/40' : 'text-white/20'}`}>ID_{(1000 + i)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 py-3 md:px-10 md:py-6 flex justify-between items-center border-b border-white/5 bg-white/[0.02] shrink-0">
                            <span className="text-[8px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/40 flex items-center gap-2">
                                {/* FIX: Removed invalid 'md:size' prop and moved responsive sizing to className using Tailwind classes */}
                                <Activity size={12} className="md:size-[14px]" /> Puja de Formulación ({gift.totalPoints})
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-4 md:px-8 md:py-6 space-y-2 md:space-y-3 custom-scrollbar">
                            {gift.allocations.length > 0 ? (
                                gift.allocations.sort((a,b) => b.points - a.points).map((alloc, idx) => (
                                    <div key={idx} className={`flex justify-between items-center py-2.5 px-4 md:py-4 md:px-6 rounded-xl md:rounded-[20px] border-2 transition-all ${alloc.isCurrentUser ? 'bg-white text-black border-white shadow-2xl scale-[1.01] md:scale-[1.02] z-10' : 'bg-[#18181b] border-white/5 hover:border-white/20'}`}>
                                        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                            <span className={`text-[7px] md:text-[10px] font-mono font-bold shrink-0 ${alloc.isCurrentUser ? 'text-black/40' : 'text-white/10'}`}>REF_{(idx+1).toString().padStart(2, '0')}</span>
                                            <span className="text-[10px] md:text-sm font-black uppercase tracking-wider truncate">{alloc.userName}</span>
                                        </div>
                                        <div className={`px-2 py-1 md:px-4 md:py-1.5 rounded-full text-[7px] md:text-[10px] font-mono font-bold shrink-0 ${alloc.isCurrentUser ? 'bg-black/10' : 'bg-[#27272a] text-white/50 border border-white/5'}`}>{alloc.points} CRÉDITOS</div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-10 gap-3 md:gap-6">
                                    {/* FIX: Removed invalid 'md:size' prop and moved responsive sizing to className using Tailwind classes */}
                                    <FlaskConical size={32} className="md:size-16" strokeWidth={1} />
                                    <p className="text-[8px] md:text-[11px] font-bold uppercase tracking-[0.3em] md:tracking-[0.5em] text-center max-w-[120px] md:max-w-[150px]">Terminal a la espera de instrucciones</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-5 md:p-10 bg-[#18181b] border-t border-white/20 shrink-0">
                {!isAdmin && !gift.isWinnerRevealed ? (
                    <button
                        onClick={() => onAllocate(gift.id)}
                        disabled={!canAllocate || !isBettingPhase}
                        className={`w-full h-14 md:h-20 rounded-xl md:rounded-3xl flex items-center justify-between px-6 md:px-10 transition-all group overflow-hidden relative border-2 ${
                            canAllocate && isBettingPhase 
                            ? 'bg-white text-black border-white hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:-translate-y-1' 
                            : 'bg-[#27272a] text-white/10 border-white/5 grayscale cursor-not-allowed opacity-50'
                        }`}
                    >
                        <div className="flex flex-col items-start relative z-10 text-left">
                          <span className="font-black uppercase tracking-[0.1em] md:tracking-[0.25em] text-[9px] md:text-[11px]">Inyectar Crédito Lab</span>
                          <span className="text-[7px] md:text-[9px] font-bold opacity-40 uppercase tracking-widest mt-0.5 md:mt-1">Coste: 1 activo</span>
                        </div>
                        <Zap size={16} className={`relative z-10 md:size-22 transition-transform ${isBettingPhase ? 'group-hover:scale-125 group-hover:rotate-12 fill-current' : ''}`} />
                    </button>
                ) : (
                    <div className="flex flex-col items-center justify-center py-2 md:py-4 opacity-20">
                         <div className="flex items-center gap-2 md:gap-3 mb-1">
                            <div className="h-[1px] w-6 md:w-10 bg-white"></div>
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em]">Lote Estabilizado</span>
                            <div className="h-[1px] w-6 md:w-10 bg-white"></div>
                         </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};