import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import { STARTERS, getCosmetic } from "@/lib/cosmetics";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const SKIN = "#e8b384";
const OUTLINE = "#241a12";
const EYE = "#241a12";

// Chibi proportions (big head, short stubby everything, no neck) - matches
// the GeoGuessr-style mascot reference, not a realistic 8-head-tall figure.
const HEAD_R = 0.36;
const HEAD_Y = 1.24;
const TORSO_Y = 0.68;
const TORSO_R = 0.3;
const TORSO_LEN = 0.14;
const ARM_Y = 0.62;
const ARM_X = 0.34;
const HIP_Y = 0.42;
const LEG_Y = 0.24;
const LEG_X = 0.14;
const FOOT_Y = 0.04;
// Model spans world y ~0 (feet) to ~1.6 (head top) - shift it so its visual
// center sits near the origin, matching the camera's default look-at point,
// instead of the camera aiming at the character's ankles.
const RECENTER_Y = -0.82;
// How far left/right the character wanders while idling, in world units.
const WANDER_RANGE = 0.26;

function resolve(equipped, slot) {
  const key = equipped?.[slot];
  if (key) return getCosmetic(key);
  return STARTERS[slot] || null;
}

let shadowTexture = null;
function getShadowTexture() {
  if (shadowTexture) return shadowTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(0,0,0,0.4)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  shadowTexture = new THREE.CanvasTexture(canvas);
  return shadowTexture;
}

// Smooth toy-plastic shading plus a clean cartoon outline, instead of hard
// toon banding - closer to the soft, rounded reference look.
function Toon({ color, children, outline = true, outlineColor = OUTLINE, thickness = 0.01 }) {
  return (
    <mesh>
      {children}
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.02} />
      {outline && <Outlines thickness={thickness} color={outlineColor} />}
    </mesh>
  );
}

function GroundShadow() {
  return (
    <mesh position={[0, 0.012, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.32, 24]} />
      <meshBasicMaterial map={getShadowTexture()} transparent depthWrite={false} />
    </mesh>
  );
}

// Face/Glasses are rendered as children of the head group, so these
// positions are local to the head's own center (0,0,0), not world space.
function Face() {
  return (
    <group position={[0, 0.02, HEAD_R * 0.93]}>
      <mesh position={[-0.13, 0, 0]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color={EYE} roughness={0.3} />
      </mesh>
      <mesh position={[0.13, 0, 0]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color={EYE} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Hair({ visual }) {
  if (visual.variant === "flame") {
    return (
      <group position={[0, HEAD_Y + HEAD_R * 0.85, -0.04]}>
        <Toon color={visual.color}>
          <coneGeometry args={[0.26, 0.42, 6]} />
        </Toon>
      </group>
    );
  }
  return (
    <group position={[0, HEAD_Y + HEAD_R * 0.55, -0.14]}>
      <Toon color={visual.color}>
        <sphereGeometry args={[0.2, 14, 14]} />
      </Toon>
    </group>
  );
}

function Glasses({ visual }) {
  const y = 0.02;
  const z = HEAD_R * 0.95;
  if (visual.variant === "shades") {
    return (
      <group position={[0, y, z]}>
        <Toon color={visual.color} outline={false}>
          <boxGeometry args={[0.42, 0.13, 0.05]} />
        </Toon>
      </group>
    );
  }
  return (
    <group position={[0, y, z]}>
      <mesh position={[-0.12, 0, 0]}>
        <torusGeometry args={[0.09, 0.02, 8, 20]} />
        <meshStandardMaterial color={visual.color} roughness={0.4} />
      </mesh>
      <mesh position={[0.12, 0, 0]}>
        <torusGeometry args={[0.09, 0.02, 8, 20]} />
        <meshStandardMaterial color={visual.color} roughness={0.4} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.08, 0.015, 0.015]} />
        <meshStandardMaterial color={visual.color} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Jacket({ visual }) {
  if (visual.variant === "apron") {
    return (
      <group position={[0, TORSO_Y - 0.05, TORSO_R * 0.85]}>
        <Toon color={visual.color}>
          <boxGeometry args={[0.42, 0.4, 0.04]} />
        </Toon>
      </group>
    );
  }
  if (visual.variant === "coat") {
    return (
      <group position={[0, TORSO_Y, 0]}>
        <Toon color={visual.color}>
          <capsuleGeometry args={[TORSO_R + 0.04, TORSO_LEN, 4, 8]} />
        </Toon>
      </group>
    );
  }
  // cloak (mythic)
  return (
    <group position={[0, TORSO_Y - 0.1, -0.1]}>
      <Toon color={visual.color} outlineColor="#8a6a1f">
        <coneGeometry args={[0.42, 0.7, 6]} />
      </Toon>
    </group>
  );
}

function Accessory({ visual }) {
  if (visual.variant === "toque") {
    return (
      <group position={[0, HEAD_Y + HEAD_R + 0.14, 0]}>
        <Toon color={visual.color}>
          <cylinderGeometry args={[0.17, 0.14, 0.28, 12]} />
        </Toon>
        <group position={[0, 0.17, 0]}>
          <Toon color={visual.color}>
            <sphereGeometry args={[0.18, 12, 12]} />
          </Toon>
        </group>
      </group>
    );
  }
  // spatula, held beside the right hand
  return (
    <group position={[ARM_X + 0.14, ARM_Y - 0.18, 0.1]} rotation={[0, 0, -0.3]}>
      <Toon color="#8a8f98">
        <cylinderGeometry args={[0.016, 0.016, 0.34, 6]} />
      </Toon>
      <group position={[0, 0.2, 0]}>
        <Toon color={visual.color}>
          <boxGeometry args={[0.14, 0.14, 0.018]} />
        </Toon>
      </group>
    </group>
  );
}

function Character({ equipped }) {
  const hair = resolve(equipped, "hair");
  const glasses = resolve(equipped, "glasses");
  const jacket = resolve(equipped, "jacket");
  const shirt = resolve(equipped, "shirt");
  const pants = resolve(equipped, "pants");
  const shoes = resolve(equipped, "shoes");
  const accessory = resolve(equipped, "accessory");

  const rootRef = useRef();
  const headRef = useRef();
  const armLRef = useRef();
  const armRRef = useRef();
  const legLRef = useRef();
  const legRRef = useRef();
  const torsoRef = useRef();

  // A tiny autonomous "desktop pet" behavior loop, driven entirely off refs
  // (no React state/re-renders): it idles in place, occasionally wanders a
  // short distance left/right, and occasionally waves - then goes back to
  // idling. All mutated per-frame rather than via React state.
  const behavior = useRef({ mode: "idle", timer: 0, next: 1.5 + Math.random() * 2, x: 0, targetX: 0 });

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const b = behavior.current;
    b.timer += delta;

    if (b.mode === "idle" && b.timer > b.next) {
      b.timer = 0;
      const roll = Math.random();
      if (roll < 0.45) {
        b.mode = "walk";
        b.targetX = THREE.MathUtils.clamp(b.x + (Math.random() * 2 - 1) * WANDER_RANGE * 1.5, -WANDER_RANGE, WANDER_RANGE);
      } else if (roll < 0.7) {
        b.mode = "wave";
        b.next = 1.6;
      } else {
        b.next = 1.5 + Math.random() * 2.5;
      }
    } else if (b.mode === "wave" && b.timer > b.next) {
      b.mode = "idle";
      b.timer = 0;
      b.next = 1.5 + Math.random() * 2.5;
    } else if (b.mode === "walk") {
      const dx = b.targetX - b.x;
      if (Math.abs(dx) < 0.008) {
        b.x = b.targetX;
        b.mode = "idle";
        b.timer = 0;
        b.next = 1.5 + Math.random() * 2.5;
      } else {
        b.x += Math.sign(dx) * Math.min(Math.abs(dx), delta * 0.3);
      }
    }

    const walking = b.mode === "walk";
    const waving = b.mode === "wave";
    const dir = Math.sign(b.targetX - b.x) || 1;

    if (rootRef.current) {
      rootRef.current.position.x = b.x;
      rootRef.current.position.y = RECENTER_Y + Math.sin(t * (walking ? 7 : 1.3)) * (walking ? 0.018 : 0.03);
      rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, walking ? -dir * 0.05 : 0, 0.1);
      rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, walking ? 0 : Math.sin(t * 0.45) * 0.1, 0.1);
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.5 + 1) * 0.16;
      headRef.current.rotation.z = Math.sin(t * 0.9) * 0.03;
    }
    if (legLRef.current) {
      legLRef.current.rotation.x = walking ? Math.sin(t * 9) * 0.55 : Math.sin(t * 0.6) * 0.02;
    }
    if (legRRef.current) {
      legRRef.current.rotation.x = walking ? Math.sin(t * 9 + Math.PI) * 0.55 : Math.sin(t * 0.6 + Math.PI) * 0.02;
    }
    if (armLRef.current) {
      armLRef.current.rotation.x = walking ? Math.sin(t * 9 + Math.PI) * 0.3 : Math.sin(t * 1.6) * 0.18;
    }
    if (armRRef.current) {
      if (waving) {
        armRRef.current.rotation.z = THREE.MathUtils.lerp(armRRef.current.rotation.z, -2.3, 0.18);
        armRRef.current.rotation.x = Math.sin(t * 9) * 0.4;
      } else {
        armRRef.current.rotation.z = THREE.MathUtils.lerp(armRRef.current.rotation.z, 0, 0.15);
        armRRef.current.rotation.x = walking ? Math.sin(t * 9) * 0.3 : Math.sin(t * 1.6 + Math.PI) * 0.18;
      }
    }
    if (torsoRef.current) {
      torsoRef.current.scale.y = 1 + Math.sin(t * (walking ? 7 : 1.3)) * (walking ? 0.008 : 0.015);
    }
  });

  return (
    <group ref={rootRef} position={[0, RECENTER_Y, 0]}>
      <GroundShadow />

      {/* legs - pivoted from the hip so rotation swings them naturally */}
      <group position={[-LEG_X, HIP_Y, 0]} ref={legLRef}>
        <group position={[0, LEG_Y - HIP_Y, 0]}>
          <Toon color={pants.visual.color}>
            <capsuleGeometry args={[0.12, 0.2, 4, 8]} />
          </Toon>
        </group>
        <group position={[0, FOOT_Y - HIP_Y, 0.06]}>
          <Toon color={shoes ? shoes.visual.color : "#3a2a1e"}>
            <boxGeometry args={[0.17, 0.1, 0.26]} />
          </Toon>
        </group>
      </group>
      <group position={[LEG_X, HIP_Y, 0]} ref={legRRef}>
        <group position={[0, LEG_Y - HIP_Y, 0]}>
          <Toon color={pants.visual.color}>
            <capsuleGeometry args={[0.12, 0.2, 4, 8]} />
          </Toon>
        </group>
        <group position={[0, FOOT_Y - HIP_Y, 0.06]}>
          <Toon color={shoes ? shoes.visual.color : "#3a2a1e"}>
            <boxGeometry args={[0.17, 0.1, 0.26]} />
          </Toon>
        </group>
      </group>

      {/* torso / shirt */}
      <group ref={torsoRef} position={[0, TORSO_Y, 0]}>
        <Toon color={shirt.visual.color}>
          <capsuleGeometry args={[TORSO_R, TORSO_LEN, 4, 8]} />
        </Toon>
      </group>

      {/* arms - pivoted from the shoulder so rotation swings them naturally */}
      <group position={[-ARM_X, ARM_Y + 0.15, 0]} ref={armLRef}>
        <group position={[0, -0.15, 0]}>
          <Toon color={SKIN}>
            <capsuleGeometry args={[0.09, 0.2, 4, 8]} />
          </Toon>
        </group>
      </group>
      <group position={[ARM_X, ARM_Y + 0.15, 0]} ref={armRRef}>
        <group position={[0, -0.15, 0]}>
          <Toon color={SKIN}>
            <capsuleGeometry args={[0.09, 0.2, 4, 8]} />
          </Toon>
        </group>
      </group>

      {/* head */}
      <group ref={headRef} position={[0, HEAD_Y, 0]}>
        <Toon color={SKIN}>
          <sphereGeometry args={[HEAD_R, 24, 24]} />
        </Toon>
        <Face />
        {glasses && <Glasses visual={glasses.visual} />}
      </group>

      {hair && <Hair visual={hair.visual} />}
      {jacket && <Jacket visual={jacket.visual} />}
      {accessory && <Accessory visual={accessory.visual} />}
    </group>
  );
}

function Fallback({ size }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-secondary/60 text-xs text-muted-foreground"
      style={{ width: size, height: size * 1.15 }}
    >
      Loading character...
    </div>
  );
}

export default function Avatar({ equipped, size = 200, className }) {
  return (
    <div className={className} style={{ width: size, height: size * 1.15 }}>
      <ErrorBoundary
        fallback={() => (
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-secondary/60 p-3 text-center text-xs text-muted-foreground">
            Couldn't render your character. Try reloading.
          </div>
        )}
      >
        <Suspense fallback={<Fallback size={size} />}>
          <Canvas gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0, 3.6], fov: 34 }} dpr={[1, 1.75]}>
            <ambientLight intensity={0.85} />
            <directionalLight position={[2, 3, 2]} intensity={0.9} />
            <directionalLight position={[-2, 1, -1.5]} intensity={0.3} />
            <pointLight position={[0, 1.3, 2]} intensity={0.25} color="#e0762f" />
            <Character equipped={equipped} />
          </Canvas>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
