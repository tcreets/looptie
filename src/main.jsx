import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply the saved appearance before React renders so a manual light/dark
// choice survives refreshes without flashing the system theme first.
const savedTheme = localStorage.getItem('looptie-theme') || 'system'
if (savedTheme === 'light' || savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', savedTheme)
} else {
  document.documentElement.removeAttribute('data-theme')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
