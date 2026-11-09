"use client";
/**
 * Cảnh 3D Landing: Router WiFi FPT (mô hình minh họa dựng bằng hình khối) + Robot AI + sóng WiFi + vòng năng lượng.
 * Có thể thay Router bằng mô hình .glb chính thức tại Admin → Cài đặt thương hiệu.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, RoundedBox, Sparkles, useGLTF } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const BLUE = "#1369b4";
const CYAN = "#22d3ee";
const ORANGE = "#f07629";

function WifiRings() {
  const refs = useRef<THREE.Mesh[]>([]);
  useFrame(({ clock }) => {
    refs.current.forEach((m, i) => {
      if (!m) return;
      const t = (clock.elapsedTime * 0.45 + i / 3) % 1;
      const s = 1 + t * 3.2;
      m.scale.set(s, s, s);
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.7;
    });
  });
  return (
    <group position={[0, -0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(m) => void (m && (refs.current[i] = m))}>
          <torusGeometry args={[1.1, 0.018, 8, 96]} />
          <meshBasicMaterial color={CYAN} transparent opacity={0.6} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function WifiArcs() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    g.current?.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = 0.25 + 0.75 * Math.max(0, Math.sin(clock.elapsedTime * 3 - i * 0.9));
    });
  });
  return (
    <group ref={g} position={[0, 0.95, 0.2]}>
      {[0.35, 0.65, 0.95].map((r) => (
        <mesh key={r} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[r, 0.05, 12, 48, Math.PI / 2]} />
          <meshBasicMaterial color={CYAN} transparent toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={CYAN} toneMapped={false} />
      </mesh>
    </group>
  );
}

function RouterModel() {
  const leds = useRef<THREE.Mesh[]>([]);
  useFrame(({ clock }) => {
    leds.current.forEach((m, i) => {
      if (!m) return;
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5 + Math.sin(clock.elapsedTime * 6 + i) * 1.2;
    });
  });
  const antennas: [number, number][] = [[-1.05, -0.12], [-0.38, -0.04], [0.38, 0.04], [1.05, 0.12]];
  return (
    <group>
      <RoundedBox args={[2.8, 0.5, 1.7]} radius={0.22} smoothness={6} castShadow>
        <meshPhysicalMaterial color="#f4f7fc" roughness={0.25} metalness={0.1} clearcoat={1} clearcoatRoughness={0.15} />
      </RoundedBox>
      {/* dải xanh FPT phát sáng */}
      <mesh position={[0, -0.02, 0.86]}>
        <boxGeometry args={[2.3, 0.07, 0.02]} />
        <meshStandardMaterial color={BLUE} emissive={BLUE} emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.255, 0]}>
        <boxGeometry args={[2.2, 0.01, 1.2]} />
        <meshStandardMaterial color="#dfe8f7" roughness={0.6} />
      </mesh>
      {/* logo placeholder: 3 khối màu */}
      {[BLUE, ORANGE, "#22c55e"].map((c, i) => (
        <mesh key={c} position={[-0.3 + i * 0.3, 0.27, 0.1]}>
          <boxGeometry args={[0.24, 0.02, 0.3]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* đèn LED */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} ref={(m) => void (m && (leds.current[i] = m))} position={[0.7 + i * 0.15, 0.08, 0.86]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color={i === 0 ? "#22c55e" : CYAN} emissive={i === 0 ? "#22c55e" : CYAN} emissiveIntensity={2} toneMapped={false} />
        </mesh>
      ))}
      {/* ăng-ten */}
      {antennas.map(([x, tilt]) => (
        <group key={x} position={[x, 0.2, -0.7]} rotation={[-0.08, 0, tilt]}>
          <mesh position={[0, 0.65, 0]}>
            <capsuleGeometry args={[0.07, 1.15, 8, 16]} />
            <meshStandardMaterial color="#1f2a44" roughness={0.4} metalness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CustomModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const obj = useMemo(() => {
    const s = scene.clone();
    const box = new THREE.Box3().setFromObject(s);
    const size = box.getSize(new THREE.Vector3()).length() || 1;
    const scale = 3.2 / size;
    s.scale.setScalar(scale);
    const c = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
    s.position.sub(c);
    return s;
  }, [scene]);
  return <primitive object={obj} />;
}

function Robot3D() {
  const arm = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  useFrame(({ clock, pointer }) => {
    if (arm.current) arm.current.rotation.z = 2.3 + Math.sin(clock.elapsedTime * 5) * 0.35;
    if (head.current) {
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, pointer.x * 0.5, 0.08);
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, -pointer.y * 0.25, 0.08);
    }
  });
  const white = <meshPhysicalMaterial color="#f5f8ff" roughness={0.3} clearcoat={1} />;
  return (
    <group>
      <group ref={head} position={[0, 1.05, 0]}>
        <RoundedBox args={[1.1, 0.85, 0.85]} radius={0.3} smoothness={5}>{white}</RoundedBox>
        <RoundedBox args={[0.86, 0.48, 0.1]} radius={0.12} smoothness={4} position={[0, 0, 0.4]}>
          <meshStandardMaterial color="#0a1540" roughness={0.2} />
        </RoundedBox>
        {[-0.18, 0.18].map((x) => (
          <mesh key={x} position={[x, 0.02, 0.46]}>
            <capsuleGeometry args={[0.05, 0.1, 6, 12]} />
            <meshBasicMaterial color={CYAN} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.25]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, 0.72, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color={ORANGE} emissive={ORANGE} emissiveIntensity={2} toneMapped={false} />
        </mesh>
        {[-0.58, 0.58].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.13, 0.13, 0.08, 20]} />
            <meshStandardMaterial color={BLUE} />
          </mesh>
        ))}
      </group>
      <RoundedBox args={[0.9, 0.85, 0.65]} radius={0.28} smoothness={5} position={[0, 0.2, 0]}>{white}</RoundedBox>
      <mesh position={[0, 0.25, 0.33]}>
        <circleGeometry args={[0.18, 32]} />
        <meshBasicMaterial color={CYAN} toneMapped={false} />
      </mesh>
      <group position={[-0.52, 0.42, 0]} rotation={[0, 0, -0.3]}>
        <mesh position={[0, -0.25, 0]}>
          <capsuleGeometry args={[0.1, 0.35, 6, 12]} />
          <meshStandardMaterial color="#c9dcff" />
        </mesh>
      </group>
      <group ref={arm} position={[0.52, 0.42, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <capsuleGeometry args={[0.1, 0.35, 6, 12]} />
          <meshStandardMaterial color="#c9dcff" />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={BLUE} />
        </mesh>
      </group>
    </group>
  );
}

function EnergyOrbits() {
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (a.current) a.current.rotation.z += dt * 0.6;
    if (b.current) b.current.rotation.z -= dt * 0.45;
  });
  return (
    <>
      <group rotation={[Math.PI / 2.4, 0.3, 0]}>
        <group ref={a}>
          <mesh>
            <torusGeometry args={[2.2, 0.012, 8, 128]} />
            <meshBasicMaterial color={CYAN} transparent opacity={0.55} toneMapped={false} />
          </mesh>
          <mesh position={[2.2, 0, 0]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshBasicMaterial color={CYAN} toneMapped={false} />
          </mesh>
        </group>
      </group>
      <group rotation={[Math.PI / 2.1, -0.4, 0]}>
        <group ref={b}>
          <mesh>
            <torusGeometry args={[2.6, 0.01, 8, 128]} />
            <meshBasicMaterial color={ORANGE} transparent opacity={0.45} toneMapped={false} />
          </mesh>
          <mesh position={[-2.6, 0, 0]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshBasicMaterial color={ORANGE} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </>
  );
}

/** Lùi camera khi khung hẹp (điện thoại dọc) để Router + Robot luôn nằm trọn trong khung. */
function ResponsiveCamera({ compact }: { compact: boolean }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const base = compact ? 7.6 : 7.0;
    camera.position.z = aspect >= 1.3 ? base : base * Math.min(1.9, 1.3 / aspect);
    camera.updateProjectionMatrix();
  }, [camera, size, compact]);
  return null;
}

function Rig({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ pointer, clock }) => {
    if (!g.current) return;
    g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, pointer.x * 0.35 + Math.sin(clock.elapsedTime * 0.3) * 0.25, 0.05);
    g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, -pointer.y * 0.12, 0.05);
  });
  return <group ref={g}>{children}</group>;
}

class ModelBoundary extends Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function HeroScene({ modelUrl, showRobot = true, compact = false }: { modelUrl?: string | null; showRobot?: boolean; compact?: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.5, compact ? 7.6 : 6.8], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
    >
      <ResponsiveCamera compact={compact} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} />
      <pointLight position={[-3, 1, 2]} intensity={18} color={BLUE} />
      <pointLight position={[3, -1, 2]} intensity={12} color={ORANGE} />
      <Rig>
        <Float speed={2} rotationIntensity={0.25} floatIntensity={0.6}>
          <group position={[showRobot ? 0.45 : 0, 0, 0]}>
            <ModelBoundary fallback={<RouterModel />}>
              <Suspense fallback={<RouterModel />}>{modelUrl ? <CustomModel url={modelUrl} /> : <RouterModel />}</Suspense>
            </ModelBoundary>
            <WifiArcs />
          </group>
        </Float>
        <WifiRings />
        <EnergyOrbits />
        {showRobot && (
          <Float speed={3} rotationIntensity={0.2} floatIntensity={1}>
            <group position={[-1.8, 0.05, 0.6]} scale={0.7} rotation={[0, 0.5, 0]}>
              <Robot3D />
            </group>
          </Float>
        )}
        <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.4, 64]} />
          <meshBasicMaterial color={BLUE} transparent opacity={0.18} />
        </mesh>
      </Rig>
      <Sparkles count={60} scale={[7, 4, 4]} size={2.6} speed={0.4} color={CYAN} />
    </Canvas>
  );
}
