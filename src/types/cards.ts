export interface Card {
  id: string;
  name: string;
  description: string;
  effect: CardEffect;
}

export type CardEffect = 
  | { type: 'move_twice' }
  | { type: 'custom'; handler: string }; // For future extensibility

export interface CardHand {
  cards: Card[];
  maxSize: number;
}

