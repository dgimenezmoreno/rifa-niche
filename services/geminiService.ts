
import { Gift } from "../types";

const PRIZE_LIST = [
  { name: "Nail Kit by Neonail", packs: 1, emoji: "💅" },
  { name: "Weekend Getaway by Weekendesk (2pax)", packs: 1, emoji: "✈️" },
  { name: "Jewellery Set by LolaBola", packs: 3, emoji: "💎" },
  { name: "Haircare Set by MonchoMoreno", packs: 3, emoji: "💇‍♀️" },
  { name: "Surprise Box by Niche Beauty Lab", packs: 3, emoji: "✨" },
  { name: "Hair & Body Set", packs: 5, emoji: "🚿" },
  { name: "Spa Day by Nobu (2pax)", packs: 1, emoji: "💆‍♂️" },
  { name: "Chocolate Lover by Lindt", packs: 6, emoji: "🍫" },
  { name: "Gourmet Experience by Pepina Pastel", packs: 4, emoji: "🍰" },
  { name: "Wearable Box by DCU", packs: 1, emoji: "⌚" },
  { name: "Long Dream Hair Set by Olistic", packs: 2, emoji: "🌿" },
  { name: "Sunglasses by Meller", packs: 5, emoji: "🕶️" },
  { name: "Gift Card for Tolrastudio (€50)", packs: 3, emoji: "🎫" },
  { name: "Entradas cine", packs: 3, emoji: "🎬" },
  { name: "Makeup by 3ina", packs: 4, emoji: "🎨" },
  { name: "TOUS", packs: 4, emoji: "🧸" }
];

export const getStaticPrizes = (): Partial<Gift>[] => {
  return PRIZE_LIST.map(p => ({
    revealedName: p.name,
    description: `Pack exclusivo de edición limitada. Unidades disponibles: ${p.packs}`,
    emoji: p.emoji,
    packs: p.packs
  }));
};
