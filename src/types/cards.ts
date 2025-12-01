export interface Card {
  id: string;
  name: string;
  description: string;
  effect: CardEffect;
}

export type CardEffect = 
  | { type: 'move_twice' }
  | { type: 'teleport'; maxDistance?: number } // Move any piece to any empty square
  | { type: 'swap_pieces' } // Swap positions of two friendly pieces
  | { type: 'protect_piece'; duration: number } // Make a piece immune to capture for N turns
  | { type: 'extra_turn' } // Get an additional turn after this one
  | { type: 'custom'; handler: string }; // For future extensibility

export interface CardHand {
  cards: Card[];
  maxSize: number;
}

