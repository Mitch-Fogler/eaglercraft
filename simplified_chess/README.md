# Chess Game

A chess game with Stockfish AI and multiplayer functionality. This project allows you to:

- Play against Stockfish AI with adjustable difficulty levels
- Play with another player on the same network
- Play over the board (two players on the same computer)

## Features

- Multiple game modes:
  - Play against Stockfish AI with adjustable skill levels
  - Play with another player on the same network
  - Play over the board
  - Watch Stockfish play against itself
- Customizable Stockfish settings (skill level and thinking time)
- Real-time multiplayer using Socket.io
- Clean and simple UI

## Installation

1. Clone this repository:
```
git clone https://github.com/yourusername/chess-game.git
cd chess-game
```

2. Install dependencies:
```
npm install
```

3. Start the server:
```
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Playing Against Stockfish

1. Select "Play with the computer" from the game modes
2. Adjust the skill level (0-20) and thinking time
3. Start the game and play!

## Playing Multiplayer

1. One player creates a game by clicking "Create Game"
2. Share the generated game ID with the other player
3. The other player joins the game by clicking "Join Game" and entering the game ID
4. Play chess in real-time!

## Technologies Used

- HTML, CSS, JavaScript
- [Stockfish](https://stockfishchess.org/) - Chess engine
- [Socket.io](https://socket.io/) - Real-time communication
- [Express](https://expressjs.com/) - Web server

## License

This project is open source and available under the [MIT License](LICENSE).
