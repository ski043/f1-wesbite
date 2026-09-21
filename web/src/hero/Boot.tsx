import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'

export type BootPhase = 'sequence' | 'out' | 'revealed'

/** Beat before the first lamp, so the screen doesn't start mid-thought. */
const FIRST_DELAY_MS = 340
/** Cadence between lamps. Real gantries run at 1s; this is tightened for the web. */
const LIGHT_INTERVAL_MS = 440
/** Tension once all five are lit, before they drop. */
const HOLD_MS = 620
/** Blackout between lights out and the hero appearing. */
const BLACKOUT_MS = 340
/** Never trap the user behind the overlay if a request hangs. */
const SAFETY_MS = 14000

const DOM_ASSETS = ['/img/leclerc.webp', '/img/hamilton.webp', '/img/ferrari-shield.png']

function preload(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = img.onerror = () => resolve()
    img.src = src
  })
}

/**
 * The gantry runs on its own clock rather than on download progress — that is
 * how a real start works, and it keeps the rhythm readable no matter how fast
 * the assets arrive. Loading only decides *when the lights are allowed to drop*:
 * if the car isn't ready by the fifth lamp, we simply hold on five.
 */
export function useBoot() {
  const { total, active } = useProgress()
  const [domReady, setDomReady] = useState(false)
  const [lit, setLit] = useState(0)
  const [phase, setPhase] = useState<BootPhase>('sequence')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      ...DOM_ASSETS.map(preload),
    ]).then(() => {
      if (!cancelled) setDomReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const assetsReady = domReady && total > 0 && !active

  // one lamp at a time
  useEffect(() => {
    if (phase !== 'sequence' || lit >= 5) return
    const id = setTimeout(
      () => setLit((n) => n + 1),
      lit === 0 ? FIRST_DELAY_MS : LIGHT_INTERVAL_MS,
    )
    return () => clearTimeout(id)
  }, [phase, lit])

  // all five lit and the car is in: lights out
  useEffect(() => {
    if (phase !== 'sequence' || lit < 5 || !assetsReady) return
    const id = setTimeout(() => setPhase('out'), HOLD_MS)
    return () => clearTimeout(id)
  }, [phase, lit, assetsReady])

  useEffect(() => {
    if (phase !== 'out') return
    const id = setTimeout(() => setPhase('revealed'), BLACKOUT_MS)
    return () => clearTimeout(id)
  }, [phase])

  useEffect(() => {
    const id = setTimeout(() => setPhase('revealed'), SAFETY_MS)
    return () => clearTimeout(id)
  }, [])

  return { phase, lit: phase === 'sequence' ? lit : 0 }
}

export function Boot({ phase, lit }: { phase: BootPhase; lit: number }) {
  return (
    <div className={`boot${phase === 'revealed' ? ' boot--gone' : ''}`}>
      <div className="boot__inner" style={{ '--lit': lit } as CSSProperties}>
        <div className="gantry" role="progressbar" aria-valuenow={lit} aria-valuemax={5}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div className={`pod${i < lit ? ' pod--on' : ''}`} key={i}>
              <span className="pod__lamp" />
              <span className="pod__lamp" />
            </div>
          ))}
        </div>
        <span className={`boot__caption${phase === 'out' ? ' boot__caption--gone' : ''}`}>
          Preparing SF-23
        </span>
      </div>
    </div>
  )
}
