import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { applyTheme, readTheme } from './theme'
import './index.css'

applyTheme(readTheme())

// HashRouter: GitHub Pages has no server rewrites, so /#/practice survives a refresh.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
