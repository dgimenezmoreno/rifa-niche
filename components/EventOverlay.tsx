
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
        title = "Cubiertos Sucios"; 
        description = "Sujeto seleccionado: 10 FLEXIONES."; 
        icon = <Utensils size={60} />; 
        break;
      case 'ROBBERY': 
        title = "Brecha de Seguridad"; 
        description = "Contar del 1 al 5 en grupo sin solaparse."; 
        icon = <ShieldAlert size={60} />; 
        break;
      case 'PRESSURE': 
        title = "Bajo Presión"; 
        description = "Sujeto seleccionado: 5 productos en 10s."; 
        icon = <Timer size={60} />; 
        break;
      case 'SINGING': 
        title = "Villancico Lab"; 
        description = "Sujeto seleccionado: Cantar con espíritu."; 
        icon = <Mic size={60} />; 
        break;
    }

    return (
      <div className="max-w-4xl w-full text-center px-6">
        <div className="mx-auto w-32 h-32 border-[6px] border-white flex items-center justify-center mb-12 bg-white text-black">
          {icon}
        </div>
        <h3 className="text-7xl font-black uppercase text-white mb-10 leading-none">
          {title}
        </h3>
        <div className="bg-white border-[6px] border-white p-12 mb-12 text-black">
          <p className="text-4xl font-black uppercase leading-tight mb-8">
            {description}
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-black text-white">
             <Zap size={24} />
             <span className="text-xl font-black uppercase tracking-widest">+2 CRÉDITOS / -1 CRÉDITO</span>
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={onSpinRoulette} 
            className="bg-white text-black px-16 py-8 border-[6px] border-white font-black uppercase text-2xl hover:bg-black hover:text-white transition-all"
          >
            {eventState.type === 'ROBBERY' ? 'Iniciar Reto' : 'Seleccionar Sujeto'}
          </button>
        )}
      </div>
    );
  };

  const renderAction = () => {
    return (
      <div className="flex flex-col items-center w-full max-w-5xl text-center px-6">
        {eventState.type !== 'ROBBERY' && (
            <div className="relative mb-16">
                <div className={`w-96 h-96 border-[8px] flex flex-col items-center justify-center transition-all ${isAnimating ? 'bg-white text-black border-white' : 'bg-black text-white border-white'}`}>
                    <span className="text-4xl font-black uppercase break-words leading-tight px-6">
                        {displayTarget}
                    </span>
                </div>
            </div>
        )}

        {eventState.type === 'ROBBERY' && (
           <div className="mb-12 p-16 border-[8px] border-white bg-white text-black">
              <Users size={80} className="mx-auto mb-8" />
              <h4 className="text-6xl font-black uppercase">Reto Colectivo</h4>
              <p className="text-2xl font-bold uppercase mt-4">Todos ganan si lo logran</p>
           </div>
        )}

        {(!isAnimating || eventState.type === 'ROBBERY') && (
            <div className="w-full">
               <div className="bg-black border-[6px] border-white p-12 mb-12 text-white">
                 {!eventState.type.includes('ROBBERY') && (
                    <h4 className="text-6xl font-black uppercase mb-8 leading-none">{eventState.targetUser}</h4>
                 )}
                 <div className="h-2 w-40 bg-white mx-auto mb-8"></div>
                 <p className="text-4xl font-black uppercase tracking-widest">
                    {eventState.type === 'PRESSURE' && !isAnimating ? `Tiempo: ${pressureTimer}s` : '¡ADELANTE!'}
                 </p>
                 
                 {eventState.type === 'PRESSURE' && isAdmin && !timerStarted && (
                     <button onClick={() => setTimerStarted(true)} className="mt-8 bg-white text-black px-10 py-4 font-black uppercase">Empezar Cuenta Atrás</button>
                 )}
               </div>
               
               {isAdmin && (
                 <div className="flex gap-8">
                   <button onClick={() => onResolve(true)} className="flex-1 bg-white text-black h-24 font-black uppercase text-2xl border-[4px] border-white">Conseguido</button>
                   <button onClick={() => onResolve(false)} className="flex-1 bg-black text-white h-24 font-black uppercase text-2xl border-[4px] border-white">Fallido</button>
                 </div>
               )}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-8">
      {eventState.step === 'STORY' ? renderStory() : renderAction()}
    </div>
  );
};
