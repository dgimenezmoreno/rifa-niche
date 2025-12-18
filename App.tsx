
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AppPhase, CurrentUser, Gift, BroadcastEvent, EventState, EventType } from './types';
import { GiftCard } from './components/GiftCard';
import { EventOverlay } from './components/EventOverlay';
import { getStaticPrizes } from './services/geminiService';
import { selectWinners } from './services/gameLogic';
import { 
  Play, ShieldCheck, Timer, ArrowRight, FlaskConical, 
  Loader2, Users, Wifi, WifiOff, QrCode,
  Trophy, CheckCircle2, RefreshCw, FileText
} from 'lucide-react';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ecvhanpeesnclvzkvikg.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjdmhhbnBlZXNuY2x2emt2aWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMTMwNTgsImV4cCI6MjA4MTU4OTA1OH0.XpfBQbrvaBz9uMOWe76rx54VaCCK3xIMGTaIGqnEV1Q';

const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const ROUND_DURATION = 35; 
const INITIAL_CREDITS = 12;

const AUTO_EVENTS: EventType[] = ['CUTLERY', 'ROBBERY', 'PRESSURE', 'SINGING'];
const TRIGGER_INDICES = [3, 7, 11, 14]; 

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>(AppPhase.LOGIN);
  const [user, setUser] = useState<CurrentUser>({ name: '', totalPoints: INITIAL_CREDITS, remainingPoints: INITIAL_CREDITS, isAdmin: false });
  const [userInputName, setUserInputName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loginMode, setLoginMode] = useState<'USER' | 'ADMIN' | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [eventState, setEventState] = useState<EventState | null>(null);
  const [completedEvents, setCompletedEvents] = useState<EventType[]>([]);
  const [allWinners, setAllWinners] = useState<string[]>([]); 
  
  const supabaseChannelRef = useRef<any>(null);
  const stateRef = useRef({ phase, gifts, participants, currentRoundIndex, timeLeft, user, eventState, roomCode, completedEvents, allWinners });

  useEffect(() => { 
    stateRef.current = { phase, gifts, participants, currentRoundIndex, timeLeft, user, eventState, roomCode, completedEvents, allWinners }; 
  }, [phase, gifts, participants, currentRoundIndex, timeLeft, user, eventState, roomCode, completedEvents, allWinners]);

  const broadcast = (payload: BroadcastEvent) => {
    if (supabaseChannelRef.current) {
        supabaseChannelRef.current.send({ type: 'broadcast', event: 'raffle_event', payload });
    }
  };

  const forceGlobalSync = (overrides?: any) => {
    const cs = stateRef.current;
    if (cs.user.isAdmin) {
      broadcast({
        type: 'SYNC_RESPONSE',
        phase: overrides?.phase || cs.phase,
        gifts: overrides?.gifts || cs.gifts,
        participants: overrides?.participants || cs.participants,
        currentRoundIndex: overrides?.currentRoundIndex ?? cs.currentRoundIndex,
        timeLeft: overrides?.timeLeft ?? cs.timeLeft,
        eventState: overrides?.eventState || cs.eventState || undefined
      });
    }
  };

  const handleIncomingMessage = (payload: BroadcastEvent) => {
    const cs = stateRef.current;
    switch (payload.type) {
      case 'PHASE_CHANGE':
        setPhase(payload.phase);
        if (payload.gifts) setGifts(payload.gifts);
        if (payload.currentRoundIndex !== undefined) setCurrentRoundIndex(payload.currentRoundIndex);
        if (payload.eventState) setEventState(payload.eventState);
        break;
      case 'PLAYER_JOIN':
        const updatedList = Array.from(new Set([...cs.participants, payload.name]));
        setParticipants(updatedList);
        if (cs.user.isAdmin) forceGlobalSync({ participants: updatedList });
        break;
      case 'PLACE_BET':
        handleIncomingBet(payload.giftId, payload.userName, payload.amount);
        break;
      case 'GIFT_UPDATE':
        setGifts(prev => prev.map(g => g.id === payload.gift.id ? payload.gift : g));
        if (payload.gift.winners) setAllWinners(prev => Array.from(new Set([...prev, ...(payload.gift.winners || [])])));
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
        handleEventOutcome(payload.success);
        break;
      case 'SYNC_REQUEST':
         if (cs.user.isAdmin) forceGlobalSync();
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
      case 'EVENT_STEP_UPDATE':
        setEventState(payload.eventState);
        break;
    }
  };

  const handleEventOutcome = (success: boolean) => {
    setPhase(AppPhase.ROUND_REVEAL);
    setEventState(null);
    if (success) {
        setUser(prev => ({ ...prev, remainingPoints: prev.remainingPoints + 2 }));
    }
  };

  const initConnection = (code: string): Promise<void> => {
    return new Promise((resolve) => {
        if (!supabase) { resolve(); return; }
        const sbChannel = supabase.channel(`raffle_room_${code}`, { config: { broadcast: { self: false } } });
        sbChannel.on('broadcast', { event: 'raffle_event' }, ({ payload }: { payload: BroadcastEvent }) => handleIncomingMessage(payload))
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') { setIsConnected(true); supabaseChannelRef.current = sbChannel; }
            resolve();
        });
    });
  };

  const handleIncomingBet = (giftId: string, userName: string, amount: number) => {
    setGifts(prev => {
        const idx = prev.findIndex(g => g.id === giftId);
        if (idx === -1) return prev;
        const updated = [...prev];
        const gift = { ...updated[idx] };
        const newAlloc = [...gift.allocations];
        const eIdx = newAlloc.findIndex(a => a.userName === userName);
        if (eIdx > -1) {
             newAlloc[eIdx].points = Math.max(0, newAlloc[eIdx].points + amount);
             if (newAlloc[eIdx].points === 0) newAlloc.splice(eIdx, 1);
        } else if (amount > 0) {
            newAlloc.push({ userName, points: amount, isCurrentUser: false });
        }
        gift.allocations = newAlloc;
        gift.totalPoints = newAlloc.reduce((acc, curr) => acc + curr.points, 0);
        updated[idx] = gift;
        return updated;
    });
  };

  useEffect(() => {
    let interval: any;
    if (user.isAdmin && phase === AppPhase.ROUND_ACTIVE) {
        interval = setInterval(() => {
            setTimeLeft(prev => {
                const newVal = prev - 1;
                broadcast({ type: 'TIMER_UPDATE', timeLeft: newVal });
                if (newVal <= 0) { 
                  clearInterval(interval); 
                  setPhase(AppPhase.ROUND_LOCKED); 
                  broadcast({ type: 'PHASE_CHANGE', phase: AppPhase.ROUND_LOCKED }); 
                  return 0; 
                }
                return newVal;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [user.isAdmin, phase]);

  const handleJoin = async () => {
    if (!userInputName.trim() || roomCode.length !== 4) return;
    setUser({ ...user, name: userInputName, isAdmin: false });
    setPhase(AppPhase.WAITING);
    await initConnection(roomCode);
    broadcast({ type: 'PLAYER_JOIN', name: userInputName });
    broadcast({ type: 'SYNC_REQUEST' });
  };

  const handleCreateAdmin = async () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomCode(code);
    setUser({ name: 'Root Admin', totalPoints: 0, remainingPoints: 0, isAdmin: true });
    setParticipants(['Root Admin']);
    setPhase(AppPhase.WAITING);
    await initConnection(code);
  };

  const handleStartGame = async () => {
    setPhase(AppPhase.LOADING_GIFTS);
    const prizes = getStaticPrizes();
    const shuffled = [...prizes].sort(() => Math.random() - 0.5);
    const newGifts: Gift[] = shuffled.map((p, i) => ({
      id: `gift-${i}`,
      hiddenName: `BATCH_${(i + 1).toString().padStart(2, '0')}`,
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

  const handleAdminReveal = (giftId: string) => {
    if (!user.isAdmin) return;
    if (phase !== AppPhase.ROUND_REVEAL) { 
      setPhase(AppPhase.ROUND_REVEAL); 
      broadcast({ type: 'PHASE_CHANGE', phase: AppPhase.ROUND_REVEAL }); 
    }
    setGifts(prev => {
      const idx = prev.findIndex(g => g.id === giftId);
      const updated = [...prev];
      const gift = { ...updated[idx] };
      if (!gift.isContentRevealed) gift.isContentRevealed = true;
      else if (!gift.isWinnerRevealed) { 
        gift.winners = selectWinners(gift, gift.packs, allWinners); 
        gift.isWinnerRevealed = true; 
      }
      updated[idx] = gift;
      broadcast({ type: 'GIFT_UPDATE', gift });
      return updated;
    });
  };

  const currentGift = gifts[currentRoundIndex];

  const handleAllocate = (giftId: string, amount: number) => {
    if (phase !== AppPhase.ROUND_ACTIVE) return;
    if (amount > 0 && user.remainingPoints <= 0) return;
    
    const targetGift = gifts.find(g => g.id === giftId);
    const currentAlloc = targetGift?.allocations.find(a => a.userName === user.name);
    if (amount < 0 && (!currentAlloc || currentAlloc.points <= 0)) return;

    handleIncomingBet(giftId, user.name, amount);
    setUser(prev => ({ ...prev, remainingPoints: prev.remainingPoints - amount }));
    broadcast({ type: 'PLACE_BET', giftId, userName: user.name, amount });
  };

  const handleSpinRoulette = () => {
    if (!user.isAdmin || !eventState) return;
    const activeParticipants = participants.filter(p => p !== 'Root Admin');
    if (activeParticipants.length === 0) return;
    const winner = activeParticipants[Math.floor(Math.random() * activeParticipants.length)];
    const newState: EventState = { ...eventState, step: 'ACTION', targetUser: winner };
    setEventState(newState);
    broadcast({ type: 'EVENT_STEP_UPDATE', eventState: newState });
  };

  const handleResolveEvent = (success: boolean) => {
    if (!user.isAdmin) return;
    broadcast({ type: 'EVENT_RESOLVED', success });
    handleEventOutcome(success);
  };

  const handleNextRound = () => {
    if (currentRoundIndex + 1 < gifts.length) {
      const nextIndex = currentRoundIndex + 1;
      if (TRIGGER_INDICES.includes(nextIndex)) {
        const eventType = AUTO_EVENTS[TRIGGER_INDICES.indexOf(nextIndex)];
        const newEvent: EventState = { type: eventType, step: 'STORY' };
        setEventState(newEvent);
        setPhase(AppPhase.EVENT_NARRATIVE);
        broadcast({ type: 'PHASE_CHANGE', phase: AppPhase.EVENT_NARRATIVE, eventState: newEvent, currentRoundIndex: nextIndex });
      } else {
        setCurrentRoundIndex(nextIndex);
        setPhase(AppPhase.ROUND_WAITING);
        broadcast({ type: 'ROUND_CHANGE', roundIndex: nextIndex });
      }
    } else {
      setPhase(AppPhase.FINISHED);
      broadcast({ type: 'PHASE_CHANGE', phase: AppPhase.FINISHED });
    }
  };

  if (phase === AppPhase.LOGIN) {
     return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black">
          <div className="w-full max-w-xl">
             <div className="bg-black border-[4px] border-white p-12 text-center">
                 <h2 className="text-5xl font-black text-white uppercase mb-12 leading-none">Niche<br/>Xmas Giveaway</h2>
                 {!loginMode ? (
                   <div className="flex flex-col gap-6">
                      <button onClick={() => setLoginMode('USER')} className="bg-white text-black py-8 font-black uppercase text-xl border-[4px] border-white">Entrar como Participante</button>
                      <button onClick={() => setLoginMode('ADMIN')} className="bg-black text-white py-8 font-black uppercase text-xl border-[4px] border-white">Crear Sala (Admin)</button>
                   </div>
                 ) : loginMode === 'USER' ? (
                   <div className="space-y-6">
                      <input type="text" value={userInputName} onChange={(e) => setUserInputName(e.target.value)} placeholder="NOMBRE" className="w-full bg-black border-[4px] border-white p-6 text-xl font-black text-white uppercase placeholder:text-white/20"/>
                      <input type="text" maxLength={4} value={roomCode} onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))} placeholder="CÓDIGO" className="w-full bg-black border-[4px] border-white p-6 text-4xl font-black text-center text-white tracking-[0.5em]"/>
                      <button onClick={handleJoin} className="w-full bg-white text-black py-8 font-black uppercase text-xl">Conectarse</button>
                      <button onClick={() => setLoginMode(null)} className="text-white/50 uppercase font-bold text-sm">Volver</button>
                   </div>
                 ) : (
                   <div className="space-y-8">
                      <p className="text-white text-xl font-black uppercase">¿Generar nueva sala de sorteo?</p>
                      <button onClick={handleCreateAdmin} className="w-full bg-white text-black py-8 font-black uppercase text-xl">Generar Sala Root</button>
                      <button onClick={() => setLoginMode(null)} className="text-white/50 uppercase font-bold text-sm">Cancelar</button>
                   </div>
                 )}
             </div>
          </div>
        </div>
      );
  }

  if (phase === AppPhase.FINISHED) {
    return (
      <div className="min-h-screen bg-black p-12 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center bg-white text-black p-10 border-[6px] border-white">
                  <h1 className="text-7xl font-black uppercase leading-none mb-4">Informe Final</h1>
                  <p className="text-xl font-bold uppercase tracking-widest">Protocolo de Distribución Completado</p>
              </div>
              <div className="grid gap-6">
                  {gifts.map((g, i) => (
                      <div key={i} className="border-[4px] border-white p-8 flex items-center gap-8">
                          <div className="text-7xl">{g.emoji}</div>
                          <div className="flex-1">
                              <h3 className="text-3xl font-black uppercase text-white">{g.revealedName}</h3>
                              <div className="flex flex-wrap gap-3 mt-4">
                                  {g.winners?.map((w, j) => (
                                      <span key={j} className="bg-white text-black px-4 py-2 font-black uppercase text-lg">{w}</span>
                                  ))}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
              <button onClick={() => window.location.reload()} className="w-full bg-white text-black py-8 font-black uppercase text-2xl border-[6px] border-white">Reiniciar Sistema</button>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {eventState && <EventOverlay eventState={eventState} isAdmin={user.isAdmin} participants={participants} onSpinRoulette={handleSpinRoulette} onResolve={handleResolveEvent} />}
      
      <header className="bg-white text-black px-8 py-6 flex items-center justify-between shrink-0 border-b-[6px] border-black">
          <div className="flex items-center gap-4">
              <FlaskConical size={32} />
              <span className="text-4xl font-black uppercase tracking-tighter">Niche Beauty Lab</span>
          </div>
          <div className="flex items-center gap-6">
              <div className="text-2xl font-black font-mono border-[3px] border-black px-6 py-2">SALA: {roomCode}</div>
              {isConnected ? <Wifi size={24} /> : <WifiOff size={24} className="text-red-600" />}
          </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
          {phase === AppPhase.WAITING ? (
              <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 items-stretch h-full">
                  <div className="flex-1 bg-black border-[6px] border-white p-16 text-center flex flex-col justify-center">
                      <span className="text-xl font-black uppercase tracking-[0.5em] text-white/40 block mb-6">Código de Acceso</span>
                      <h2 className="text-[160px] font-black leading-none mb-10">{roomCode}</h2>
                      <div className="flex justify-center mb-10">
                         <div className="w-64 h-64 bg-white p-4 border-[6px] border-white">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}`} className="w-full h-full" alt="QR"/>
                         </div>
                      </div>
                      {user.isAdmin && (
                        <button onClick={handleStartGame} className="w-full bg-white text-black py-10 text-3xl font-black uppercase border-[6px] border-white">Empezar Sorteo</button>
                      )}
                  </div>
                  
                  {/* Recuento de participantes para el Lobby */}
                  <div className="w-full lg:w-96 bg-black border-[6px] border-white p-8 flex flex-col">
                      <div className="flex justify-between items-center mb-6 border-b-[3px] border-white pb-4">
                         <span className="text-xl font-black uppercase">Participantes</span>
                         <span className="bg-white text-black px-3 py-1 font-black text-2xl">{participants.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                         {participants.filter(p => p !== 'Root Admin').map((p, i) => (
                            <div key={i} className="border-[3px] border-white p-4 font-black uppercase text-lg text-white">
                               {p}
                            </div>
                         ))}
                         {participants.filter(p => p !== 'Root Admin').length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                               <Users size={48} className="mb-4" />
                               <span className="font-black uppercase tracking-widest text-sm">Esperando terminales...</span>
                            </div>
                         )}
                      </div>
                  </div>
              </div>
          ) : phase === AppPhase.LOADING_GIFTS ? (
              <div className="text-center space-y-8">
                  <Loader2 className="animate-spin mx-auto text-white" size={100} />
                  <span className="text-2xl font-black uppercase tracking-[0.5em]">Compilando Datos...</span>
              </div>
          ) : (
             <div className="w-full h-full">
                {currentGift && (
                  <GiftCard 
                    gift={currentGift} 
                    userPointsAllocated={currentGift.allocations.find(a => a.userName === user.name)?.points || 0} 
                    phase={phase} 
                    canAllocate={user.remainingPoints > 0} 
                    remainingUserCredits={user.remainingPoints} 
                    timeLeft={timeLeft} 
                    isAdmin={user.isAdmin} 
                    onAllocate={handleAllocate} 
                    onAdminReveal={handleAdminReveal} 
                    currentUserName={user.name} 
                  />
                )}
             </div>
          )}
      </main>

      {user.isAdmin && currentGift && (
        <footer className="bg-white text-black p-6 border-t-[6px] border-black flex justify-between items-center">
            <div className="text-2xl font-black uppercase">Lote {(currentRoundIndex + 1)} de {gifts.length}</div>
            <div className="flex gap-4">
                {phase === AppPhase.ROUND_WAITING && (
                  <button onClick={() => { setPhase(AppPhase.ROUND_ACTIVE); broadcast({ type: 'PHASE_CHANGE', phase: AppPhase.ROUND_ACTIVE }); }} className="bg-black text-white px-10 py-4 font-black uppercase text-xl">Abrir Rifa</button>
                )}
                {phase === AppPhase.ROUND_ACTIVE && (
                  <button onClick={() => { setPhase(AppPhase.ROUND_LOCKED); broadcast({ type: 'PHASE_CHANGE', phase: AppPhase.ROUND_LOCKED }); }} className="bg-black text-white px-10 py-4 font-black uppercase text-xl">Cerrar Rifa</button>
                )}
                {(phase === AppPhase.ROUND_LOCKED || phase === AppPhase.ROUND_REVEAL) && (
                    <div className="flex gap-4">
                        {!currentGift.isContentRevealed && <button onClick={() => handleAdminReveal(currentGift.id)} className="bg-black text-white px-10 py-4 font-black uppercase text-xl">Revelar Contenido</button>}
                        {currentGift.isContentRevealed && !currentGift.isWinnerRevealed && <button onClick={() => handleAdminReveal(currentGift.id)} className="bg-black text-white px-10 py-4 font-black uppercase text-xl">Sacar Ganadores</button>}
                        {currentGift.isWinnerRevealed && <button onClick={handleNextRound} className="bg-black text-white px-10 py-4 font-black uppercase text-xl">Siguiente Lote</button>}
                    </div>
                )}
            </div>
        </footer>
      )}
    </div>
  );
};

export default App;
