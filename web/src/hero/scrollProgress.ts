/**
 * Single source of scroll truth for the pinned stage.
 *
 * Deliberately does NOT live in React state: it is read every frame by the R3F
 * camera rig and by CSS, and re-rendering a 713k-triangle scene on every scroll
 * event would stutter. Instead we write to a mutable ref (for `useFrame`) and to
 * custom properties (for the DOM layers).
 *
 * Measured on a rAF loop rather than a scroll listener: scroll events are easy
 * to miss when a nested element becomes the scroll container, and we are already
 * running a render loop, so one rect read per frame costs nothing.
 */

import { STOPS, focusOf } from './callouts'

/** Where each beat starts and ends within the overall 0–1 travel. */
export const BEAT2 = { start: 0, end: 0.5 } // approach + rotate to side elevation
export const BEAT3 = { start: 0.56, end: 1 } // technical callouts

export const scrollProgress = {
  /** overall 0–1 across the whole pinned stage */
  current: 0,
  /** 0–1 local to beat 2 */
  beat2: 0,
  /** 0–1 local to beat 3 */
  beat3: 0,
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)
const local = (p: number, r: { start: number; end: number }) =>
  clamp01((p - r.start) / (r.end - r.start))

export function initScrollProgress(root: HTMLElement): () => void {
  let frame = 0
  const last: Record<string, number> = {}

  const write = (name: string, value: number) => {
    const rounded = Math.round(value * 2000) / 2000
    if (last[name] !== rounded) {
      root.style.setProperty(name, String(rounded))
      last[name] = rounded
    }
  }

  const tick = () => {
    const travel = root.offsetHeight - window.innerHeight
    const p = travel > 0 ? clamp01(-root.getBoundingClientRect().top / travel) : 0

    scrollProgress.current = p
    scrollProgress.beat2 = local(p, BEAT2)
    scrollProgress.beat3 = local(p, BEAT3)

    write('--p', p)
    write('--p2', scrollProgress.beat2)
    write('--p3', scrollProgress.beat3)

    // per-stop focus, so each callout can cross-fade as the camera arrives
    for (let i = 0; i < STOPS.length; i++) {
      write(`--f${i}`, focusOf(i, scrollProgress.beat3))
    }

    frame = requestAnimationFrame(tick)
  }

  tick()
  return () => cancelAnimationFrame(frame)
}
