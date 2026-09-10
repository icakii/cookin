import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
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
const LEG_Y = 0.24;
const LEG_X = 0.14;
const FOOT_Y = 0.04;

function resolve(equipped, slot) {
  const key = equipped?.[slot];
  if (key) return getCosmetic(key);
  return STARTERS[slot] || null;
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
  const torsoRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (rootRef.current) {
      rootRef.current.position.y = Math.sin(t * 1.3) * 0.03;
      rootRef.current.rotation.y = Math.sin(t * 0.45) * 0.1;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.5 + 1) * 0.16;
      headRef.current.rotation.z = Math.sin(t * 0.9) * 0.03;
    }
    if (armLRef.current) armLRef.current.rotation.x = Math.sin(t * 1.6) * 0.18;
    if (armRRef.current) armRRef.current.rotation.x = Math.sin(t * 1.6 + Math.PI) * 0.18;
    if (torsoRef.current) torsoRef.current.scale.y = 1 + Math.sin(t * 1.3) * 0.015;
  });

  return (
    <group ref={rootRef}>
      {/* legs */}
      <group position={[-LEG_X, LEG_Y, 0]}>
        <Toon color={pants.visual.color}>
          <capsuleGeometry args={[0.12, 0.2, 4, 8]} />
        </Toon>
      </group>
      <group position={[LEG_X, LEG_Y, 0]}>
        <Toon color={pants.visual.color}>
          <capsuleGeometry args={[0.12, 0.2, 4, 8]} />
        </Toon>
      </group>

      {/* feet / shoes */}
      {[-1, 1].map((sign) => (
        <group key={sign} position={[LEG_X * sign, FOOT_Y, 0.06]}>
          <Toon color={shoes ? shoes.visual.color : "#3a2a1e"}>
            <boxGeometry args={[0.17, 0.1, 0.26]} />
          </Toon>
        </group>
      ))}

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
          <Canvas gl={{ alpha: true, antialias: true }} camera={{ position: [0, 1.1, 3.1], fov: 26 }} dpr={[1, 1.75]}>
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
