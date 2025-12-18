
import React, { useState, useEffect } from 'react';
import { EventState } from '../types';
import { 
  Utensils, Sparkles, ShieldAlert, Activity
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
  const [displayTarget, setDisplayTarget] = useState<string>('IDENTIFICANDO...');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    if (eventState.step === 'ACTION') {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [eventState.step]);

  useEffect(() => {
    let interval: any;
    if (isAnimating && participants.length > 0) {
      interval = setInterval(() => {
        const randomName = participants[Math.floor(Math.random() * participants.length)];
        setDisplayTarget(randomName);
      }, 80);
    } else if (!isAnimating && eventState.targetUser) {
      setDisplayTarget(eventState.targetUser);
    }
    return () => clearInterval(interval);
  }, [isAnimating, eventState.targetUser, participants]);

  const renderStory = () => (
    <div className="animate-in fade-in slide-in-from-bottom-12 duration-500 max-w-3xl w-full text-center px-4 md:px-6">
      <div className={`mx-auto w-20 h-20 md:w-28 md:h-28 rounded-[30px] md:rounded-[40px] flex items-center justify-center mb-8 md:mb-12 shadow-[0_0_60px_rgba(255,255,255,0.1)] border-2 ${isCutlery ? 'bg-orange-500 border-orange-400 text-white' : 'bg-red-600 border-red-500 text-white'}`}>
        {isCutlery ? <Utensils size={40} md:size={56} /> : <ShieldAlert size={40} md:size={56} />}
      </div>
      <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-6 md:mb-10 leading-none">
        {isCutlery ? 'Protocolo Cocina' : 'Brecha de Seguridad'}
      </h3>
      <div className="bg-[#18181b] border-2 border-white/10 p-8 md:p-12 rounded-[40px] md:rounded-[50px] mb-8 md:mb-12 shadow-2xl backdrop-blur-xl">
        <p className="text-white text-lg md:text-2xl font-bold uppercase leading-relaxed tracking-wide">
          {isCutlery 
            ? "Se han localizado cubiertos en la cocina. Como nadie asume la responsabilidad, el LAB identificará a un responsable. Si no supera el reto, perderá 1 crédito."
            : "Alguien ha dejado la oficina abierta. Unos intrusos han sustraído 1 crédito de cada persona. Hay una única oportunidad de recuperarlos colectivamente."
          }
        </p>
      </div>
      {isAdmin && (
        <button 
          onClick={(e) => { e.stopPropagation(); onSpinRoulette(); }} 
          className="bg-white text-black px-10 py-5 md:px-16 md:py-7 rounded-[25px] md:rounded-[30px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-[12px] hover:scale-105 transition-all shadow-white/20 shadow-2xl relative z-[110] border-4 border-white/20"
        >
          {isCutlery ? 'Identificar Sujeto' : 'Iniciar Recuperación'}
        </button>
      )}
    </div>
  );

  const renderAction = () => (
    <div className="animate-in fade-in duration-500 flex flex-col items-center w-full max-w-3xl text-center px-4">
      {isCutlery ? (
        <>
          <div className="relative inline-block mb-10 md:mb-16">
            <div className={`absolute -inset-10 md:-inset-14 border-4 border-dashed border-orange-500/30 rounded-full ${isAnimating ? 'animate-[spin_4s_linear_infinite]' : ''}`}></div>
            <div className={`w-60 h-60 md:w-80 md:h-80 rounded-full border-4 flex items-center justify-center transition-all duration-700 ${isAnimating ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_80px_rgba(249,115,22,0.4)]' : 'border-white/20 bg-white/5'}`}>
              <div className="px-6 md:px-8">
                <span className={`text-2xl md:text-4xl font-black uppercase tracking-tighter break-words leading-tight ${isAnimating ? 'text-orange-500' : 'text-white'}`}>
                  {displayTarget}
                </span>
              </div>
            </div>
          </div>
          {!isAnimating && eventState.targetUser && (
            <div className="animate-in zoom-in duration-500 w-full max-w-xl">
               <div className="bg-[#18181b] border-4 border-orange-500/50 p-8 md:p-12 rounded-[40px] md:rounded-[50px] mb-8 md:mb-12 relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 hidden md:block"><Sparkles size={60} /></div>
                 <p className="text-orange-500 font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-[10px] md:text-xs mb-4 md:mb-6">Responsable Identificado</p>
                 <h4 className="text-white font-black uppercase tracking-tight text-3xl md:text-4xl mb-6 md:mb-8 leading-none truncate px-2">{eventState.targetUser}</h4>
                 <div className="h-[2px] w-16 md:w-24 bg-white/10 mx-auto mb-6 md:mb-8"></div>
                 <p className="text-white font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-xl md:text-2xl mb-3 md:mb-4">RETO: 3 FLEXIONES</p>
                 <p className="text-white/40 text-[9px] md:text-[11px] font-bold uppercase leading-relaxed tracking-widest">Si el sujeto no las realiza, restaremos 1 crédito de su terminal.</p>
               </div>
               {isAdmin && (
                 <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                   <button onClick={() => onResolve(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 h-16 md:h-20 rounded-[24px] md:rounded-[28px] font-black uppercase tracking-widest text-[10px] md:text-[11px] transition-all shadow-xl border-b-4 border-emerald-800">Prueba Superada</button>
                   <button onClick={() => onResolve(false)} className="flex-1 bg-red-600 hover:bg-red-500 h-16 md:h-20 rounded-[24px] md:rounded-[28px] font-black uppercase tracking-widest text-[10px] md:text-[11px] transition-all shadow-xl border-b-4 border-red-800">Imponer Castigo</button>
                 </div>
               )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center w-full max-w-2xl px-2">
          <div className="bg-[#18181b] border-4 border-red-600/50 p-10 md:p-14 rounded-[40px] md:rounded-[60px] mb-8 md:mb-12 shadow-2xl backdrop-blur-3xl relative">
            <div className="absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-2xl md:rounded-3xl flex items-center justify-center border-4 border-red-500 shadow-xl">
               <Activity size={32} md:size={40} className="text-white" />
            </div>
            <h4 className="text-red-500 font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-[10px] md:text-sm mb-6 md:mb-10 mt-6 md:mt-8">Protocolo de Emergencia</h4>
            <div className="space-y-6 md:space-y-8 mb-4">
              <p className="text-white text-2xl md:text-3xl font-black uppercase leading-tight tracking-tight">Sincronización Mental</p>
              <div className="h-[2px] w-16 md:w-20 bg-white/10 mx-auto"></div>
              <p className="text-white/80 text-base md:text-lg font-bold uppercase leading-relaxed tracking-wide">Todo el personal debe cerrar los ojos y contar del 1 al 5 en voz alta sin solaparse para estabilizar el sistema.</p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
              <button onClick={() => onResolve(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 h-20 md:h-24 rounded-[28px] md:rounded-[32px] font-black uppercase tracking-widest text-[10px] md:text-xs shadow-2xl border-b-4 md:border-b-8 border-emerald-900">Activos Recuperados</button>
              <button onClick={() => onResolve(false)} className="flex-1 bg-red-600 hover:bg-red-500 h-20 md:h-24 rounded-[28px] md:rounded-[32px] font-black uppercase tracking-widest text-[10px] md:text-xs shadow-2xl border-b-4 md:border-b-8 border-red-900">Misión Fallida</button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-[#09090b]/99 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8 overflow-y-auto overflow-x-hidden">
      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center py-10">
        {eventState.step === 'STORY' && renderStory()}
        {eventState.step === 'ACTION' && renderAction()}
      </div>
    </div>
  );
};
