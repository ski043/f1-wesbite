/**
 * Beat 3 is an orbit around the car.
 *
 * Each stop is a full 3D camera placement — azimuth around the car, elevation
 * above it, distance, and the point it looks at — so the camera genuinely flies
 * round the machine rather than sliding along one flank.
 *
 * Azimuth convention: 0° is in front of the nose (+Z), 90° is the car's right
 * flank (+X), 180° is directly behind (−Z).
 *
 * Route: establish on the sidepod, swing behind to the rear wing, climb over
 * the engine cover and cockpit, then drop low round to the nose.
 */
export type Stop = {
  n: string
  label: string
  spec: string
  /** position within beat 3, 0–1 */
  at: number
  /** degrees around the car */
  azimuth: number
  /** degrees above the horizon */
  elevation: number
  /** distance from the focus point */
  radius: number
  /** world-space point the camera looks at */
  focus: [number, number, number]
  /** which corner the caption sits in — pick whichever the frame leaves empty */
  anchor: 'bottom' | 'top'
}

/** Wide side elevation handed over from beat 2, before the orbit begins. */
export const TOUR_START = {
  at: 0,
  azimuth: 90,
  elevation: 0,
  radius: 6.95,
  focus: [0, 0.3, 0] as [number, number, number],
}

export const STOPS: Stop[] = [
  {
    n: '01',
    label: 'Sidepod inlet',
    spec: 'Radiator and ERS cooling',
    at: 0.12,
    azimuth: 88,
    elevation: 15,
    radius: 3.9,
    focus: [0, 0.1, -0.3],
    anchor: 'bottom',
  },
  {
    n: '02',
    label: 'Rear wing',
    spec: 'DRS · dual element',
    at: 0.3,
    azimuth: 152,
    elevation: 16,
    radius: 4.0,
    focus: [0, 0.42, -2.2],
    anchor: 'bottom',
  },
  {
    n: '03',
    label: 'Power unit',
    spec: '066/12 · 1.6 V6 turbo hybrid',
    at: 0.47,
    azimuth: 126,
    elevation: 38,
    radius: 4.1,
    focus: [0, 0.28, -0.95],
    anchor: 'bottom',
  },
  {
    n: '04',
    label: 'Halo',
    spec: 'Titanium · 12 t static load',
    at: 0.64,
    azimuth: 62,
    elevation: 38,
    radius: 4.3,
    focus: [0, 0.34, 0.15],
    anchor: 'top',
  },
  {
    n: '05',
    label: 'Front suspension',
    spec: 'Push-rod actuated',
    at: 0.82,
    azimuth: 50,
    elevation: 12,
    radius: 3.8,
    focus: [0, -0.02, 1.42],
    anchor: 'top',
  },
  {
    n: '06',
    label: 'Front wing',
    spec: 'Four-element · adjustable',
    at: 1,
    azimuth: 28,
    elevation: 13,
    radius: 2.9,
    focus: [0, 0.02, 1.95],
    anchor: 'bottom',
  },
]

export type Frame = {
  azimuth: number
  elevation: number
  radius: number
  focus: [number, number, number]
}

const PATH: (Frame & { at: number })[] = [TOUR_START, ...STOPS]

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)
/** smoothstep, so the camera eases in and out of every stop */
const smooth = (t: number) => t * t * (3 - 2 * t)
const mix = (a: number, b: number, t: number) => a + (b - a) * t

/** Camera placement at a given point along the orbit. */
export function sampleTour(p: number): Frame {
  if (p <= PATH[0].at) return PATH[0]
  for (let i = 1; i < PATH.length; i++) {
    const a = PATH[i - 1]
    const b = PATH[i]
    if (p <= b.at) {
      const t = smooth(clamp01((p - a.at) / (b.at - a.at)))
      return {
        azimuth: mix(a.azimuth, b.azimuth, t),
        elevation: mix(a.elevation, b.elevation, t),
        radius: mix(a.radius, b.radius, t),
        focus: [
          mix(a.focus[0], b.focus[0], t),
          mix(a.focus[1], b.focus[1], t),
          mix(a.focus[2], b.focus[2], t),
        ],
      }
    }
  }
  return PATH[PATH.length - 1]
}

/** How "arrived" we are at a given stop — 1 at the stop, 0 between stops. */
export function focusOf(index: number, p: number): number {
  const reach = 0.1
  return smooth(clamp01(1 - Math.abs(p - STOPS[index].at) / reach))
}
