
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
}) => {
  const isRevealPhase = phase === AppPhase.ROUND_REVEAL || phase === AppPhase.ROUND_LOCKED;
  const isBettingPhase = phase === AppPhase.ROUND_ACTIVE;

  const canAdminReveal = isAdmin && isRevealPhase && (!gift.isContentRevealed || !gift.isWinnerRevealed);

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div 
        onClick={() => canAdminReveal && onAdminReveal && onAdminReveal(gift.id)}
        className={`relative flex flex-col lg:flex-row bg-[#18181b] border border-white/20 transition-all duration-500 min-h-[680px] rounded-[40px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] ${
          canAdminReveal ? 'cursor-pointer hover:border-white/40 group/card ring-1 ring-white/10' : ''
        }`}
      >
        <div className="w-full lg:w-7/12 relative overflow-hidden flex items-center justify-center p-12 bg-gradient-to-br from-[#27272a] to-[#18181b] border-b lg:border-b-0 lg:border-r border-white/10">
             <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]"></div>
             
             <div className="relative z-10 flex flex-col items-center text-center w-full">
                {gift.isContentRevealed ? (
                    <div className="animate-in fade-in zoom-in duration-1000 flex flex-col items-center">
                        <div className="relative mb-14 animate-float">
                            <div className="absolute -inset-20 bg-white/20 blur-[120px] opacity-20 rounded-full"></div>
                            <div className="text-[140px] filter drop-shadow-[0_0_50px_rgba(255,255,255,0.4)]">{gift.emoji}</div>
                        </div>
                        <h3 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter uppercase leading-tight">{gift.revealedName}</h3>
                        <div className="px-10 py-4 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl flex items-center gap-3">
                            <FlaskConical size={16} fill="black" /> ACTIVO ESTABILIZADO: {gift.packs} UNIDADES
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center animate-in fade-in duration-700 w-full">
                        <div className="mb-14 relative">
                             <div className="absolute -inset-10 bg-white/10 blur-[60px] animate-pulse rounded-full"></div>
                             <div className={`w-64 h-64 border-2 border-white/10 rounded-[56px] flex items-center justify-center bg-[#09090b] shadow-2xl relative overflow-hidden`}>
                                {isBettingPhase ? (
                                    <div className="flex flex-col items-center text-center px-6">
                                        <div className="absolute inset-0 bg-white/[0.03] animate-[pulse_1.5s_infinite]"></div>
                                        <Beaker size={48} className="text-white/20 mb-4 animate-bounce" />
                                        <span className="text-[11px] font-bold text-white/40 uppercase tracking-[0.3em] relative z-10">Sintetizando...</span>
                                    </div>
                                ) : (
                                    <Lock size={64} className="text-white/5" />
                                )}
                             </div>
                        </div>
                        <div className="space-y-6 text-center w-full max-w-sm mx-auto">
                            <h3 className="text-[12px] font-black tracking-[0.6em] uppercase text-white/20">IDENTIFICADOR: {gift.hiddenName}</h3>
                            <div className="relative py-8 px-10 bg-gradient-to-b from-white/10 to-transparent border-t border-white/20 rounded-[40px] shadow-2xl">
                                <span className="block text-[11px] font-black uppercase tracking-[0.4em] text-white/40 mb-3">Rendimiento de Lote</span>
                                <div className="flex items-center justify-center gap-6">
                                    <span className="text-8xl font-black text-white leading-none tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">{gift.packs}</span>
                                    <div className="text-left flex flex-col">
                                        <span className="text-xl font-black text-white uppercase tracking-tight leading-none">Ganadores</span>
                                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">Disponibles</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
             </div>
        </div>

        <div className="w-full lg:w-5/12 flex flex-col bg-[#09090b]">
            <div className="p-10 bg-[#18181b] border-b border-white/10 flex justify-between items-center shadow-lg shrink-0">
                <div>
                     <span className="block text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mb-2 tracking-widest">Protocolo de Red</span>
                     <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${isBettingPhase ? 'bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-white/10'}`}></div>
                        <span className={`text-[11px] font-black tracking-widest uppercase ${isBettingPhase ? 'text-white' : 'text-white/20'}`}>
                            {isBettingPhase ? "TRANSMISIÓN ACTIVA" : "NODO EN STANDBY"}
                        </span>
                     </div>
                </div>
                {isBettingPhase && (
                    <div className="bg-[#09090b] px-7 py-3 rounded-2xl border border-white/20 shadow-inner">
                         <div className="text-4xl font-mono font-black tracking-tighter text-white tabular-nums">{timeLeft.toString().padStart(2, '0')}</div>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {gift.isWinnerRevealed && gift.winners ? (
                    <div className="flex-1 flex flex-col p-10 animate-in slide-in-from-bottom duration-700 bg-gradient-to-t from-[#18181b]/20 to-transparent overflow-hidden">
                        <div className="flex items-center gap-3 mb-10 shrink-0">
                            <Trophy className="text-amber-400" size={20} />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 italic">Sujetos Seleccionados:</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                            {gift.winners.map((winner, i) => (
                                <div key={i} className={`p-6 rounded-[24px] border-2 ${winner === "You" ? 'bg-white text-black border-white shadow-2xl scale-[1.03]' : 'bg-[#18181b] border-white/5 hover:border-white/20'} transition-all`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-2xl font-black tracking-tight uppercase">{winner}</span>
                                        <span className={`text-[10px] font-mono font-bold ${winner === "You" ? 'text-black/40' : 'text-white/20'}`}>ID_{(1000 + i)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-10 py-6 flex justify-between items-center border-b border-white/5 bg-white/[0.02] shrink-0">
                            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 flex items-center gap-2">
                                <Activity size={16} /> Puja de Formulación ({gift.totalPoints})
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-3 custom-scrollbar">
                            {gift.allocations.length > 0 ? (
                                gift.allocations.sort((a,b) => b.points - a.points).map((alloc, idx) => (
                                    <div key={idx} className={`flex justify-between items-center py-4 px-6 rounded-[20px] border-2 transition-all ${alloc.isCurrentUser ? 'bg-white text-black border-white shadow-2xl scale-[1.02] z-10' : 'bg-[#18181b] border-white/5 hover:border-white/20'}`}>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-[10px] font-mono font-bold ${alloc.isCurrentUser ? 'text-black/40' : 'text-white/10'}`}>REF_{(idx+1).toString().padStart(2, '0')}</span>
                                            <span className="text-sm font-black uppercase tracking-wider">{alloc.userName}</span>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-bold ${alloc.isCurrentUser ? 'bg-black/10' : 'bg-[#27272a] text-white/50 border border-white/5'}`}>{alloc.points} CRÉDITOS</div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-10 gap-6">
                                    <FlaskConical size={64} strokeWidth={1} />
                                    <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-center max-w-[150px]">Terminal a la espera de instrucciones</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-10 bg-[#18181b] border-t border-white/20 shrink-0">
                {!isAdmin && !gift.isWinnerRevealed ? (
                    <button
                        onClick={() => onAllocate(gift.id)}
                        disabled={!canAllocate || !isBettingPhase}
                        className={`w-full h-20 rounded-3xl flex items-center justify-between px-10 transition-all group overflow-hidden relative border-2 ${
                            canAllocate && isBettingPhase 
                            ? 'bg-white text-black border-white hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:-translate-y-1' 
                            : 'bg-[#27272a] text-white/10 border-white/5 grayscale cursor-not-allowed opacity-50'
                        }`}
                    >
                        <div className="flex flex-col items-start relative z-10 text-left">
                          <span className="font-black uppercase tracking-[0.25em] text-[11px]">Inyectar Crédito Lab</span>
                          <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest mt-1">Coste: 1 activo de formulación</span>
                        </div>
                        <Zap size={22} className={`relative z-10 transition-transform ${isBettingPhase ? 'group-hover:scale-125 group-hover:rotate-12 fill-current' : ''}`} />
                    </button>
                ) : (
                    <div className="flex flex-col items-center justify-center py-4 opacity-20">
                         <div className="flex items-center gap-3 mb-2">
                            <div className="h-[1px] w-10 bg-white"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Lote Estabilizado</span>
                            <div className="h-[1px] w-10 bg-white"></div>
                         </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
