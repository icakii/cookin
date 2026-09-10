import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import { STARTERS, getCosmetic } from "@/lib/cosmetics";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const SKIN = "#d9a876";
const OUTLINE = "#241a12";

function resolve(equipped, slot) {
  const key = equipped?.[slot];
  if (key) return getCosmetic(key);
  return STARTERS[slot] || null;
}

// A 4-step cel-shade gradient so MeshToonMaterial reads as flat/cartoon
// rather than photoreal - the low-poly, "game avatar" look this is going for.
// One shared texture reused by every part instead of one per mesh.
let toonGradient = null;
function getToonGradient() {
  if (toonGradient) return toonGradient;
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  ["#3d3129", "#7a6656", "#b09a86", "#ffffff"].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(i, 0, 1, 1);
  });
  toonGradient = new THREE.CanvasTexture(canvas);
  toonGradient.minFilter = THREE.NearestFilter;
  toonGradient.magFilter = THREE.NearestFilter;
  return toonGradient;
}

function Toon({ color, children, outline = true, outlineColor = OUTLINE, thickness = 0.012 }) {
  const gradientMap = getToonGradient();
  return (
    <mesh castShadow receiveShadow>
      {children}
      <meshToonMaterial color={color} gradientMap={gradientMap} />
      {outline && <Outlines thickness={thickness} color={outlineColor} />}
    </mesh>
  );
}

function Hair({ visual }) {
  if (visual.variant === "flame") {
    return (
      <Toon color={visual.color} outline={false}>
        <coneGeometry args={[0.3, 0.5, 6]} />
      </Toon>
    );
  }
  return (
    <group position={[0, 1.98, -0.05]}>
      <Toon color={visual.color}>
        <sphereGeometry args={[0.16, 12, 12]} />
      </Toon>
    </group>
  );
}

function Glasses({ visual }) {
  if (visual.variant === "shades") {
    return (
      <Toon color={visual.color} outline={false}>
        <boxGeometry args={[0.46, 0.12, 0.06]} />
      </Toon>
    );
  }
  return (
    <group>
      <mesh position={[-0.13, 0, 0]}>
        <torusGeometry args={[0.09, 0.018, 8, 20]} />
        <meshStandardMaterial color={visual.color} />
      </mesh>
      <mesh position={[0.13, 0, 0]}>
        <torusGeometry args={[0.09, 0.018, 8, 20]} />
        <meshStandardMaterial color={visual.color} />
      </mesh>
    </group>
  );
}

function Jacket({ visual }) {
  if (visual.variant === "apron") {
    return (
      <group position={[0, 0.78, 0.23]}>
        <Toon color={visual.color}>
          <boxGeometry args={[0.58, 0.72, 0.05]} />
        </Toon>
      </group>
    );
  }
  if (visual.variant === "coat") {
    return (
      <group position={[0, 0.95, 0]}>
        <Toon color={visual.color}>
          <capsuleGeometry args={[0.4, 0.62, 4, 8]} />
        </Toon>
      </group>
    );
  }
  // cloak (mythic)
  return (
    <group position={[0, 0.7, -0.15]}>
      <Toon color={visual.color} outlineColor="#8a6a1f">
        <coneGeometry args={[0.55, 1.05, 5]} />
      </Toon>
    </group>
  );
}

function Accessory({ visual }) {
  if (visual.variant === "toque") {
    return (
      <group position={[0, 2.05, -0.03]}>
        <Toon color={visual.color}>
          <cylinderGeometry args={[0.19, 0.16, 0.32, 12]} />
        </Toon>
        <group position={[0, 0.2, 0]}>
          <Toon color={visual.color}>
            <sphereGeometry args={[0.2, 12, 12]} />
          </Toon>
        </group>
      </group>
    );
  }
  // spatula, held beside the right hand
  return (
    <group position={[0.62, 0.55, 0.15]} rotation={[0, 0, -0.3]}>
      <Toon color="#8a8f98">
        <cylinderGeometry args={[0.018, 0.018, 0.42, 6]} />
      </Toon>
      <group position={[0, 0.26, 0]}>
        <Toon color={visual.color}>
          <boxGeometry args={[0.16, 0.16, 0.02]} />
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

  const groupRef = useRef();
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.position.y = Math.sin(t * 1.3) * 0.035;
    groupRef.current.rotation.y = Math.sin(t * 0.6) * 0.06;
  });

  return (
    <group ref={groupRef}>
      {/* legs */}
      <group position={[-0.16, 0.42, 0]}>
        <Toon color={pants.visual.color}>
          <capsuleGeometry args={[0.14, 0.42, 4, 8]} />
        </Toon>
      </group>
      <group position={[0.16, 0.42, 0]}>
        <Toon color={pants.visual.color}>
          <capsuleGeometry args={[0.14, 0.42, 4, 8]} />
        </Toon>
      </group>

      {/* feet / shoes */}
      {["-1", "1"].map((sign) => (
        <group key={sign} position={[0.16 * Number(sign), 0.08, 0.07]}>
          <Toon color={shoes ? shoes.visual.color : SKIN}>
            <boxGeometry args={[0.19, 0.14, 0.3]} />
          </Toon>
        </group>
      ))}

      {/* torso / shirt */}
      <group position={[0, 0.95, 0]}>
        <Toon color={shirt.visual.color}>
          <capsuleGeometry args={[0.34, 0.55, 4, 8]} />
        </Toon>
      </group>

      {/* arms */}
      <group position={[-0.52, 0.92, 0]} rotation={[0, 0, 0.12]}>
        <Toon color={SKIN}>
          <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
        </Toon>
      </group>
      <group position={[0.52, 0.92, 0]} rotation={[0, 0, -0.12]}>
        <Toon color={SKIN}>
          <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
        </Toon>
      </group>

      {/* head */}
      <group position={[0, 1.72, 0]}>
        <Toon color={SKIN}>
          <sphereGeometry args={[0.34, 20, 20]} />
        </Toon>
        {glasses && (
          <group position={[0, 0, 0.3]}>
            <Glasses visual={glasses.visual} />
          </group>
        )}
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
      style={{ width: size, height: size * 1.25 }}
    >
      Loading character...
    </div>
  );
}

export default function Avatar({ equipped, size = 200, className }) {
  return (
    <div className={className} style={{ width: size, height: size * 1.25 }}>
      <ErrorBoundary
        fallback={() => (
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-secondary/60 p-3 text-center text-xs text-muted-foreground">
            Couldn't render your character. Try reloading.
          </div>
        )}
      >
        <Suspense fallback={<Fallback size={size} />}>
          <Canvas
            shadows
            gl={{ alpha: true, antialias: true }}
            camera={{ position: [0, 1.35, 3.6], fov: 28 }}
            dpr={[1, 1.75]}
          >
            <ambientLight intensity={0.65} />
            <directionalLight position={[2, 3, 2]} intensity={1.1} castShadow />
            <pointLight position={[-2, 1.5, -1]} intensity={0.35} color="#e0762f" />
            <Character equipped={equipped} />
          </Canvas>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
