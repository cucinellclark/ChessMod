import { CardEffect } from '../types/cards';

export interface CardTemplate {
  name: string;
  description: string;
  effect: CardEffect;
  count: number; // Number of copies in the deck
}

// Card Templates - All card definitions in one place
export const CARD_TEMPLATES: CardTemplate[] = [
  {
    name: 'Double Move',
    description: 'Move a piece twice in one turn',
    effect: { type: 'move_twice' },
    count: 8
  },
  {
    name: 'Teleport',
    description: 'Move any piece to any empty square',
    effect: { type: 'teleport' },
    count: 6
  },
  {
    name: 'Swap',
    description: 'Swap positions of two friendly pieces',
    effect: { type: 'swap_pieces' },
    count: 5
  },
  {
    name: 'Shield',
    description: 'Make a piece immune to capture for 2 turns',
    effect: { type: 'protect_piece', duration: 2 },
    count: 4
  },
  {
    name: 'Time Warp',
    description: 'Get an additional turn after this one',
    effect: { type: 'extra_turn' },
    count: 3
  }
];

// Helper function to get all card templates
export function getAllCardTemplates(): CardTemplate[] {
  return [...CARD_TEMPLATES];
}

// Helper function to get total deck size
export function getTotalDeckSize(): number {
  return CARD_TEMPLATES.reduce((sum, template) => sum + template.count, 0);
}
