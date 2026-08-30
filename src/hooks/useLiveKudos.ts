import { useEffect, useState } from 'react'
import { hydrateLiveKudos } from '../lib/liveKudos'

/**
 * Pulls real kudos into the HR dataset on mount, then forces one re-render so
 * every derive() below recomputes with them included.
 */
export function useLiveKudos(): number {
  const [live, setLive] = useState(0)
  useEffect(() => {
    hydrateLiveKudos().then(setLive).catch(() => setLive(0))
  }, [])
  return live
}
