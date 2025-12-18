
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AppPhase, CurrentUser, Gift, BroadcastEvent, EventState } from './types';
import { GiftCard } from './components/GiftCard';
import { EventOverlay } from './components/EventOverlay';
import { getStaticPrizes } from './services/geminiService';
import { simulateRoundBets, selectWinners, BOT_NAMES } from './services/gameLogic';
import { 
  Play, ShieldCheck, Timer, ArrowRight, FlaskConical, 
  Dna, Beaker, Activity, Loader2, Users, Wifi, WifiOff
} from 'lucide-react';

// NOTA: Asegúrate de configurar estas variables en tu entorno para habilitar el tiempo real entre dispositivos.
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const ROUND_DURATION = 35; 
const INITIAL_CREDITS = 12;

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
  
  const supabaseChannelRef = useRef<any>(null);
  const localChannelRef = useRef<BroadcastChannel | null>(null);
  const stateRef = useRef({ phase, gifts, participants, currentRoundIndex, timeLeft, user, eventState, roomCode });

  const currentGift = gifts[currentRoundIndex];

  useEffect(() => { 
    stateRef.current = { phase, gifts, participants, currentRoundIndex, timeLeft, user, eventState, roomCode }; 
  }, [phase, gifts, participants, currentRoundIndex, timeLeft, user, eventState, roomCode]);

  const broadcast = (payload: BroadcastEvent) => {
    if (supabaseChannelRef.current) {
        supabaseChannelRef.current.send({ type: 'broadcast', event: 'raffle_event', payload });
    }
    if (localChannelRef.current) {
        localChannelRef.current.postMessage(payload);
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
      case 'EVENT_STEP_UPDATE':
        setEventState(payload.eventState);
        break;
      case 'PLAYER_JOIN':
        setParticipants(prev => {
            if (prev.includes(payload.name)) return prev;
            return [...prev, payload.name];
        });
        if (cs.user.isAdmin) {
            broadcast({
                type: 'SYNC_RESPONSE',
                phase: cs.phase,
                gifts: cs.gifts,
                participants: Array.from(new Set([...cs.participants, payload.name])),
                currentRoundIndex: cs.currentRoundIndex,
                timeLeft: cs.timeLeft,
                eventState: cs.eventState || undefined
            });
        }
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

  const initConnection = (code: string): Promise<void> => {
    return new Promise((resolve) => {
        const channelName = `raffle_room_${code}`;
        
        if (localChannelRef.current) localChannelRef.current.close();
        const localChannel = new BroadcastChannel(channelName);
        localChannel.onmessage = (event) => handleIncomingMessage(event.data);
        localChannelRef.current = localChannel;

        if (supabase) {
          if (supabaseChannelRef.current) supabase.removeChannel(supabaseChannelRef.current);
          const sbChannel = supabase.channel(channelName, { config: { broadcast: { self: false } } });
          
          sbChannel.on('broadcast', { event: 'raffle_event' }, ({ payload }: { payload: BroadcastEvent }) => {
            handleIncomingMessage(payload);
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              supabaseChannelRef.current = sbChannel;
              resolve();
            } else {
              setIsConnected(false);
              if (status === 'CHANNEL_ERROR') resolve(); // Fallback to local
            }
          });
        } else {
          setIsConnected(false);
          resolve();
        }
    });
  };

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

  const handleJoin = async () => {
    if (!userInputName.trim() || roomCode.length !== 4) return;
    setUser({ ...user, name: userInputName, isAdmin: false });
    setPhase(AppPhase.WAITING);
    await initConnection(roomCode);
    broadcast({ type: 'PLAYER_JOIN', name: userInputName });
    broadcast({ type: 'SYNC_REQUEST' });
  };

  const handleCreateAdmin = async () => {
    const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomCode(generatedCode);
    setUser({ name: 'Root Admin', totalPoints: 0, remainingPoints: 0, isAdmin: true });
    setPhase(AppPhase.WAITING);
    await initConnection(generatedCode);
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
        <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-[#0a0a0b] relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/5 blur-[150px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/5 blur-[150px] rounded-full pointer-events-none"></div>

          <div className="w-full max-w-2xl z-10">
             <div className="bg-[#18181b] border border-white/20 p-6 md:p-16 rounded-[40px] md:rounded-[60px] shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-700">
                 <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none hidden md:block"><FlaskConical size={300} /></div>
                 
                 <div className="text-center mb-8 md:mb-16">
                     <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] md:tracking-[0.8em] text-white/30 block mb-3 md:mb-6">Niche Beauty Lab Protocol</span>
                     <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-white uppercase leading-none">The<br/><span className="text-white/20">Active List</span></h2>
                 </div>

                 {!loginMode ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 animate-in fade-in zoom-in duration-500">
                      <button onClick={() => setLoginMode('USER')} className="group bg-[#27272a] hover:bg-white border border-white/10 p-6 md:p-10 rounded-[30px] md:rounded-[40px] transition-all duration-500 flex flex-col items-center gap-4 md:gap-6">
                         <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 group-hover:bg-black/5 rounded-2xl flex items-center justify-center transition-colors">
                            <Users size={24} className="text-white group-hover:text-black md:size-32" />
                         </div>
                         <div className="text-center">
                            <span className="block font-black uppercase tracking-widest text-[10px] md:text-xs mb-1 text-white group-hover:text-black">Unirse al Sorteo</span>
                            <span className="text-[8px] md:text-[9px] font-bold text-white/30 group-hover:text-black/40 uppercase tracking-widest">Soy Participante</span>
                         </div>
                      </button>

                      <button onClick={() => setLoginMode('ADMIN')} className="group bg-[#09090b] hover:bg-white border border-white/10 p-6 md:p-10 rounded-[30px] md:rounded-[40px] transition-all duration-500 flex flex-col items-center gap-4 md:gap-6">
                         <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 group-hover:bg-black/5 rounded-2xl flex items-center justify-center transition-colors">
                            <ShieldCheck size={24} className="text-white group-hover:text-black md:size-32" />
                         </div>
                         <div className="text-center">
                            <span className="block font-black uppercase tracking-widest text-[10px] md:text-xs mb-1 text-white group-hover:text-black">Crear Sorteo</span>
                            <span className="text-[8px] md:text-[9px] font-bold text-white/30 group-hover:text-black/40 uppercase tracking-widest">Acceso Root</span>
                         </div>
                      </button>
                   </div>
                 ) : loginMode === 'USER' ? (
                   <div className="space-y-6 md:space-y-12 animate-in slide-in-from-right duration-500">
                      <div className="space-y-4 md:space-y-8">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Tu Identidad</label>
                          <input type="text" value={userInputName} onChange={(e) => setUserInputName(e.target.value)} placeholder="NOMBRE Y APELLIDO" className="w-full bg-[#27272a] border border-white/10 rounded-2xl md:rounded-3xl px-6 py-4 md:px-8 md:py-6 text-base md:text-xl font-black focus:outline-none focus:border-white/40 transition-all placeholder:text-white/10 uppercase tracking-widest text-white"/>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Código de Sala (4 dígitos)</label>
                          <input type="text" maxLength={4} value={roomCode} onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))} placeholder="0 0 0 0" className="w-full bg-[#27272a] border border-white/10 rounded-2xl md:rounded-3xl px-6 py-4 md:px-8 md:py-6 text-xl md:text-3xl font-mono font-black text-center focus:outline-none focus:border-white/40 transition-all placeholder:text-white/10 tracking-[0.5em] md:tracking-[1em]"/>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button onClick={handleJoin} disabled={!userInputName.trim() || roomCode.length !== 4} className="w-full bg-white text-black h-16 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-between px-8 md:px-10 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] disabled:opacity-5 transition-all group">
                            <span className="font-black uppercase tracking-[0.1em] md:tracking-[0.3em] text-[10px]">Conectar Terminal</span>
                            <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                        <button onClick={() => setLoginMode(null)} className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors py-1">Volver</button>
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-8 md:space-y-10 animate-in slide-in-from-left duration-500 text-center">
                      <div className="bg-white/5 border border-white/10 p-6 md:p-10 rounded-[30px] md:rounded-[40px]">
                         <ShieldCheck size={40} className="mx-auto text-white/40 mb-4 md:mb-6" />
                         <p className="text-white font-bold text-sm md:text-lg uppercase tracking-widest leading-relaxed">¿Deseas iniciar un nuevo protocolo de sorteo?</p>
                         <p className="text-white/30 text-[8px] md:text-[10px] uppercase tracking-widest mt-3">Se generará un código de sala único para tus usuarios.</p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <button onClick={handleCreateAdmin} className="w-full bg-white text-black h-16 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-between px-8 md:px-10 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all group">
                            <span className="font-black uppercase tracking-[0.1em] md:tracking-[0.3em] text-[10px]">Generar Sala Root</span>
                            <Play size={18} fill="black" />
                        </button>
                        <button onClick={() => setLoginMode(null)} className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors py-1">Cancelar</button>
                      </div>
                   </div>
                 )}
             </div>
          </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-maison flex flex-col relative overflow-hidden">
      {eventState && (
        <EventOverlay 
          eventState={eventState}
          isAdmin={user.isAdmin}
          participants={participants}
          onSpinRoulette={handleSpinRoulette}
          onResolve={resolveEvent}
        />
      )}

      <header className="bg-[#18181b]/95 backdrop-blur-3xl border-b border-white/10 px-4 md:px-8 py-4 md:py-6 flex flex-row items-center justify-between z-40 shrink-0">
          <div className="flex items-center gap-2 md:gap-5">
              <div className="w-7 h-7 md:w-9 md:h-9 bg-white flex items-center justify-center rounded-lg shadow-lg shrink-0"><FlaskConical size={14} className="text-black md:size-18" /></div>
              <span className="font-bold tracking-tighter text-sm md:text-xl uppercase truncate max-w-[120px] md:max-w-none">Niche Beauty Lab</span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-8">
              <div className="flex items-center gap-2 md:gap-4 bg-white/5 border border-white/10 px-3 py-1.5 md:px-6 md:py-2.5 rounded-xl md:rounded-2xl shrink-0">
                  <span className="text-[8px] md:text-[9px] font-black text-white/30 uppercase tracking-[0.2em] md:tracking-[0.4em] hidden xs:inline">SALA</span>
                  <span className="text-xs md:text-lg font-mono font-black text-white tracking-[0.1em] md:tracking-[0.3em]">{roomCode}</span>
                  {isConnected ? <Wifi size={12} className="text-emerald-500 md:size-14" /> : <WifiOff size={12} className="text-red-500 animate-pulse md:size-14" />}
              </div>

              {!user.isAdmin && (
                <div className="flex items-center gap-3 md:gap-6 bg-[#27272a] px-3 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl border border-white/5 shadow-lg shrink-0">
                    <div className="flex gap-1 md:gap-1.5">
                        {[...Array(INITIAL_CREDITS)].map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 md:w-3 md:h-3 rounded-sm transition-all duration-500 ${i < user.remainingPoints ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'bg-white/5'}`}></div>
                        ))}
                    </div>
                </div>
              )}
          </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-12 flex flex-col items-center">
              {phase === AppPhase.WAITING ? (
                  <div className="w-full max-w-5xl animate-in fade-in duration-700">
                      <div className="grid lg:grid-cols-2 gap-6 md:gap-10">
                           <div className="bg-[#18181b] border border-white/10 rounded-[32px] md:rounded-[48px] p-8 md:p-16 flex flex-col justify-center text-left shadow-2xl relative overflow-hidden min-h-[250px] md:min-h-0">
                               <div className="absolute top-0 right-0 p-12 opacity-[0.02] hidden md:block"><Activity size={200} /></div>
                               <h1 className="text-3xl md:text-7xl font-black uppercase tracking-tighter mb-4 md:mb-8 leading-tight md:leading-none">
                                 {user.isAdmin ? "Control" : "Protocolo de<br/><span className='text-white/20'>Espera</span>"}
                               </h1>
                               <p className="text-white/40 text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] leading-relaxed max-w-sm mb-6 md:mb-12">
                                 {user.isAdmin 
                                    ? "Sistema de sala " + roomCode + " estabilizado. Indica el código a los participantes." 
                                    : "Conexión establecida con la sala " + roomCode + ". El laboratorio está procesando los activos."}
                               </p>
                               {user.isAdmin && (
                                 <button onClick={handleStartGame} className="bg-white text-black h-16 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-between px-8 md:px-10 hover:shadow-2xl transition-all group">
                                     <span className="font-black uppercase tracking-widest text-[10px]">Iniciar Protocolo</span>
                                     <Play size={18} fill="black" />
                                 </button>
                               )}
                           </div>
                           <div className="bg-[#27272a] border border-white/10 rounded-[32px] md:rounded-[48px] p-8 md:p-16 shadow-xl relative overflow-hidden">
                               <div className="absolute top-0 right-0 p-8 opacity-5 hidden md:block"><Beaker size={100} /></div>
                               <div className="flex justify-between items-center mb-6 md:mb-10">
                                   <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.5em] text-white/30">Personal en Sala</span>
                                   <span className="text-3xl md:text-5xl font-mono text-white/60 tracking-tighter">{participants.length}</span>
                               </div>
                               <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 md:gap-3">
                                   {participants.slice(0, 10).map((p, i) => (
                                       <div key={i} className="py-2.5 px-4 bg-white/5 border border-white/5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/50 truncate">{p}</div>
                                   ))}
                                   {participants.length > 10 && <div className="py-2.5 px-4 text-[9px] md:text-[10px] text-white/20 italic">+{participants.length - 10} más...</div>}
                               </div>
                           </div>
                      </div>
                  </div>
              ) : phase === AppPhase.LOADING_GIFTS ? (
                  <div className="flex flex-col items-center justify-center h-full">
                      <Loader2 className="animate-spin text-white/40 mb-8" size={48} strokeWidth={1} />
                      <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/30">Sintetizando activos de I+D</span>
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
                            currentUserName={user.name}
                        />
                    ) : (
                        <div className="text-center bg-[#18181b] border border-white/20 p-12 md:p-24 rounded-[32px] md:rounded-[48px] max-w-2xl mx-auto shadow-2xl">
                            <Dna size={40} className="mx-auto mb-6 md:mb-8 text-white/20" />
                            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 md:mb-8 leading-none">Protocolo<br/><span className="text-white/10">Finalizado</span></h2>
                            <p className="mb-8 md:mb-12 text-[9px] md:text-[10px] text-white/40 uppercase tracking-[0.3em] md:tracking-[0.4em]">Todos los activos han sido asignados correctamente.</p>
                            <button onClick={() => window.location.reload()} className="bg-white text-black px-8 py-4 md:px-12 md:py-6 rounded-2xl font-bold uppercase tracking-widest text-[9px] md:text-[10px] hover:scale-105 transition-all">Reiniciar Terminal</button>
                        </div>
                    )}
                </div>
              )}
          </main>
      </div>

      {user.isAdmin && currentGift && (
          <div className="bg-[#18181b] border-t border-white/20 p-4 md:p-6 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] shrink-0 overflow-x-auto">
              <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-4 min-w-[500px] md:min-w-0">
                  <div className="flex flex-row items-center gap-4 md:gap-10">
                      <div>
                          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-white/30 mb-0.5 block">Campaña Activa</span>
                          <span className="text-white font-mono text-xs md:text-sm font-bold uppercase">Lote {(currentRoundIndex + 1).toString().padStart(2, '0')} / {gifts.length}</span>
                      </div>
                      <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>
                      <div className="flex gap-2">
                          <button onClick={() => triggerEvent('CUTLERY')} className="whitespace-nowrap bg-orange-500/10 border border-orange-500/30 text-orange-500 px-3 md:px-5 h-9 md:h-10 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition-all">Protocolo Cocina</button>
                          <button onClick={() => triggerEvent('ROBBERY')} className="whitespace-nowrap bg-red-600/10 border border-red-600/30 text-red-600 px-3 md:px-5 h-9 md:h-10 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-red-600/20 transition-all">Protocolo Robo</button>
                      </div>
                  </div>

                  <div className="flex gap-2 md:gap-3">
                      {phase === AppPhase.ROUND_WAITING && (
                        <button onClick={handleStartRound} className="whitespace-nowrap bg-white text-black px-6 md:px-10 h-10 md:h-12 rounded-xl md:rounded-[20px] text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 hover:scale-105 transition-all shadow-lg">
                            <Timer size={14} /> Abrir Formulación
                        </button>
                      )}
                      {phase === AppPhase.ROUND_ACTIVE && (
                        <button onClick={handleRoundLock} className="whitespace-nowrap bg-red-600 text-white px-6 md:px-10 h-10 md:h-12 rounded-xl md:rounded-[20px] text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 hover:bg-red-500 transition-all shadow-lg">
                            Cerrar Lote
                        </button>
                      )}
                      {(phase === AppPhase.ROUND_LOCKED || phase === AppPhase.ROUND_REVEAL) && (
                           <div className="flex gap-2 md:gap-3">
                               {!currentGift.isContentRevealed && (
                                 <button onClick={() => handleAdminReveal(currentGift.id)} className="whitespace-nowrap bg-white text-black px-6 md:px-10 h-10 md:h-12 rounded-xl md:rounded-[20px] text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg">Revelar Lote</button>
                               )}
                               {currentGift.isContentRevealed && !currentGift.isWinnerRevealed && (
                                 <button onClick={() => handleAdminReveal(currentGift.id)} className="whitespace-nowrap bg-white text-black px-6 md:px-10 h-10 md:h-12 rounded-xl md:rounded-[20px] text-[9px] md:text-[10px] font-black uppercase tracking-widest animate-pulse shadow-xl">Publicar Ganadores</button>
                               )}
                               {currentGift.isWinnerRevealed && (
                                 <button onClick={handleNextRound} className="whitespace-nowrap bg-white text-black px-6 md:px-10 h-10 md:h-12 rounded-xl md:rounded-[20px] text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 shadow-lg">Siguiente Lote <ArrowRight size={14} /></button>
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
