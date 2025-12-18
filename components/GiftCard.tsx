
import React from 'react';
import { Gift, AppPhase } from '../types';
import { Lock, Trophy, Zap, FlaskConical, Beaker, Activity, Minus, Plus, Heart } from 'lucide-react';

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

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div 
        onClick={() => canAdminReveal && onAdminReveal && onAdminReveal(gift.id)}
        className={`relative flex flex-col lg:flex-row bg-[#18181b] border border-white/20 transition-all duration-500 h-auto lg:h-[720px] rounded-[32px] md:rounded-[40px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] ${
          canAdminReveal ? 'cursor-pointer hover:border-white/40 group/card ring-1 ring-white/10' : ''
        }`}
      >
        {/* LADO IZQUIERDO: ESTADO DEL REGALO */}
        <div className="w-full lg:w-7/12 relative overflow-hidden flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-[#27272a] to-[#18181b] border-b lg:border-b-0 lg:border-r border-white/10 min-h-[350px] md:min-h-0">
             <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]"></div>
             
             <div className="relative z-10 flex flex-col items-center text-center w-full px-4">
                {gift.isContentRevealed ? (
                    <div className="animate-in fade-in zoom-in duration-1000 flex flex-col items-center">
                        <div className="relative mb-6 md:mb-14 animate-float">
                            <div className="absolute -inset-10 md:-inset-20 bg-white/20 blur-[60px] md:blur-[120px] opacity-20 rounded-full"></div>
                            <div className="text-[100px] md:text-[140px] filter drop-shadow-[0_0_50px_rgba(255,255,255,0.4)]">{gift.emoji}</div>
                        </div>
                        <h3 className="text-3xl md:text-6xl font-black text-white mb-3 md:mb-6 tracking-tighter uppercase leading-tight">{gift.revealedName}</h3>
                        <div className="px-5 py-2 md:px-10 md:py-4 bg-white text-black rounded-xl md:rounded-3xl font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-[10px] shadow-2xl flex items-center gap-2 md:gap-3">
                            <FlaskConical size={14} fill="black" /> ACTIVO ESTABILIZADO: {gift.packs} UNIDADES
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center animate-in fade-in duration-700 w-full">
                        <div className="mb-6 md:mb-14 relative">
                             <div className="absolute -inset-6 md:-inset-10 bg-white/10 blur-[40px] md:blur-[60px] animate-pulse rounded-full"></div>
                             <div className={`w-44 h-44 md:w-64 md:h-64 border-2 border-white/10 rounded-[40px] md:rounded-[56px] flex items-center justify-center bg-[#09090b] shadow-2xl relative overflow-hidden`}>
                                {isBettingPhase ? (
                                    <div className="flex flex-col items-center text-center px-4 md:px-6">
                                        <div className="absolute inset-0 bg-white/[0.03] animate-[pulse_1.5s_infinite]"></div>
                                        <Beaker size={56} className="text-white/20 mb-3 md:mb-4 animate-bounce" />
                                        <span className="text-[10px] md:text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] md:tracking-[0.3em] relative z-10">Sintetizando...</span>
                                    </div>
                                ) : (
                                    <Lock size={64} className="text-white/5" />
                                )}
                             </div>
                        </div>
                        <div className="space-y-3 md:space-y-6 text-center w-full max-w-sm mx-auto">
                            <h3 className="text-[10px] md:text-[12px] font-black tracking-[0.3em] md:tracking-[0.6em] uppercase text-white/20 px-2 truncate">IDENTIFICADOR: {gift.hiddenName}</h3>
                            <div className="relative py-6 md:py-8 px-8 md:px-10 bg-gradient-to-b from-white/10 to-transparent border-t border-white/20 rounded-[28px] md:rounded-[40px] shadow-2xl">
                                <span className="block text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/40 mb-2 md:mb-3">Rendimiento de Lote</span>
                                <div className="flex items-center justify-center gap-3 md:gap-6">
                                    <span className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">{gift.packs}</span>
                                    <div className="text-left flex flex-col">
                                        <span className="text-lg md:text-xl font-black text-white uppercase tracking-tight leading-none">Ganadores</span>
                                        <span className="text-[8px] md:text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] md:tracking-[0.2em] mt-1">Disponibles</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
             </div>
        </div>

        {/* LADO DERECHO: PARTICIPANTES Y VOTO (OPTIMIZADO PARA PARTICIPANTES) */}
        <div className="w-full lg:w-5/12 flex flex-col bg-[#09090b] overflow-hidden">
            {/* Header del Nodo */}
            <div className="p-6 md:p-8 bg-[#18181b] border-b border-white/10 flex justify-between items-center shadow-lg shrink-0">
                <div>
                     <span className="block text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/30 mb-1 tracking-widest">Protocolo de Red</span>
                     <div className="flex items-center gap-2 md:gap-3">
                        <div className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${isBettingPhase ? 'bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-white/10'}`}></div>
                        <span className={`text-[10px] md:text-[11px] font-black tracking-widest uppercase ${isBettingPhase ? 'text-white' : 'text-white/20'}`}>
                            {isBettingPhase ? "TRANSMISIÓN ACTIVA" : "NODO EN STANDBY"}
                        </span>
                     </div>
                </div>
                {isBettingPhase && (
                    <div className="bg-[#09090b] px-5 py-2 md:px-7 md:py-3 rounded-xl md:rounded-2xl border border-white/20 shadow-inner">
                         <div className="text-2xl md:text-3xl font-mono font-black tracking-tighter text-white tabular-nums">{timeLeft.toString().padStart(2, '0')}</div>
                    </div>
                )}
            </div>

            {/* CONTENIDO CENTRAL */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-[300px] md:min-h-0">
                {gift.isWinnerRevealed && gift.winners ? (
                    <div className="flex-1 flex flex-col p-6 md:p-10 animate-in slide-in-from-bottom duration-700 bg-gradient-to-t from-[#18181b]/20 to-transparent overflow-hidden">
                        <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-10 shrink-0">
                            <Trophy className="text-amber-400" size={20} />
                            <span className="text-[11px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/50 italic">Sujetos Seleccionados:</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4 md:space-y-4">
                            {gift.winners.map((winner, i) => (
                                <div key={i} className={`p-5 md:p-6 rounded-2xl md:rounded-[24px] border-2 ${winner === currentUserName ? 'bg-white text-black border-white shadow-[0_0_40px_rgba(255,255,255,0.4)] scale-[1.02] md:scale-[1.03]' : 'bg-[#18181b] border-white/5 hover:border-white/20'} transition-all`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className={`text-[9px] font-black uppercase tracking-widest mb-1 ${winner === currentUserName ? 'text-black/40' : 'text-white/20'}`}>{winner === currentUserName ? '¡ERES TÚ!' : 'GANADOR'}</span>
                                            <span className="text-xl md:text-2xl font-black tracking-tight uppercase truncate max-w-[180px] md:max-w-none">{winner}</span>
                                        </div>
                                        <Trophy size={winner === currentUserName ? 28 : 18} className={winner === currentUserName ? 'text-black' : 'text-white/10'} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {isAdmin ? (
                            <React.Fragment>
                                <div className="px-6 py-4 md:px-10 md:py-6 flex justify-between items-center border-b border-white/5 bg-white/[0.02] shrink-0">
                                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/40 flex items-center gap-2">
                                        <Activity size={14} /> Puja de Formulación ({gift.totalPoints})
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto px-6 py-4 md:px-8 md:py-6 space-y-3 md:space-y-3 custom-scrollbar">
                                    {gift.allocations.length > 0 ? (
                                        gift.allocations.sort((a,b) => b.points - a.points).map((alloc, idx) => (
                                            <div key={idx} className={`flex justify-between items-center py-3.5 px-5 md:py-4 md:px-6 rounded-xl md:rounded-[20px] border-2 transition-all ${alloc.isCurrentUser ? 'bg-white text-black border-white shadow-2xl scale-[1.01] md:scale-[1.02] z-10' : 'bg-[#18181b] border-white/5 hover:border-white/20'}`}>
                                                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                                    <span className={`text-[8px] md:text-[10px] font-mono font-bold shrink-0 ${alloc.isCurrentUser ? 'text-black/40' : 'text-white/10'}`}>REF_{(idx+1).toString().padStart(2, '0')}</span>
                                                    <span className="text-sm md:text-sm font-black uppercase tracking-wider truncate">{alloc.userName}</span>
                                                </div>
                                                <div className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-mono font-bold shrink-0 ${alloc.isCurrentUser ? 'bg-black/10' : 'bg-[#27272a] text-white/50 border border-white/5'}`}>{alloc.points} CRÉDITOS</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4 md:gap-6">
                                            <FlaskConical size={64} strokeWidth={1} />
                                            <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] md:tracking-[0.5em] text-center max-w-[150px]">Terminal a la espera de instrucciones</p>
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 md:p-12 text-center">
                                <div className="mb-10 relative">
                                    <div className="absolute -inset-10 bg-white/5 blur-3xl animate-pulse"></div>
                                    <div className={`w-40 h-40 md:w-48 md:h-48 rounded-full border-2 border-white/10 flex flex-col items-center justify-center bg-white/5 relative overflow-hidden transition-all duration-700 ${userPointsAllocated > 0 ? 'border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.1)]' : ''}`}>
                                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Tu Stake</span>
                                        <span className="text-6xl md:text-7xl font-black text-white leading-none">{userPointsAllocated}</span>
                                        {userPointsAllocated > 0 && <Heart className="absolute bottom-6 text-white/10 animate-pulse" size={24} />}
                                    </div>
                                </div>
                                <div className="space-y-4 max-w-[280px]">
                                    <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-white">Panel de Usuario</h4>
                                    <p className="text-[11px] font-bold text-white/30 uppercase leading-relaxed tracking-widest">
                                        Inyecta créditos en este activo para aumentar tus probabilidades de éxito en el sorteo.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* PIE ESTÁTICO: SECCIÓN DE VOTO (CENTRO DE CONTROL PARA MÓVIL) */}
            <div className="p-6 md:p-8 bg-[#18181b] border-t border-white/20 shrink-0">
                {!isAdmin && !gift.isWinnerRevealed ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-end px-2">
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Activos Inyectados</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl md:text-4xl font-black text-white">{userPointsAllocated}</span>
                                    <span className="text-[11px] font-black text-white/20 uppercase tracking-widest">Unidades</span>
                                </div>
                             </div>
                             <div className="text-right flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Estado de Red</span>
                                <span className={`text-[11px] font-mono font-black uppercase tracking-widest ${canAllocate ? 'text-emerald-500' : 'text-red-500/50'}`}>
                                    {canAllocate ? 'ONLINE' : 'DEPLETED'}
                                </span>
                             </div>
                        </div>

                        <div className="flex gap-4 h-20 md:h-24">
                            {/* BOTÓN RESTAR */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onAllocate(gift.id, -1); }}
                                disabled={userPointsAllocated <= 0 || !isBettingPhase}
                                className={`w-24 md:w-28 rounded-2xl md:rounded-3xl flex items-center justify-center transition-all border-2 ${
                                    userPointsAllocated > 0 && isBettingPhase 
                                    ? 'bg-[#27272a] text-white border-white/10 hover:border-white/30 active:scale-95' 
                                    : 'bg-[#18181b] text-white/5 border-white/5 cursor-not-allowed opacity-20'
                                }`}
                            >
                                <Minus size={28} strokeWidth={3} />
                            </button>

                            {/* BOTÓN SUMAR (PRINCIPAL) */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onAllocate(gift.id, 1); }}
                                disabled={!canAllocate || !isBettingPhase}
                                className={`flex-1 rounded-2xl md:rounded-3xl flex items-center justify-between px-8 md:px-10 transition-all group overflow-hidden relative border-2 ${
                                    canAllocate && isBettingPhase 
                                    ? 'bg-white text-black border-white hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] active:scale-95' 
                                    : 'bg-[#27272a] text-white/10 border-white/5 grayscale cursor-not-allowed opacity-50'
                                }`}
                            >
                                <div className="flex flex-col items-start relative z-10 text-left">
                                  <span className="font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-[13px] md:text-[14px]">Añadir Crédito</span>
                                  <span className="text-[9px] font-bold opacity-40 uppercase tracking-[0.2em] mt-0.5">Push Token</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Plus size={24} strokeWidth={3} className="relative z-10" />
                                    <Zap size={28} className={`relative z-10 transition-transform ${isBettingPhase ? 'group-hover:scale-125 group-hover:rotate-12 fill-current' : ''}`} />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 md:py-10 opacity-20">
                         <div className="flex items-center gap-6 mb-2">
                            <div className="h-[1px] w-12 md:w-16 bg-white/40"></div>
                            <div className="flex flex-col items-center">
                                <Lock size={20} className="mb-2" />
                                <span className="text-[11px] font-black uppercase tracking-[0.4em]">Protocolo Sellado</span>
                            </div>
                            <div className="h-[1px] w-12 md:w-16 bg-white/40"></div>
                         </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
