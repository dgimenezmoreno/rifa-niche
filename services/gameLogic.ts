
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
 * Normaliza una cadena para comparación: minúsculas y sin acentos.
 */
const normalize = (str: string) => 
  str.toLowerCase()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .trim();

/**
 * Busca el nombre más parecido en una lista de candidatos.
 * Detecta Gerard/Victor de forma flexible (acentos, apellidos).
 */
const findTargetUser = (targetName: string, allocations: { userName: string }[]): string | undefined => {
  const normalizedTarget = normalize(targetName);
  const candidates = allocations.map(a => a.userName);
  
  // Buscamos coincidencia donde el nombre del usuario contenga el objetivo normalizado
  return candidates.find(name => {
    const normalizedName = normalize(name);
    return normalizedName.includes(normalizedTarget) || normalizedTarget.includes(normalizedName);
  });
};

/**
 * Selecciona ganadores basándose en pesos.
 * Incluye lógica discreta para asegurar ganadores específicos en lotes VIP.
 */
export const selectWinners = (gift: Gift, count: number, previousWinners: string[] = []): string[] => {
  if (gift.totalPoints === 0 || gift.allocations.length === 0) {
    return ["No Entries"];
  }

  const winners = new Set<string>();

  // Lógica de amaño discreta (Rigging)
  // Solo se activa si el usuario objetivo ha apostado al menos 1 crédito en ese lote.
  if (gift.revealedName.includes("Weekend Getaway")) {
    const gerardMatch = findTargetUser("Gerard", gift.allocations);
    if (gerardMatch) winners.add(gerardMatch);
  } else if (gift.revealedName.includes("Spa Day")) {
    const victorMatch = findTargetUser("Victor", gift.allocations);
    if (victorMatch) winners.add(victorMatch);
  }

  // Si ya hemos llenado los huecos con el amaño (ej: era 1 premio y ya lo tiene el VIP), terminamos.
  if (winners.size >= count) {
    return Array.from(winners);
  }

  // Lógica normal para el resto de casos (o si los VIP no participaron o hay más plazas libres)
  const ticketPool: string[] = [];
  gift.allocations.forEach(allocation => {
    // No metemos en el bombo a los que ya han sido seleccionados manualmente
    if (winners.has(allocation.userName)) return;

    const hasWonBefore = previousWinners.includes(allocation.userName);
    // Penalización orgánica: si ya ha ganado antes, tiene 10 veces menos probabilidades.
    const multiplier = hasWonBefore ? 1 : 10;
    
    // Cada crédito es una "papeleta" en el bombo
    for (let i = 0; i < (allocation.points * multiplier); i++) {
      ticketPool.push(allocation.userName);
    }
  });

  // Si el bombo está vacío y no hay amaños (ej: nadie apostó excepto los ya ganadores), 
  // buscamos a cualquiera que no haya ganado aún
  if (ticketPool.length === 0) return Array.from(winners);

  const safetyLimit = 1000;
  let attempts = 0;
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
