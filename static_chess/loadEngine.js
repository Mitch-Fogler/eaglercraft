// Load Stockfish engine
export function loadEngine() {
  return new Promise((resolve) => {
    // Create a Web Worker for Stockfish
    const worker = new Worker('stockfish/stockfish.js');
    
    // Wait for the engine to be ready
    worker.addEventListener('message', function onMessage(e) {
      if (e.data === 'readyok') {
        worker.removeEventListener('message', onMessage);
        resolve(worker);
      }
    });
    
    return worker;
  });
}
