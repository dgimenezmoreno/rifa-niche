
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AppPhase, CurrentUser, Gift, BroadcastEvent, EventState } from './types';
import { GiftCard } from './components/GiftCard';
import { EventOverlay } from './components/EventOverlay';
import { getStaticPrizes } from './services/geminiService';
import { simulateRoundBets, selectWinners, BOT_NAMES } from './services/gameLogic';
import { 
  Play, ShieldCheck, Timer, ArrowRight, FlaskConical, BellRing, 
  Dna, Beaker, Zap, Activity, Loader2
} from 'lucide-react';

// Estos valores deben configurarse en las variables de entorno de Vercel (SUPABASE_URL y SUPABASE_ANON_KEY)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Inicialización segura de Supabase
const isSupabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const ROUND_DURATION = 35; 
const INITIAL_CREDITS = 12;
const CHANNEL_NAME = 'raffle_room';

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>(AppPhase.LOGIN);
  const [user, setUser] = useState<CurrentUser>({ name: '', totalPoints: INITIAL_CREDITS, remainingPoints: INITIAL_CREDITS, isAdmin: false });
  const [userInputName, setUserInputName] = useState('');
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [eventState, setEventState] = useState<EventState | null>(null);
  
  // Refs para manejar canales (Supabase o Local)
  const supabaseChannelRef = useRef<any>(null);
  const localChannelRef = useRef<BroadcastChannel | null>(null);
  const stateRef = useRef({ phase, gifts, participants, currentRoundIndex, timeLeft, user, eventState });

  const currentGift = gifts[currentRoundIndex];

  useEffect(() => { 
    stateRef.current = { phase, gifts, participants, currentRoundIndex, timeLeft, user, eventState }; 
  }, [phase, gifts, participants, currentRoundIndex, timeLeft, user, eventState]);

  // Función unificada para enviar mensajes (Broadcast)
  const broadcast = (payload: BroadcastEvent) => {
    // 1. Intentar via Supabase (Tiempo Real Online)
    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'raffle_event',
        payload
      });
    }
    // 2. Intentar via Local (Mismo navegador/pestañas)
    if (localChannelRef.current) {
      localChannelRef.current.postMessage(payload);
    }
  };

  // Lógica de procesamiento de mensajes recibidos
  const handleIncomingMessage = (payload: BroadcastEvent) => {
    const cs = stateRef.current;
    switch (payload.type) {
      case 'PHASE_CHANGE':
        setPhase(payload.phase);
        if (payload.gifts) setGifts(payload.gifts);
        if (payload.currentRoundIndex !== undefined) setCurrentRoundIndex(payload.currentRoundIndex);
        if (payload.eventState) setEventState(payload.eventState);
        if (payload.eventState?.type === 'ROBBERY' && payload.eventState.step === 'STORY' && !cs.user.isAdmin) {
           setUser(prev => ({ ...prev, remainingPoints: Math.max(0, prev.remainingPoints - 1) }));
        }
        break;
      case 'EVENT_STEP_UPDATE':
        setEventState(payload.eventState);
        break;
      case 'PLAYER_JOIN':
        setParticipants(prev => prev.includes(payload.name) ? prev : [...prev, payload.name]);
        break;
      case 'PLACE_BET':
        handleIncomingBet(payload.giftId, payload.userName);
        break;
      case 'GIFT_UPDATE':
        setGifts(prev => prev.map(g => g.id === payload.gift.id ? payload.gift : g));
        break;
      case 'TIMER_UPDATE':
        setTimeLeft(payload.timeLeft);
        break;
      case 'ROUND_CHANGE':
        setCurrentRoundIndex(payload.roundIndex);
        setPhase(AppPhase.ROUND_WAITING);
        setTimeLeft(ROUND_DURATION);
        break;
      case 'EVENT_RESOLVED':
        if (payload.success && cs.eventState?.type === 'ROBBERY' && !cs.user.isAdmin) {
           setUser(prev => ({ ...prev, remainingPoints: prev.remainingPoints + 1 }));
        }
        if (!payload.success && cs.eventState?.type === 'CUTLERY' && cs.user.name === cs.eventState.targetUser) {
           setUser(prev => ({ ...prev, remainingPoints: Math.max(0, prev.remainingPoints - 1) }));
        }
        setPhase(AppPhase.ROUND_REVEAL);
        setEventState(null);
        break;
      case 'SYNC_REQUEST':
         if (cs.user.isAdmin) {
             broadcast({
              type: 'SYNC_RESPONSE',
              phase: cs.phase,
              gifts: cs.gifts,
              participants: cs.participants,
              currentRoundIndex: cs.currentRoundIndex,
              timeLeft: cs.timeLeft,
              eventState: cs.eventState || undefined
            });
         }
         break;
      case 'SYNC_RESPONSE':
         if (!cs.user.isAdmin) {
           setPhase(payload.phase);
           setGifts(payload.gifts);
           setParticipants(payload.participants);
           setCurrentRoundIndex(payload.currentRoundIndex);
           setTimeLeft(payload.timeLeft);
           if (payload.eventState) setEventState(payload.eventState);
         }
         break;
    }
  };

  useEffect(() => {
    // Inicializar canal local (siempre disponible)
    const localChannel = new BroadcastChannel(CHANNEL_NAME);
    localChannel.onmessage = (event) => handleIncomingMessage(event.data);
    localChannelRef.current = localChannel;

    // Inicializar canal Supabase (solo si está configurado)
    let sbChannel: any = null;
    if (supabase) {
      sbChannel = supabase.channel(CHANNEL_NAME, {
        config: { broadcast: { self: false } }
      });

      sbChannel
        .on('broadcast', { event: 'raffle_event' }, ({ payload }: { payload: BroadcastEvent }) => {
          handleIncomingMessage(payload);
        })
        .subscribe();
      
      supabaseChannelRef.current = sbChannel;
    }

    return () => {
      localChannel.close();
      if (sbChannel && supabase) supabase.removeChannel(sbChannel);
    };
  }, []);

  const handleIncomingBet = (giftId: string, userName: string) => {
    setGifts(prevGifts => {
        const index = prevGifts.findIndex(g => g.id === giftId);
        if (index === -1) return prevGifts;
        const updatedGifts = [...prevGifts];
        const gift = { ...updatedGifts[index] };
        const newAllocations = [...gift.allocations];
        const existingIndex = newAllocations.findIndex(a => a.userName === userName);
        if (existingIndex > -1) {
             newAllocations[existingIndex] = { ...newAllocations[existingIndex], points: newAllocations[existingIndex].points + 1 };
        } else {
            newAllocations.push({ userName, points: 1, isCurrentUser: userName === stateRef.current.user.name });
        }
        gift.allocations = newAllocations;
        gift.totalPoints += 1;
        updatedGifts[index] = gift;
        return updatedGifts;
    });
  };

  useEffect(() => {
    let interval: any;
    if (user.isAdmin && phase === AppPhase.ROUND_ACTIVE) {
        interval = setInterval(() => {
            setTimeLeft(prev => {
                const newVal = prev - 1;
                broadcast({ type: 'TIMER_UPDATE', timeLeft: newVal });
                if (newVal <= 0) { clearInterval(interval); handleRoundLock(); return 0; }
                return newVal;
            });
            if (gifts[currentRoundIndex]) {
                const botsToBet = simulateRoundBets(gifts[currentRoundIndex]);
                botsToBet.forEach(botName => {
                    handleIncomingBet(gifts[currentRoundIndex].id, botName);
                    broadcast({ type: 'PLACE_BET', giftId: gifts[currentRoundIndex].id, userName: botName });
                });
            }
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [user.isAdmin, phase, currentRoundIndex, gifts]);

  const handleJoin = () => {
    if (!userInputName.trim()) return;
    setUser({ ...user, name: userInputName, isAdmin: false });
    setParticipants(prev => prev.includes(userInputName) ? prev : [...prev, userInputName]);
    setPhase(AppPhase.WAITING);
    broadcast({ type: 'PLAYER_JOIN', name: userInputName });
    broadcast({ type: 'SYNC_REQUEST' });
  };

  const handleStartGame = async () => {
    setPhase(AppPhase.LOADING_GIFTS);
    const prizes = getStaticPrizes();
    const newGifts: Gift[] = prizes.map((p, index) => ({
      id: `gift-${index}`,
      hiddenName: `BATCH_${(index + 1).toString().padStart(2, '0')}`,
      revealedName: p.revealedName!,
      description: p.description!,
      emoji: p.emoji!,
      packs: p.packs!,
      totalPoints: 0,
      allocations: [],
      isContentRevealed: false,
      isWinnerRevealed: false
    }));
    setGifts(newGifts);
    setCurrentRoundIndex(0);
    setPhase(AppPhase.ROUND_WAITING);
    broadcast({ type: 'PHASE_CHANGE', phase: AppPhase.ROUND_WAITING, gifts: newGifts, currentRoundIndex: 0 });
  };

  const handleStartRound = () => { setTimeLeft(ROUND_DURATION); setPhase(AppPhase.ROUND_ACTIVE); broadcast({ type: 'PHASE_CHANGE', phase: AppPhase.ROUND_ACTIVE }); };
  const handleRoundLock = () => { setPhase(AppPhase.ROUND_LOCKED); broadcast({ type: 'PHASE_CHANGE', phase: AppPhase.ROUND_LOCKED }); };
  
  const triggerEvent = (type: 'CUTLERY' | 'ROBBERY') => {
    const newState: EventState = { type, step: 'STORY' };
    setEventState(newState);
    setPhase(AppPhase.EVENT_NARRATIVE);
    broadcast({ type: 'PHASE_CHANGE', phase: AppPhase.EVENT_NARRATIVE, eventState: newState });
  };

  const handleSpinRoulette = () => {
    if (!eventState || !user.isAdmin) return;
    const activeAllocations = currentGift?.allocations.map(a => a.userName) || [];
    const pool = participants.length > 0 ? participants : activeAllocations.length > 0 ? activeAllocations : BOT_NAMES;
    const target = pool[Math.floor(Math.random() * pool.length)];
    const newState: EventState = { ...eventState, step: 'ACTION', targetUser: eventState.type === 'CUTLERY' ? target : undefined };
    setEventState(newState);
    broadcast({ type: 'EVENT_STEP_UPDATE', eventState: newState });
  };

  const resolveEvent = (success: boolean) => {
     setPhase(AppPhase.ROUND_REVEAL);
     setEventState(null);
     broadcast({ type: 'EVENT_RESOLVED', success });
  };

  const handleNextRound = () => {
      if (currentRoundIndex >= gifts.length - 1) {
          setPhase(AppPhase.FINISHED);
          broadcast({ type: 'PHASE_CHANGE', phase: AppPhase.FINISHED });
          return;
      }
      const nextIndex = currentRoundIndex + 1;
      setCurrentRoundIndex(nextIndex);
      setPhase(AppPhase.ROUND_WAITING);
      broadcast({ type: 'ROUND_CHANGE', roundIndex: nextIndex });
  };

  const handleAdminReveal = (giftId: string) => {
    if (!user.isAdmin || (phase !== AppPhase.ROUND_LOCKED && phase !== AppPhase.ROUND_REVEAL)) return;
    if (phase !== AppPhase.ROUND_REVEAL) { setPhase(AppPhase.ROUND_REVEAL); broadcast({ type: 'PHASE_CHANGE', phase: AppPhase.ROUND_REVEAL }); }
    setGifts(prevGifts => {
      const idx = prevGifts.findIndex(g => g.id === giftId);
      const updated = [...prevGifts];
      const gift = { ...updated[idx] };
      if (!gift.isContentRevealed) gift.isContentRevealed = true;
      else if (!gift.isWinnerRevealed) { gift.winners = selectWinners(gift, gift.packs); gift.isWinnerRevealed = true; }
      else return prevGifts;
      updated[idx] = gift;
      broadcast({ type: 'GIFT_UPDATE', gift });
      return updated;
    });
  };

  const handlePlaceBet = (giftId: string) => {
      if (phase !== AppPhase.ROUND_ACTIVE || user.remainingPoints <= 0) return;
      setUser(prev => ({ ...prev, remainingPoints: prev.remainingPoints - 1 }));
      handleIncomingBet(giftId, user.name);
      broadcast({ type: 'PLACE_BET', giftId, userName: user.name });
  };

  if (phase === AppPhase.LOGIN) {
     return (
        <div className="h-screen flex items-center justify-center p-6 bg-[#0a0a0b] relative">
          {!isSupabaseConfigured && (
            <div className="absolute top-4 left-4 bg-amber-500/10 border border-amber-500/50 text-amber-500 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest z-50">
              Modo Local: Sincronización Multidispositivo Desactivada
            </div>
          )}
          <div className="w-full max-w-xl z-10">
             <div className="bg-[#18181b] border border-white/20 p-12 md:p-20 rounded-[48px] shadow-[0_0_80px_rgba(255,255,255,0.05)] relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><FlaskConical size={180} /></div>
                 <div className="mb-20">
                     <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-white/40 block mb-6">Niche Beauty Lab Protocol</span>
                     <h2 className="text-6xl md:text-7xl font-bold tracking-tighter text-white uppercase leading-none">The<br/><span className="text-white/20">Active List</span></h2>
                 </div>
                 <form onSubmit={(e) => { e.preventDefault(); handleJoin(); }} className="space-y-16">
                      <div className="space-y-4 text-left">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-white/40 ml-1">Firma del Formulador</label>
                        <input type="text" value={userInputName} onChange={(e) => setUserInputName(e.target.value)} placeholder="IDENTIFÍCATE" className="w-full bg-[#27272a] border border-white/10 rounded-2xl px-8 py-6 text-xl font-medium focus:outline-none focus:border-white/40 transition-all placeholder:text-white/10 uppercase tracking-widest text-white shadow-inner" autoFocus />
                      </div>
                      <button type="submit" disabled={!userInputName.trim()} className="w-full bg-white text-black h-20 rounded-3xl flex items-center justify-between px-10 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] disabled:opacity-5 transition-all group">
                          <span className="font-bold uppercase tracking-[0.3em] text-[10px]">Acceso Terminal Lab</span>
                          <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                      </button>
                  </form>
                  <div className="mt-20 pt-10 border-t border-white/5 flex justify-between items-center">
                      <button onClick={() => { setUser({ name: 'Admin', totalPoints: 0, remainingPoints: 0, isAdmin: true }); setPhase(AppPhase.WAITING); }} className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors flex items-center gap-3">
                          <ShieldCheck size={14} /> Acceso Root
                      </button>
                      <span className="text-[9px] font-mono text-white/10 uppercase tracking-widest">LAB_AUTH_v3.5</span>
                  </div>
             </div>
          </div>
        </div>
      );
  }

  return (
    <div className="h-screen bg-[#09090b] text-white font-maison flex flex-col relative overflow-hidden">
      {eventState && (
        <EventOverlay 
          eventState={eventState}
          isAdmin={user.isAdmin}
          participants={participants}
          onSpinRoulette={handleSpinRoulette}
          onResolve={resolveEvent}
        />
      )}

      <header className="bg-[#18181b]/95 backdrop-blur-3xl border-b border-white/10 px-8 py-6 flex items-center justify-between z-40 shrink-0">
          <div className="flex items-center gap-5">
              <div className="w-9 h-9 bg-white flex items-center justify-center rounded-xl shadow-lg"><FlaskConical size={18} className="text-black" /></div>
              <span className="font-bold tracking-tighter text-xl uppercase">Niche Beauty Lab</span>
          </div>
          
          <div className="flex items-center gap-8">
              {!user.isAdmin && (
                <div className="flex items-center gap-6 bg-[#27272a] px-6 py-3 rounded-2xl border border-white/5 shadow-lg">
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em]">Créditos Activos</span>
                    <div className="flex gap-1.5">
                        {[...Array(INITIAL_CREDITS)].map((_, i) => (
                            <div key={i} className={`w-3 h-3 rounded-sm transition-all duration-500 ${i < user.remainingPoints ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'bg-white/5'}`}></div>
                        ))}
                    </div>
                </div>
              )}
              {user.isAdmin && (
                <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/20 px-5 py-2.5 rounded-full text-white/80">
                  <Activity size={12} className="text-white/60" /> R&D LAB
                </div>
              )}
          </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center">
              {phase === AppPhase.WAITING ? (
                  <div className="w-full max-w-5xl animate-in fade-in duration-700">
                      <div className="grid lg:grid-cols-2 gap-10">
                           <div className="bg-[#18181b] border border-white/10 rounded-[48px] p-16 flex flex-col justify-center text-left shadow-2xl">
                               <h1 className="text-7xl font-black uppercase tracking-tighter mb-8 leading-none">
                                 {user.isAdmin ? "Control" : "Protocolo de<br/><span className='text-white/20'>Espera</span>"}
                               </h1>
                               <p className="text-white/40 text-[11px] font-medium uppercase tracking-[0.3em] leading-relaxed max-w-sm mb-12">
                                 {user.isAdmin 
                                    ? "Sistemas estabilizados. Todos los lotes de I+D están listos para el protocolo de distribución activa." 
                                    : "El laboratorio está procesando los activos finales. Asegúrate de que tus terminales de formulación estén conectados."}
                               </p>
                               {user.isAdmin && (
                                 <button onClick={handleStartGame} className="bg-white text-black h-20 rounded-2xl flex items-center justify-between px-10 hover:shadow-2xl transition-all group">
                                     <span className="font-bold uppercase tracking-widest text-sm">Iniciar Distribución</span>
                                     <Play size={20} fill="black" />
                                 </button>
                               )}
                           </div>
                           <div className="bg-[#27272a] border border-white/10 rounded-[48px] p-16 shadow-xl relative overflow-hidden">
                               <div className="absolute top-0 right-0 p-8 opacity-5"><Beaker size={100} /></div>
                               <div className="flex justify-between items-center mb-10">
                                   <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/30">Sujetos de Ensayo</span>
                                   <span className="text-5xl font-mono text-white/60 tracking-tighter">{participants.length}</span>
                               </div>
                               <div className="grid grid-cols-2 gap-3">
                                   {participants.slice(0, 10).map((p, i) => (
                                       <div key={i} className="py-3 px-5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/50">{p}</div>
                                   ))}
                                   {participants.length > 10 && <div className="py-3 px-5 text-[10px] text-white/20 italic">+{participants.length - 10} más...</div>}
                               </div>
                           </div>
                      </div>
                  </div>
              ) : phase === AppPhase.LOADING_GIFTS ? (
                  <div className="flex flex-col items-center justify-center h-full">
                      <Loader2 className="animate-spin text-white/40 mb-8" size={64} strokeWidth={1} />
                      <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-white/30">Sintetizando activos de I+D</span>
                  </div>
              ) : (
                <div className="w-full max-w-7xl animate-in fade-in zoom-in duration-500">
                    {currentGift ? (
                        <GiftCard 
                            gift={currentGift}
                            userPointsAllocated={currentGift.allocations.find(a => a.userName === user.name)?.points || 0}
                            phase={phase}
                            canAllocate={user.remainingPoints > 0}
                            timeLeft={timeLeft}
                            isAdmin={user.isAdmin}
                            onAllocate={handlePlaceBet}
                            onAdminReveal={handleAdminReveal}
                        />
                    ) : (
                        <div className="text-center bg-[#18181b] border border-white/20 p-24 rounded-[48px] max-w-2xl mx-auto shadow-2xl">
                            <Dna size={48} className="mx-auto mb-8 text-white/20" />
                            <h2 className="text-6xl font-black uppercase tracking-tighter mb-8 leading-none">Protocolo<br/><span className="text-white/10">Finalizado</span></h2>
                            <p className="mb-12 text-[10px] text-white/40 uppercase tracking-[0.4em]">Todos los activos han sido asignados correctamente.</p>
                            <button onClick={() => window.location.reload()} className="bg-white text-black px-12 py-6 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all">Reiniciar Terminal</button>
                        </div>
                    )}
                </div>
              )}
          </main>
      </div>

      {user.isAdmin && currentGift && (
          <div className="bg-[#18181b] border-t border-white/20 p-6 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] shrink-0">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-10">
                      <div>
                          <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-white/30 mb-1 block">Campaña Activa</span>
                          <span className="text-white font-mono text-sm font-bold uppercase">Lote {(currentRoundIndex + 1).toString().padStart(2, '0')} / {gifts.length}</span>
                      </div>
                      <div className="h-8 w-[1px] bg-white/10"></div>
                      <div className="flex gap-2">
                          <button onClick={() => triggerEvent('CUTLERY')} className="bg-orange-500/10 border border-orange-500/30 text-orange-500 px-5 h-10 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-orange-500/20 transition-all">Protocolo Cocina</button>
                          <button onClick={() => triggerEvent('ROBBERY')} className="bg-red-600/10 border border-red-600/30 text-red-600 px-5 h-10 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-red-600/20 transition-all">Protocolo Robo</button>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      {phase === AppPhase.ROUND_WAITING && (
                        <button onClick={handleStartRound} className="bg-white text-black px-10 h-12 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-lg">
                            <Timer size={14} /> Abrir Formulación
                        </button>
                      )}
                      {phase === AppPhase.ROUND_ACTIVE && (
                        <button onClick={handleRoundLock} className="bg-red-600 text-white px-10 h-12 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-red-500 transition-all shadow-lg">
                            Cerrar Lote
                        </button>
                      )}
                      {(phase === AppPhase.ROUND_LOCKED || phase === AppPhase.ROUND_REVEAL) && (
                           <div className="flex gap-3">
                               {!currentGift.isContentRevealed && (
                                 <button onClick={() => handleAdminReveal(currentGift.id)} className="bg-white text-black px-10 h-12 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg">Revelar Lote</button>
                               )}
                               {currentGift.isContentRevealed && !currentGift.isWinnerRevealed && (
                                 <button onClick={() => handleAdminReveal(currentGift.id)} className="bg-white text-black px-10 h-12 rounded-lg text-[10px] font-bold uppercase tracking-widest animate-pulse shadow-xl">Publicar Ganadores</button>
                               )}
                               {currentGift.isWinnerRevealed && (
                                 <button onClick={handleNextRound} className="bg-white text-black px-10 h-12 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 shadow-lg">Siguiente Lote <ArrowRight size={14} /></button>
                               )}
                           </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
