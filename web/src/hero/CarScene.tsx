import { Suspense, useLayoutEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { sampleTour } from './callouts'
import { scrollProgress } from './scrollProgress'

const MODEL = '/models/sf23.glb'

/**
 * Camera keyframes as orbit coordinates around the car. The hero's three-quarter
 * angle used to be baked into the model's rotation; it now lives here as an
 * azimuth so the camera can arc from it to a true 90° side elevation.
 */
const HERO = { azimuth: 36.5, radius: 7.65, height: 0.95, target: 0.42 }
/** Matches TOUR_START so beat 3 picks up exactly where beat 2 lands. */
const PROFILE = { azimuth: 90, radius: 6.95, height: 0.3, target: 0.3 }

const { lerp, damp, degToRad } = THREE.MathUtils

/** Smootherstep — no acceleration discontinuity at either end of the scroll. */
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

function Car() {
  const { scene } = useGLTF(MODEL, '/draco/')
  const group = useRef<THREE.Group>(null)

  useLayoutEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      const mat = mesh.material as THREE.MeshStandardMaterial
      // the source material is tuned for offline render; lift it for a lacquered,
      // showroom read under the procedural studio rig
      mat.envMapIntensity = 1.35
      mat.needsUpdate = true
    })
  }, [scene])

  // idle drift keeps the highlights alive; damped out as we settle into profile
  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    const calm = 1 - ease(scrollProgress.beat2)
    group.current.rotation.y = Math.sin(t * 0.13) * 0.012 * calm
    group.current.position.y = -0.01 + Math.sin(t * 0.3) * 0.004 * calm
  })

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  )
}

/**
 * Drives the camera from three-quarter hero framing to side elevation, with an
 * intro dolly on first reveal and pointer parallax that fades out as the scroll
 * takes over.
 */
function CameraRig({ revealed }: { revealed: boolean }) {
  const intro = useRef(1) // 1 = pulled back for the intro, 0 = settled
  const prog = useRef(0)
  const study = useRef(0)
  const par = useRef(new THREE.Vector2())

  useFrame((state, dt) => {
    const { camera, pointer } = state

    intro.current = damp(intro.current, revealed ? 0 : 1, 1.3, dt)
    prog.current = damp(prog.current, scrollProgress.beat2, 7, dt)
    study.current = damp(study.current, scrollProgress.beat3, 7, dt)
    par.current.x = damp(par.current.x, pointer.x, 4, dt)
    par.current.y = damp(par.current.y, pointer.y, 4, dt)

    const t = ease(prog.current)
    const k = intro.current

    const azimuth = degToRad(lerp(HERO.azimuth, PROFILE.azimuth, t))
    const radius = lerp(HERO.radius, PROFILE.radius, t) + k * 2.9
    const height = lerp(HERO.height, PROFILE.height, t) + k * 0.42
    const target = lerp(HERO.target, PROFILE.target, t)

    // parallax belongs to the hero; a locked elevation should not wobble
    const sway = (1 - t) * 0.5

    if (study.current > 0.0005) {
      // beat 3: a full orbit. Spherical placement around a moving focus point,
      // so the camera swings behind the car, climbs over it and drops to the
      // nose. sampleTour(0) equals the beat 2 framing, so the hand-over is
      // seamless.
      const w = sampleTour(study.current)
      const az = degToRad(w.azimuth)
      const el = degToRad(w.elevation)
      const horiz = Math.cos(el) * w.radius
      camera.position.set(
        w.focus[0] + Math.sin(az) * horiz,
        w.focus[1] + Math.sin(el) * w.radius,
        w.focus[2] + Math.cos(az) * horiz,
      )
      camera.lookAt(w.focus[0], w.focus[1], w.focus[2])
      return
    }

    camera.position.set(
      Math.sin(azimuth) * radius + par.current.x * sway,
      height + par.current.y * 0.22 * (1 - t),
      Math.cos(azimuth) * radius,
    )
    camera.lookAt(0, target, 0)
  })

  return null
}

function StudioRig() {
  return (
    <Environment resolution={256} frames={1}>
      {/* long overhead strip — the classic automotive studio highlight */}
      <Lightformer
        form="rect"
        intensity={5}
        position={[0, 5, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[11, 3, 1]}
        color="#ffffff"
      />
      {/* warm key from front-left */}
      <Lightformer
        form="rect"
        intensity={3.4}
        position={[-5, 2.4, 5]}
        rotation={[0, -Math.PI / 3.4, 0]}
        scale={[7, 5, 1]}
        color="#fff3ea"
      />
      {/* cool fill from front-right, keeps the shadow side readable */}
      <Lightformer
        form="rect"
        intensity={1.5}
        position={[6, 1.8, 4]}
        rotation={[0, Math.PI / 3.6, 0]}
        scale={[6, 4, 1]}
        color="#cfe0ff"
      />
      {/* red rim lights from behind — ties the car to the bloom in the CSS layer */}
      <Lightformer
        form="rect"
        intensity={7}
        position={[-4.5, 1.4, -5]}
        rotation={[0, Math.PI / 2.6, 0]}
        scale={[7, 3, 1]}
        color="#ff2a18"
      />
      <Lightformer
        form="rect"
        intensity={6}
        position={[4.5, 1.4, -5]}
        rotation={[0, -Math.PI / 2.6, 0]}
        scale={[7, 3, 1]}
        color="#ff3a22"
      />
      {/* dark floor bounce so the underbody doesn't go fully black */}
      <Lightformer
        form="rect"
        intensity={0.5}
        position={[0, -2, 1]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[10, 10, 1]}
        color="#411010"
      />
    </Environment>
  )
}

export function CarScene({ revealed }: { revealed: boolean }) {
  return (
    <Canvas
      className="stage3d"
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, toneMappingExposure: 1.08 }}
      camera={{ fov: 27, position: [4.55, 0.95, 6.15], near: 0.1, far: 100 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
      }}
    >
      <Suspense fallback={null}>
        <group position={[0, -0.24, 0]}>
          <Car />
          <ContactShadows
            position={[0, 0.002, 0]}
            opacity={0.9}
            scale={16}
            blur={2.2}
            far={3.2}
            resolution={1024}
            color="#000000"
          />
        </group>
        <StudioRig />
      </Suspense>
      <CameraRig revealed={revealed} />
      {/* a crisp spec highlight the image-based rig alone can't give */}
      <directionalLight position={[-4, 6, 6]} intensity={1.1} color="#fff6f0" />
      <directionalLight position={[3, 3, -5]} intensity={2.2} color="#ff3020" />
      <ambientLight intensity={0.16} />
    </Canvas>
  )
}

useGLTF.preload(MODEL, '/draco/')
