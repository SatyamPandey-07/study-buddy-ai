import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshDistortMaterial, Float, Sphere } from "@react-three/drei";
import * as THREE from "three";

// Amber (primary) + teal (accent) — matches the site's HSL theme tokens.
const COLOR_PRIMARY = "#f5a623";
const COLOR_ACCENT = "#2dbfae";

function CoreBlob() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = t * 0.12;
    meshRef.current.rotation.y = t * 0.18;

    // Gentle parallax toward the pointer
    const { pointer } = state;
    meshRef.current.rotation.y += pointer.x * 0.15;
    meshRef.current.rotation.x += -pointer.y * 0.1;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.8}>
      <Sphere ref={meshRef} args={[1.35, 128, 128]}>
        <MeshDistortMaterial
          color={COLOR_PRIMARY}
          attach="material"
          distort={0.4}
          speed={1.8}
          roughness={0.2}
          metalness={0.4}
          emissive={COLOR_PRIMARY}
          emissiveIntensity={0.3}
          transparent
          opacity={0.28}
        />
      </Sphere>
    </Float>
  );
}

function OrbitRing({ radius, tilt, speed, color }: { radius: number; tilt: [number, number, number]; speed: number; color: string }) {
  const ringRef = useRef<THREE.Group>(null);

  const points = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
    return curve.getPoints(128).map((p) => new THREE.Vector3(p.x, p.y, 0));
  }, [radius]);

  const lineObject = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 });
    return new THREE.Line(geometry, material);
  }, [points, color]);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = state.clock.getElapsedTime() * speed;
  });

  return (
    <group ref={ringRef} rotation={tilt}>
      <primitive object={lineObject} />
    </group>
  );
}

function OrbitDot({ radius, tilt, speed, offset, color, size }: { radius: number; tilt: [number, number, number]; speed: number; offset: number; color: string; size: number }) {
  const dotRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!dotRef.current) return;
    const t = state.clock.getElapsedTime() * speed + offset;
    dotRef.current.position.set(Math.cos(t) * radius, Math.sin(t) * radius, 0);
  });

  return (
    <group ref={groupRef} rotation={tilt}>
      <mesh ref={dotRef}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Scene() {
  const { viewport } = useThree();
  const scale = Math.min(viewport.width, viewport.height) / 7.5;

  return (
    <group scale={[scale, scale, scale]}>
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 4, 4]} intensity={1.4} color={COLOR_PRIMARY} />
      <pointLight position={[-4, -3, 2]} intensity={1.1} color={COLOR_ACCENT} />

      <CoreBlob />

      <OrbitRing radius={2.1} tilt={[Math.PI / 2.4, 0.3, 0]} speed={0.18} color={COLOR_ACCENT} />
      <OrbitRing radius={2.65} tilt={[Math.PI / 3.2, -0.4, 0.2]} speed={-0.12} color={COLOR_PRIMARY} />

      <OrbitDot radius={2.1} tilt={[Math.PI / 2.4, 0.3, 0]} speed={0.55} offset={0} color={COLOR_ACCENT} size={0.055} />
      <OrbitDot radius={2.65} tilt={[Math.PI / 3.2, -0.4, 0.2]} speed={-0.4} offset={2} color={COLOR_PRIMARY} size={0.045} />
      <OrbitDot radius={2.65} tilt={[Math.PI / 3.2, -0.4, 0.2]} speed={-0.4} offset={4.6} color={COLOR_PRIMARY} size={0.045} />
    </group>
  );
}

const Hero3D = () => {
  return (
    <div
      className="pointer-events-none absolute inset-0 hidden md:flex items-center justify-center [mask-image:radial-gradient(ellipse_30%_46%_at_50%_44%,transparent,transparent_38%,black_78%)]"
      aria-hidden="true"
    >
      <div className="w-full h-full max-w-3xl">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          dpr={[1, 1.75]}
          gl={{ alpha: true, antialias: true }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
};

export default Hero3D;
