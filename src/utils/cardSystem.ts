import { Card } from '../types/cards';

export class CardSystem {
  private deck: Card[];
  private playerHand: Card[];
  private aiHand: Card[];

  constructor() {
    this.deck = this.createDeck();
    this.playerHand = [];
    this.aiHand = [];
    this.shuffleDeck();
    this.initializeHands();
  }

  private createDeck(): Card[] {
    // For now, create a deck with multiple "Move Twice" cards
    // In the future, this can be expanded with different card types
    const cards: Card[] = [];
    for (let i = 0; i < 20; i++) {
      cards.push({
        id: `move_twice_${i}`,
        name: 'Double Move',
        description: 'Move a piece twice in one turn',
        effect: { type: 'move_twice' }
      });
    }
    return cards;
  }

  private shuffleDeck(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  private initializeHands(): void {
    // Draw 3 cards for each player at start
    for (let i = 0; i < 3; i++) {
      this.playerHand.push(this.drawCard());
      this.aiHand.push(this.drawCard());
    }
  }

  private drawCard(): Card {
    if (this.deck.length === 0) {
      // Reshuffle if deck is empty (in a real game, you might want different behavior)
      this.deck = this.createDeck();
      this.shuffleDeck();
    }
    return this.deck.pop()!;
  }

  drawCardForPlayer(): void {
    if (this.playerHand.length < 10) { // Max hand size
      this.playerHand.push(this.drawCard());
    }
  }

  drawCardForAI(): void {
    if (this.aiHand.length < 10) { // Max hand size
      this.aiHand.push(this.drawCard());
    }
  }

  getPlayerHand(): Card[] {
    return [...this.playerHand];
  }

  getAIHand(): Card[] {
    return [...this.aiHand];
  }

  playCard(cardId: string, isPlayer: boolean): Card | null {
    const hand = isPlayer ? this.playerHand : this.aiHand;
    const index = hand.findIndex(card => card.id === cardId);
    
    if (index === -1) return null;
    
    const card = hand.splice(index, 1)[0];
    return card;
  }

  getCardById(cardId: string): Card | null {
    const allCards = [...this.playerHand, ...this.aiHand, ...this.deck];
    return allCards.find(card => card.id === cardId) || null;
  }
}

