/**
 * Application Entry Point
 * 
 * This is where our React application starts. Think of this as the ignition key
 * that starts the entire engine. When the browser loads this file, it:
 * 
 * 1. Finds the HTML element with id="root" (defined in index.html)
 * 2. Creates a React root and attaches our App component to it
 * 3. Wraps everything in StrictMode for better development experience
 * 
 * StrictMode helps catch potential problems during development by running
 * components twice and checking for deprecated APIs.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

