
import React, { useState, useEffect } from 'react';
import { EventState } from '../types';
import { 
  Utensils, Sparkles, ShieldAlert, Activity, Timer, Mic, Play, Zap, Users
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
  const [displayTarget, setDisplayTarget] = useState<string>('BUSCANDO...');
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
    if (eventState.type === 'PRESSURE' && eventState.step === 'ACTION' && !isAnimating && timerStarted) {
        timerInterval = setInterval(() => {
            setPressureTimer(prev => Math.max(0, prev - 1));
        }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [eventState.type, eventState.step, isAnimating, timerStarted]);

  const renderStory = () => {
    let title = "";
    let description = "";
    let icon = <Activity size={60} />;

    switch(eventState.type) {
      case 'CUTLERY': 
        title = "Protocolo de Higiene"; 
        description = "Hemos detectado cubiertos sucios en el área de descanso. El sujeto seleccionado debe demostrar su forma física con 10 FLEXIONES militares ante el grupo."; 
        icon = <Utensils className="w-12 h-12 md:w-20 md:h-20" />; 
        break;
      case 'ROBBERY': 
        title = "Fallo del Cortafuegos"; 
        description = "¡Alerta de seguridad! El grupo debe sincronizarse: Contad del 1 al 5 en orden aleatorio sin que dos personas hablen a la vez. Si falláis, todos perdéis 1 crédito."; 
        icon = <ShieldAlert className="w-12 h-12 md:w-20 md:h-20" />; 
        break;
      case 'PRESSURE': 
        title = "Punto de Ebullición"; 
        description = "La cadena de producción se ha acelerado. El sujeto seleccionado tiene 10 SEGUNDOS para nombrar 5 productos del catálogo de Niche Beauty Lab."; 
        icon = <Timer className="w-12 h-12 md:w-20 md:h-20" />; 
        break;
      case 'SINGING': 
        title = "Resonancia Magnética"; 
        description = "Se requiere una prueba de audio. El sujeto seleccionado debe cantar la estrofa de un villancico con 'espíritu corporativo' para desbloquear los premios."; 
        icon = <Mic className="w-12 h-12 md:w-20 md:h-20" />; 
        break;
    }

    return (
      <div className="max-w-4xl w-full text-center px-4 md:px-6 overflow-y-auto max-h-[90vh] custom-scrollbar">
        <div className="mx-auto w-20 h-20 md:w-32 md:h-32 border-[4px] md:border-[6px] border-white flex items-center justify-center mb-6 md:mb-12 bg-white text-black shrink-0">
          {icon}
        </div>
        <h3 className="text-3xl md:text-7xl font-black uppercase text-white mb-6 md:mb-10 leading-tight">
          {title}
        </h3>
        <div className="bg-white border-[4px] md:border-[6px] border-white p-6 md:p-12 mb-8 md:mb-12 text-black">
          <p className="text-xl md:text-4xl font-black uppercase leading-snug md:leading-tight mb-6 md:mb-8">
            {description}
          </p>
          <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 bg-black text-white">
             <Zap size={20} className="md:w-6 md:h-6" />
             <span className="text-xs md:text-xl font-black uppercase tracking-widest">+2 CRÉDITOS / -1 CRÉDITO</span>
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={onSpinRoulette} 
            className="w-full md:w-auto bg-white text-black px-8 md:px-16 py-4 md:py-8 border-[4px] md:border-[6px] border-white font-black uppercase text-lg md:text-2xl hover:bg-black hover:text-white transition-all"
          >
            {eventState.type === 'ROBBERY' ? 'Iniciar Reto' : 'Seleccionar Sujeto'}
          </button>
        )}
      </div>
    );
  };

  const renderAction = () => {
    return (
      <div className="flex flex-col items-center w-full max-w-5xl text-center px-4 md:px-6">
        {eventState.type !== 'ROBBERY' && (
            <div className="relative mb-8 md:mb-16 shrink-0">
                <div className={`w-64 h-64 md:w-96 md:h-96 border-[6px] md:border-[8px] flex flex-col items-center justify-center transition-all ${isAnimating ? 'bg-white text-black border-white' : 'bg-black text-white border-white'}`}>
                    <span className="text-2xl md:text-4xl font-black uppercase break-words leading-tight px-4 md:px-6">
                        {displayTarget}
                    </span>
                </div>
            </div>
        )}

        {eventState.type === 'ROBBERY' && (
           <div className="mb-8 md:mb-12 p-8 md:p-16 border-[6px] md:border-[8px] border-white bg-white text-black shrink-0">
              <Users size={48} className="md:w-20 md:h-20 mx-auto mb-4 md:mb-8" />
              <h4 className="text-3xl md:text-6xl font-black uppercase">Reto Colectivo</h4>
              <p className="text-lg md:text-2xl font-bold uppercase mt-2 md:mt-4">Sincronización de Grupo</p>
           </div>
        )}

        {(!isAnimating || eventState.type === 'ROBBERY') && (
            <div className="w-full">
               <div className="bg-black border-[4px] md:border-[6px] border-white p-6 md:p-12 mb-8 md:mb-12 text-white">
                 {!eventState.type.includes('ROBBERY') && (
                    <h4 className="text-3xl md:text-6xl font-black uppercase mb-4 md:mb-8 leading-none">{eventState.targetUser}</h4>
                 )}
                 <div className="h-1 md:h-2 w-20 md:w-40 bg-white mx-auto mb-6 md:mb-8"></div>
                 <p className="text-xl md:text-4xl font-black uppercase tracking-widest">
                    {eventState.type === 'PRESSURE' && !isAnimating ? `Tiempo: ${pressureTimer}s` : '¡ADELANTE!'}
                 </p>
                 
                 {eventState.type === 'PRESSURE' && isAdmin && !timerStarted && (
                     <button onClick={() => setTimerStarted(true)} className="mt-6 md:mt-8 bg-white text-black px-6 md:px-10 py-3 md:py-4 font-black uppercase text-sm md:text-base">Empezar Cuenta Atrás</button>
                 )}
               </div>
               
               {isAdmin && (
                 <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                   <button onClick={() => onResolve(true)} className="flex-1 bg-white text-black h-16 md:h-24 font-black uppercase text-lg md:text-2xl border-[3px] md:border-[4px] border-white">Éxito</button>
                   <button onClick={() => onResolve(false)} className="flex-1 bg-black text-white h-16 md:h-24 font-black uppercase text-lg md:text-2xl border-[3px] md:border-[4px] border-white">Fallo</button>
                 </div>
               )}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4 md:p-8">
      {eventState.step === 'STORY' ? renderStory() : renderAction()}
    </div>
  );
};
