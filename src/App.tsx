import { useEffect, useState } from 'react'
import { getEmployees } from './lib/queries'
export default function App() {
  const [n, setN] = useState<string[]>([])
  useEffect(() => { getEmployees().then(e => setN(e.map(x => x.name))) }, [])
  return <pre>{n.join('\n')}</pre>
}
