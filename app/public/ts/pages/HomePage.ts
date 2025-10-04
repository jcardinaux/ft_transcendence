import { Win98Window } from "../components/Win98Window.js";
import { logInfo, logError } from "../utils/logger.js";

export async function renderHomePage() {
  const app = document.getElementById('app')!;
  try {
    const res = await fetch('html/homePage.html');
    const htmlHome = await res.text();
    app.innerHTML = htmlHome;
    
    // Setup loading functionality
    setupStartButton();
    
    logInfo('home page loaded');
  }
  catch (err){
    logError('Error loading homePage.html', { error: err })
  }
}

function setupStartButton() {
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
  const loadingContainer = document.getElementById('loading-container') as HTMLDivElement;
  const loadingBar = document.getElementById('loading-bar') as HTMLDivElement;
  
  if (!startBtn || !loadingContainer || !loadingBar) {
    logError('Start button or loading elements not found');
    return;
  }

  startBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Hide button and show loading
    startBtn.style.display = 'none';
    loadingContainer.classList.remove('hidden');
    
    logInfo('Starting loading animation');
    
    // Animate loading bar
    let progress = 0;
    const duration = 2000; // 2 seconds
    const interval = 50; // Update every 50ms
    const increment = (100 * interval) / duration;
    
    const loadingInterval = setInterval(() => {
      progress += increment;
      loadingBar.style.width = `${Math.min(progress, 100)}%`;
      
      if (progress >= 100) {
        clearInterval(loadingInterval);
        
        // Small delay before redirect
        setTimeout(() => {
          logInfo('Redirecting to /welcome');
          // Use the router to navigate
          window.history.pushState(null, '', '/welcome');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 200);
      }
    }, interval);
  });
}