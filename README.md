# ChessMod

A chess game with card-based modifiers built with React, TypeScript, and Vite.

## Features

- **Chess Game**: Full chess implementation with standard rules
- **Card System**: Draw cards at the start and each turn to modify gameplay
- **Move Twice Card**: Special card that allows a piece to move twice in one turn
- **AI Opponent**: Play against a computer opponent
- **Move History**: Track all moves with undo functionality
- **Game Timer**: Track time for each player
- **Modern UI**: Clean, responsive interface with ASCII piece rendering (ready for graphics upgrade)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## How to Play

1. **Starting the Game**: You play as White, the AI plays as Black
2. **Drawing Cards**: You start with 3 cards and draw 1 card each turn
3. **Playing Cards**: Click on a card in your hand to activate it (e.g., "Double Move" allows a piece to move twice)
4. **Making Moves**: Click on a piece to select it, then click on a valid destination square
5. **Undo**: Use the undo button in the move history to take back your last move
6. **Timer**: The game includes a timer for each player (10 minutes per player)

## Project Structure

```
src/
├── components/     # React components (Board, Cards, Timer, etc.)
├── types/         # TypeScript type definitions
├── utils/         # Game logic (Chess Engine, AI, Card System, Game State)
├── App.tsx        # Main application component
└── main.tsx       # Application entry point
```

## Future Enhancements

- More card types with different effects
- Improved AI with minimax algorithm
- PvP multiplayer support
- Save/load game functionality
- Replace ASCII pieces with graphics
- Additional game modifications

## Development

The project uses:
- **React 18** for the UI
- **TypeScript** for type safety
- **Vite** for fast development and building
- Component-based architecture for easy extensibility

