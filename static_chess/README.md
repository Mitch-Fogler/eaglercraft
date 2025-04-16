# Chess Game for GitHub Pages

A static chess game with Stockfish AI integration. This version is specifically designed to work on GitHub Pages without requiring a backend server.

## Features

- Play against Stockfish AI with adjustable difficulty levels (0-20)
- Adjust Stockfish thinking time
- Play over the board (two players on the same computer)
- Watch Stockfish play against itself
- Clean and intuitive UI

## How to Use

1. Choose a game mode:
   - **Over the board**: Play chess with another person on the same computer
   - **Play with the computer**: Play against the Stockfish AI
   - **Computer vs. Computer**: Watch Stockfish play against itself

2. When playing against the computer:
   - Adjust the skill level (0-20)
   - Set the thinking time (in milliseconds)
   - Choose your color (white, black, or random)

3. During the game:
   - Click on a piece to select it, then click on a destination square to move
   - Use the Undo button to take back a move
   - Use the Reset button to start a new game

## GitHub Pages Deployment

This version is specifically designed to work on GitHub Pages. To deploy:

1. Push all files to your GitHub repository
2. Enable GitHub Pages in your repository settings
3. Set the source to the branch and folder containing these files

## Technical Details

- Uses Stockfish.js for the chess engine
- All processing happens client-side in the browser
- No server-side components required
- Chess pieces are displayed using SVG images from Wikimedia Commons

## Files Included

- `index.html`: Main HTML file
- `style.css`: Original CSS styles
- `additional-styles.css`: Additional styles for the static version
- `chess-pieces.css`: CSS for chess piece display
- `script.js`: Game logic and UI interactions
- `loadEngine.js`: Stockfish engine integration
- `modules/`: Supporting JavaScript modules
- `stockfish/`: Stockfish chess engine files

## Browser Compatibility

Tested and working in:
- Chrome
- Firefox
- Edge
- Safari

## License

This project is open source and available under the MIT License.
