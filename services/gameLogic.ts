
import { Gift } from "../types";

export const BOT_NAMES = [
  "Alice", "Bob", "Charlie", "Diana", "Evan", "Fiona", "George", "Hannah", 
  "Ian", "Julia", "Kevin", "Liam", "Mia", "Noah", "Olivia", "Parker", 
  "Quinn", "Ryan", "Sophia", "Thomas", "Uma", "Victor", "Wendy", "Xander", "Yara", "Zack"
];

export const simulateRoundBets = (currentGift: Gift): string[] => {
  const botsToBet: string[] = [];
  BOT_NAMES.forEach(botName => {
    const existingAllocation = currentGift.allocations.find(a => a.userName === botName);
    const currentPoints = existingAllocation ? existingAllocation.points : 0;
    
    let shouldBet = false;
    if (currentPoints === 0) {
        shouldBet = Math.random() < 0.08; 
    } else if (currentPoints < 2) {
        shouldBet = Math.random() < 0.15; 
    }
      
    if (shouldBet) botsToBet.push(botName);
  });
  return botsToBet;
};

/**
 * Selecciona ganadores basándose en pesos.
 * Si un usuario ya ha ganado (está en previousWinners), sus puntos valen mucho menos (probabilidad reducida).
 */
export const selectWinners = (gift: Gift, count: number, previousWinners: string[] = []): string[] => {
  if (gift.totalPoints === 0 || gift.allocations.length === 0) {
    return ["No Entries"];
  }

  const ticketPool: string[] = [];
  gift.allocations.forEach(allocation => {
    const hasWonBefore = previousWinners.includes(allocation.userName);
    // Si ha ganado antes, le damos 1 ticket por punto.
    // Si NO ha ganado antes, le damos 10 tickets por punto (10x más probabilidad).
    const multiplier = hasWonBefore ? 1 : 10;
    
    for (let i = 0; i < (allocation.points * multiplier); i++) {
      ticketPool.push(allocation.userName);
    }
  });

  const winners = new Set<string>();
  const safetyLimit = 500;
  let attempts = 0;

  // Intentar sacar ganadores únicos hasta llenar los packs
  const maxPossibleWinners = Math.min(count, gift.allocations.length);
  
  while (winners.size < maxPossibleWinners && attempts < safetyLimit) {
    const winnerIndex = Math.floor(Math.random() * ticketPool.length);
    const selected = ticketPool[winnerIndex];
    if (selected) {
        winners.add(selected);
    }
    attempts++;
  }

  return Array.from(winners);
};
