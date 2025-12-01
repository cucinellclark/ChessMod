import React from 'react';
import { Card } from '../types/cards';
import { CardComponent } from './Card';
import './CardHand.css';

interface CardHandProps {
  cards: Card[];
  onCardPlay: (cardId: string) => void;
  disabled?: boolean;
}

export const CardHand: React.FC<CardHandProps> = ({ cards, onCardPlay, disabled }) => {
  return (
    <div className="card-hand">
      <h3>Your Hand</h3>
      <div className="cards-container">
        {cards.map(card => (
          <CardComponent
            key={card.id}
            card={card}
            onClick={() => onCardPlay(card.id)}
            disabled={disabled}
          />
        ))}
        {cards.length === 0 && <p className="empty-hand">No cards in hand</p>}
      </div>
    </div>
  );
};

