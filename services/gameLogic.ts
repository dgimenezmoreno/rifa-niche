
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

export const selectWinners = (gift: Gift, count: number): string[] => {
  if (gift.totalPoints === 0 || gift.allocations.length === 0) {
    return ["No Entries"];
  }

  const ticketPool: string[] = [];
  gift.allocations.forEach(allocation => {
    for (let i = 0; i < allocation.points; i++) {
      ticketPool.push(allocation.userName);
    }
  });

  const winners = new Set<string>();
  const safetyLimit = 100;
  let attempts = 0;

  // Intentar sacar ganadores únicos hasta llenar los packs
  while (winners.size < count && winners.size < gift.allocations.length && attempts < safetyLimit) {
    const winnerIndex = Math.floor(Math.random() * ticketPool.length);
    winners.add(ticketPool[winnerIndex]);
    attempts++;
  }

  return Array.from(winners);
};
