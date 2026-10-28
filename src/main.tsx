import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// HashRouter (no BrowserRouter): GitHub Pages is static hosting with no server-side
// rewrite, so a direct link/refresh to e.g. /join?code=ABCDE or /host/ABCDE returns a
// real 404 from GitHub's file server before React Router ever loads. Routes after a
// "#" never get sent to the server, so this works for every route unconditionally -
// important here since players load /play/:code or /join by scanning a QR code or
// reconnecting on flaky event wifi, not by clicking in-app links.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
