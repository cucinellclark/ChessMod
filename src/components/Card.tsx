import React from 'react';
import { Card } from '../types/cards';
import './Card.css';

interface CardProps {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
}

export const CardComponent: React.FC<CardProps> = ({ card, onClick, disabled }) => {
  return (
    <div
      className={`card ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="card-header">
        <h3>{card.name}</h3>
      </div>
      <div className="card-body">
        <p>{card.description}</p>
      </div>
    </div>
  );
};

