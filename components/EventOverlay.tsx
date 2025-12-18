
import React, { useState, useEffect } from 'react';
import { EventState } from '../types';
import { 
  Utensils, Sparkles, ShieldAlert, Activity, Timer, Mic, Music, Play, Zap, Users
} from 'lucide-react';

interface EventOverlayProps {
  eventState: EventState;
  isAdmin: boolean;
  participants: string[];
  onSpinRoulette: () => void;
  onResolve: (success: boolean) => void;
}

export const EventOverlay: React.FC<EventOverlayProps> = ({
  eventState,
  isAdmin,
  participants,
  onSpinRoulette,
  onResolve,
}) => {
  const isCutlery = eventState.type === 'CUTLERY';
  const isRobbery = eventState.type === 'ROBBERY';
  const isPressure = eventState.type === 'PRESSURE';
  const isSinging = eventState.type === 'SINGING';

  const [displayTarget, setDisplayTarget] = useState<string>('IDENTIFICANDO...');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [pressureTimer, setPressureTimer] = useState<number>(10);
  const [timerStarted, setTimerStarted] = useState<boolean>(false);

  useEffect(() => {
    if (eventState.step === 'ACTION') {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [eventState.step]);

  useEffect(() => {
    setPressureTimer(10);
    setTimerStarted(false);
  }, [eventState.type, eventState.step]);

  useEffect(() => {
    let interval: any;
    if (isAnimating && participants.length > 0) {
      interval = setInterval(() => {
        const activeParticipants = participants.filter(p => p !== 'Root Admin');
        if (activeParticipants.length === 0) return;
        const randomName = activeParticipants[Math.floor(Math.random() * activeParticipants.length)];
        setDisplayTarget(randomName);
      }, 80);
    } else if (!isAnimating && eventState.targetUser) {
      setDisplayTarget(eventState.targetUser);
    }
    return () => clearInterval(interval);
  }, [isAnimating, eventState.targetUser, participants]);

  useEffect(() => {
    let timerInterval: any;
    if (isPressure && eventState.step === 'ACTION' && !isAnimating && timerStarted) {
        timerInterval = setInterval(() => {
            setPressureTimer(prev => Math.max(0, prev - 1));
        }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [isPressure, eventState.step, isAnimating, timerStarted]);

  const renderStory = () => {
    let title = "";
    let description = "";
    let rewardText = "";
    let icon = <Activity size={40} />;
    let colorClass = "bg-red-600 border-red-500";

    if (isCutlery) {
        title = "Cubiertos Sucios";
        description = "Se han localizado cubiertos sucios en la cocina. El sujeto seleccionado debe hacer 10 FLEXIONES.";
        rewardText = "RECOMPENSA: +2 CRÉDITOS | FALLO: -1 CRÉDITO";
        icon = <Utensils size={40} />;
        colorClass = "bg-orange-500 border-orange-400";
    } else if (isRobbery) {
        title = "Brecha de Seguridad";
        description = "¡Alarma! Intrusos en el sistema. Deben contar del 1 al 5 sin solaparse en voz alta.";
        rewardText = "RECOMPENSA: +6 CRÉDITOS A TODOS | FALLO: -1 CRÉDITO A TODOS";
        icon = <ShieldAlert size={40} />;
        colorClass = "bg-red-600 border-red-500";
    } else if (isPressure) {
        title = "Bajo Presión";
        description = "El sujeto seleccionado debe enumerar 5 productos de Niche Beauty Lab en 10 segundos.";
        rewardText = "RECOMPENSA: +2 CRÉDITOS | FALLO: -1 CRÉDITO";
        icon = <Timer size={40} />;
        colorClass = "bg-blue-600 border-blue-500";
    } else if (isSinging) {
        title = "Villancico Lab";
        description = "El sujeto seleccionado debe cantar un villancico con espíritu corporativo.";
        rewardText = "RECOMPENSA: +2 CRÉDITOS | FALLO: -1 CRÉDITO";
        icon = <Mic size={40} />;
        colorClass = "bg-pink-600 border-pink-500";
    }

    return (
      <div className="animate-in fade-in slide-in-from-bottom-12 duration-500 max-w-3xl w-full text-center px-4 md:px-6">
        <div className={`mx-auto w-20 h-20 md:w-28 md:h-28 rounded-[30px] md:rounded-[40px] flex items-center justify-center mb-8 md:mb-12 shadow-[0_0_60px_rgba(255,255,255,0.1)] border-2 text-white ${colorClass}`}>
          {icon}
        </div>
        <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-6 md:mb-8 leading-none">
          {title}
        </h3>
        <div className="bg-[#18181b] border-2 border-white/10 p-8 md:p-12 rounded-[40px] md:rounded-[50px] mb-8 md:mb-12 shadow-2xl backdrop-blur-xl">
          <p className="text-white text-lg md:text-2xl font-bold uppercase leading-relaxed tracking-wide mb-6">
            {description}
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/5 rounded-full border border-white/20">
             <Zap size={14} className="text-emerald-500" />
             <span className="text-[10px] md:text-[12px] font-black uppercase tracking-widest text-emerald-500">{rewardText}</span>
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={(e) => { e.stopPropagation(); onSpinRoulette(); }} 
            className="bg-white text-black px-10 py-5 md:px-16 md:py-7 rounded-[25px] md:rounded-[30px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-[12px] hover:scale-105 transition-all shadow-white/20 shadow-2xl relative z-[110] border-4 border-white/20"
          >
            {isRobbery ? 'Iniciar Protocolo de Grupo' : 'Identificar Sujeto'}
          </button>
        )}
      </div>
    );
  };

  const renderAction = () => {
    let actionInstruction = "";
    const colorTheme = {
        border: isCutlery ? 'border-orange-500/50' : isRobbery ? 'border-red-600/50' : isPressure ? 'border-blue-500/50' : 'border-pink-500/50',
        accent: isCutlery ? 'text-orange-500' : isRobbery ? 'text-red-600' : isPressure ? 'text-blue-500' : 'text-pink-500',
        bg: isCutlery ? 'bg-orange-500/10' : isRobbery ? 'bg-red-600/10' : isPressure ? 'bg-blue-500/10' : 'bg-pink-500/10',
        dashed: isCutlery ? 'border-orange-500/30' : isRobbery ? 'border-red-600/30' : isPressure ? 'border-blue-500/30' : 'border-pink-500/30'
    };

    if (isCutlery) actionInstruction = "RETO: 10 FLEXIONES";
    else if (isRobbery) actionInstruction = "RETO: CONTAR DEL 1 AL 5 SIN SOLAPARSE";
    else if (isPressure) actionInstruction = "RETO: 5 PRODUCTOS DE NICHE EN 10s";
    else if (isSinging) actionInstruction = "RETO: CANTAR UN VILLANCICO";

    return (
      <div className="animate-in fade-in duration-500 flex flex-col items-center w-full max-w-3xl text-center px-4">
        {!isRobbery && (
            <div className="relative inline-block mb-10 md:mb-16">
                <div className={`absolute -inset-10 md:-inset-14 border-4 border-dashed ${colorTheme.dashed} rounded-full ${isAnimating ? 'animate-[spin_4s_linear_infinite]' : ''}`}></div>
                <div className={`w-60 h-60 md:w-80 md:h-80 rounded-full border-4 flex items-center justify-center transition-all duration-700 ${isAnimating ? `border-current ${colorTheme.bg} shadow-[0_0_80px_rgba(0,0,0,0.4)]` : 'border-white/20 bg-white/5'} ${isAnimating ? colorTheme.accent : 'text-white'}`}>
                    <div className="px-6 md:px-8">
                        <span className={`text-2xl md:text-4xl font-black uppercase tracking-tighter break-words leading-tight ${isAnimating ? colorTheme.accent : 'text-white'}`}>
                            {displayTarget}
                        </span>
                    </div>
                </div>
            </div>
        )}

        {isRobbery && (
           <div className="mb-10 p-10 bg-white/5 border-4 border-emerald-500/20 rounded-[40px] animate-pulse">
              <Users size={60} className="mx-auto text-emerald-500 mb-6" />
              <h4 className="text-white text-4xl font-black uppercase tracking-tighter">RETO COLECTIVO</h4>
              <p className="text-emerald-500 font-bold uppercase tracking-widest mt-2">TODOS RECIBEN 6 CRÉDITOS SI LO LOGRAN</p>
           </div>
        )}

        {(!isAnimating || isRobbery) && (
            <div className="animate-in zoom-in duration-500 w-full max-w-xl">
               <div className={`bg-[#18181b] border-4 ${colorTheme.border} p-8 md:p-12 rounded-[40px] md:rounded-[50px] mb-8 md:mb-12 relative overflow-hidden shadow-2xl`}>
                 <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 hidden md:block">
                     {isSinging ? <Music size={60} /> : <Sparkles size={60} />}
                 </div>
                 <p className={`${colorTheme.accent} font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-[10px] md:text-xs mb-4 md:mb-6`}>
                     {isRobbery ? "Instrucciones de Red" : "Sujeto Seleccionado"}
                 </p>
                 {!isRobbery && <h4 className="text-white font-black uppercase tracking-tight text-3xl md:text-4xl mb-6 md:mb-8 leading-none truncate px-2">{eventState.targetUser}</h4>}
                 <div className="h-[2px] w-16 md:w-24 bg-white/10 mx-auto mb-6 md:mb-8"></div>
                 <p className="text-white font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-xl md:text-2xl mb-3 md:mb-4">{actionInstruction}</p>
                 
                 {isPressure && !isAnimating && (
                     <div className="mt-6 flex flex-col items-center">
                         <div className={`text-6xl font-mono font-black tabular-nums transition-colors ${pressureTimer <= 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                             {pressureTimer}s
                         </div>
                         {isAdmin && !timerStarted && (
                             <button 
                                onClick={() => setTimerStarted(true)}
                                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg"
                             >
                                <Play size={14} fill="white" /> Comenzar Tiempo
                             </button>
                         )}
                     </div>
                 )}
               </div>
               
               {isAdmin && (
                 <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                   <button onClick={() => onResolve(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 h-16 md:h-20 rounded-[24px] md:rounded-[28px] font-black uppercase tracking-widest text-[10px] md:text-[11px] transition-all shadow-xl border-b-4 border-emerald-800">
                      Misión Superada
                   </button>
                   <button onClick={() => onResolve(false)} className="flex-1 bg-red-600 hover:bg-red-500 h-16 md:h-20 rounded-[24px] md:rounded-[28px] font-black uppercase tracking-widest text-[10px] md:text-[11px] transition-all shadow-xl border-b-4 border-red-800">
                      Misión Fallida
                   </button>
                 </div>
               )}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#09090b]/99 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8 overflow-y-auto overflow-x-hidden">
      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center py-10">
        {eventState.step === 'STORY' && renderStory()}
        {eventState.step === 'ACTION' && renderAction()}
      </div>
    </div>
  );
};
