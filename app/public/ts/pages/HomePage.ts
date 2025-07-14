import { Win98Window } from "../components/Win98Window.js";
import { logInfo, logError } from "../utils/logger.js";

export async function renderHomePage() {
  const app = document.getElementById('app')!;
  try {
    const res = await fetch('html/homePage.html');
    const htmlHome = await res.text();
    app.innerHTML = htmlHome;
    logInfo('home page loaded');
  }
  catch (err){
    logError('Error loading homePage.html', err)
  }
}