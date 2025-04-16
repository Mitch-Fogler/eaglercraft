# GitHub Deployment Instructions

Follow these steps to deploy the chess game to GitHub and make it accessible to others:

## 1. Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in to your account
2. Click on the "+" icon in the top-right corner and select "New repository"
3. Enter a repository name (e.g., "chess-game")
4. Add a description (optional): "A chess game with Stockfish AI and multiplayer functionality"
5. Choose "Public" visibility
6. Check "Add a README file" (we'll replace it with our own)
7. Select "Add .gitignore" and choose "Node" from the template dropdown
8. Choose a license (MIT is recommended for open-source projects)
9. Click "Create repository"

## 2. Clone the Repository Locally

```bash
git clone https://github.com/yourusername/chess-game.git
cd chess-game
```

## 3. Copy the Chess Game Files

Copy all files from the simplified chess game project to your local repository:

```bash
# Replace /path/to/simplified_chess with the actual path to the simplified chess game
cp -r /path/to/simplified_chess/* /path/to/your/local/repository/
```

## 4. Commit and Push to GitHub

```bash
git add .
git commit -m "Initial commit: Chess game with Stockfish AI and multiplayer"
git push origin main
```

## 5. Deploy to GitHub Pages (Optional)

If you want to make the game playable directly from GitHub:

1. In your repository, go to "Settings" > "Pages"
2. Under "Source", select "Deploy from a branch"
3. Select "main" branch and "/ (root)" folder
4. Click "Save"

Note: For GitHub Pages deployment, you'll need to modify the server.js file to work in a static environment, or use a separate backend hosting service like Heroku, Render, or Railway for the multiplayer functionality.

## 6. Share Your Repository

Share the GitHub repository URL with others so they can:
- Clone and run the game locally
- Contribute to the project
- Fork the repository for their own use

## Running the Game Locally

Anyone who clones your repository can run the game locally by following these steps:

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chess-game.git
cd chess-game
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open a web browser and navigate to:
```
http://localhost:3000
```

## Troubleshooting

- If you encounter CORS issues when running the game, make sure the server is properly configured with the headers in server.js
- For multiplayer functionality, ensure both players are connected to the same network or the server is accessible over the internet
- If Stockfish doesn't load, check the browser console for errors related to Web Workers or WASM loading
