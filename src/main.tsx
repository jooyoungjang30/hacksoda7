import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { configError } from './lib/supabase'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {configError ? (
      <div style={{ maxWidth: 520, margin: '80px auto', padding: 24, fontSize: 14, lineHeight: 1.6 }}>
        <b style={{ display: 'block', marginBottom: 8 }}>This deployment isn't configured</b>
        <span style={{ color: '#7C8190' }}>{configError}</span>
      </div>
    ) : (
      <App />
    )}
  </StrictMode>
)
