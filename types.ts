
export enum AppPhase {
  LOGIN = 'LOGIN',
  WAITING = 'WAITING',
  LOADING_GIFTS = 'LOADING_GIFTS',
  ROUND_WAITING = 'ROUND_WAITING',
  ROUND_ACTIVE = 'ROUND_ACTIVE',
  ROUND_LOCKED = 'ROUND_LOCKED',
  ROUND_REVEAL = 'ROUND_REVEAL',
  EVENT_NARRATIVE = 'EVENT_NARRATIVE',
  FINISHED = 'FINISHED'
}

export type EventType = 'CUTLERY' | 'ROBBERY';

export interface EventState {
  type: EventType;
  step: 'STORY' | 'ACTION'; // Aligned with implementation
  targetUser?: string;
  isSpinning?: boolean;
}

export interface AllocationRecord {
  userName: string;
  points: number;
  isCurrentUser: boolean;
}

export interface Gift {
  id: string;
  hiddenName: string;
  revealedName: string;
  description: string;
  emoji: string;
  totalPoints: number;
  packs: number;
  allocations: AllocationRecord[];
  winners?: string[];
  isContentRevealed: boolean;
  isWinnerRevealed: boolean;
}

export interface CurrentUser {
  name: string;
  totalPoints: number;
  remainingPoints: number;
  isAdmin: boolean;
}

export type BroadcastEvent = 
  | { type: 'PHASE_CHANGE'; phase: AppPhase; gifts?: Gift[]; currentRoundIndex?: number; eventState?: EventState }
  | { type: 'PLAYER_JOIN'; name: string }
  | { type: 'PLACE_BET'; giftId: string; userName: string }
  | { type: 'GIFT_UPDATE'; gift: Gift }
  | { type: 'TIMER_UPDATE'; timeLeft: number }
  | { type: 'ROUND_CHANGE'; roundIndex: number }
  | { type: 'SYNC_REQUEST' } 
  | { type: 'SYNC_RESPONSE'; phase: AppPhase; gifts: Gift[]; participants: string[]; currentRoundIndex: number; timeLeft: number; eventState?: EventState }
  | { type: 'EVENT_RESOLVED'; success: boolean }
  | { type: 'EVENT_STEP_UPDATE'; eventState: EventState };
