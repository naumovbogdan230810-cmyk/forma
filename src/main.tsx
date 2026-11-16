import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { initTg } from './tg'

initTg()
createRoot(document.getElementById('root')!).render(<App />)
