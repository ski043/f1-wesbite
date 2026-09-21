import { useEffect, useRef } from 'react'
import { Boot, useBoot } from './Boot'
import { STOPS } from './callouts'
import { CarScene } from './CarScene'
import { initScrollProgress } from './scrollProgress'

const STATS = [
  { label: 'Power unit', value: '066/12' },
  { label: 'Top speed', value: '342', unit: 'km/h' },
  { label: '0 – 100', value: '2.4', unit: 's' },
  { label: 'Constructors’ titles', value: '16' },
]

export function Hero() {
  const { phase, lit } = useBoot()
  const revealed = phase === 'revealed'
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!root.current) return
    return initScrollProgress(root.current)
  }, [])

  // hold the page still until the lights go out
  useEffect(() => {
    document.body.style.overflow = revealed ? '' : 'hidden'
    if (!revealed) window.scrollTo(0, 0)
    return () => {
      document.body.style.overflow = ''
    }
  }, [revealed])

  return (
    <div className="scroll-root" ref={root}>
      <main className={`stage${revealed ? ' is-revealed' : ''}`}>
        {/* 0 — environment */}
        <div className="env">
          <div className="env__bloom" />
          <div className="env__streaks" />
          <div className="env__core" />
          <div className="env__horizon" />
          <div className="env__floor" />
          <div className="env__vignette" />
        </div>

        {/* 1 — ghosted race numbers, behind the drivers' heads */}
        <div className="ghosts">
          <span className="ghost ghost--left">16</span>
          <span className="ghost ghost--right">44</span>
        </div>

        {/* 2 — display wordmark; the wrapper carries scroll, the word carries entrance */}
        <div className="display-wrap">
          <h1 className="display">Ferrari</h1>
        </div>

        {/* 3 — the car */}
        <CarScene revealed={revealed} />

        {/* 4 — drivers; figure carries scroll, image carries entrance */}
        <figure className="driver driver--left">
          <div className="driver__glow" />
          <img className="driver__img" src="/img/leclerc.webp" alt="Charles Leclerc" />
        </figure>
        <figure className="driver driver--right">
          <div className="driver__glow" />
          <img className="driver__img" src="/img/hamilton.webp" alt="Lewis Hamilton" />
        </figure>

        {/* 5 — chrome */}
        <div className="chrome">
          <nav className="nav">
            <div className="brand">
              <img className="brand__mark" src="/img/ferrari-shield.png" alt="" />
              <span className="brand__text">Scuderia Ferrari</span>
            </div>
            <div className="nav__links">
              <a href="#team">Team</a>
              <a href="#car">Car</a>
              <a href="#drivers">Drivers</a>
              <a href="#season">Season</a>
            </div>
            <div className="nav__right">
              <span>Season 2026</span>
            </div>
          </nav>

          <div className="footer">
            <div className="footer__driver">
              <div className="footer__name">Charles Leclerc</div>
              <span className="footer__meta">No. 16 · Monaco</span>
            </div>

            <div className="footer__stats">
              {STATS.map((s) => (
                <div key={s.label}>
                  <span className="stat__label">{s.label}</span>
                  <span className="stat__value">
                    {s.value}
                    {s.unit && <em>{s.unit}</em>}
                  </span>
                </div>
              ))}
            </div>

            <div className="footer__driver footer__driver--right">
              <div className="footer__name">Lewis Hamilton</div>
              <span className="footer__meta">No. 44 · United Kingdom</span>
            </div>
          </div>

          <div className="scroll-hint">
            <span>Scroll</span>
            <i />
          </div>

          {/* fades in as the car locks into elevation */}
          <div className="profile">
            <div className="profile__title">
              <span className="profile__name">SF-23</span>
              <span className="profile__sub">Side elevation · 4 824 mm</span>
            </div>
            <div className="profile__axis" />
          </div>

          {/* beat 3 — the travelling shot's caption, cross-fading per stop */}
          <div className="tour">
            {STOPS.map((s) => (
              <div className={`tour__item tour__item--${s.anchor}`} key={s.n}>
                <span className="tour__n">{s.n}</span>
                <span className="tour__label">{s.label}</span>
                <span className="tour__spec">{s.spec}</span>
              </div>
            ))}
            <div className="tour__ticks">
              {STOPS.map((s) => (
                <span className="tour__tick" key={s.n} />
              ))}
            </div>
          </div>
        </div>

        {/* 6 — grain */}
        <div className="grain" />

        <Boot phase={phase} lit={lit} />
      </main>
    </div>
  )
}
