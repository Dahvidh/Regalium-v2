import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const realms = [
  { name: 'THE ARENA', code: '01', label: 'COMPETE', copy: 'A future home for competitive game experiences, player challenges and tournament formats.', tint: 0xd8b76c },
  { name: 'THE FORGE', code: '02', label: 'CREATE', copy: 'A planned layer for digital items, game utilities and player-owned experiences.', tint: 0x9c7ae4 },
  { name: 'THE NEXUS', code: '03', label: 'CONNECT', copy: 'A wider network for communities, events and supported game ecosystems.', tint: 0x8fc7c1 },
];

export default function RegaliumArena() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08070d, 0.045);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.25, 10.5);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      host.classList.add('arena-fallback');
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x08070d, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.domElement.className = 'regalium-arena-canvas';
    host.prepend(renderer.domElement);

    const world = new THREE.Group();
    scene.add(world);

    const gold = new THREE.MeshStandardMaterial({ color: 0xd8b76c, metalness: 0.92, roughness: 0.22 });
    const violet = new THREE.MeshStandardMaterial({ color: 0x9875dc, metalness: 0.82, roughness: 0.24 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x171222, metalness: 0.8, roughness: 0.28 });
    const portal = new THREE.Group();
    world.add(portal);

    const outer = new THREE.Mesh(new THREE.TorusGeometry(2.65, 0.055, 16, 180), gold);
    portal.add(outer);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(2.42, 0.018, 10, 180), violet);
    portal.add(inner);
    const inner2 = new THREE.Mesh(new THREE.TorusGeometry(2.18, 0.009, 8, 180), new THREE.MeshBasicMaterial({ color: 0xf0d99a, transparent: true, opacity: 0.5 }));
    portal.add(inner2);

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.82, 2), new THREE.MeshStandardMaterial({
      color: 0xd6b15a, metalness: 0.94, roughness: 0.16, emissive: 0x5b3b0d, emissiveIntensity: 0.55,
    }));
    portal.add(core);
    const coreRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.025, 10, 100), gold);
    coreRing.rotation.x = Math.PI / 2;
    portal.add(coreRing);
    const coreRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.012, 8, 100), violet);
    coreRing2.rotation.y = Math.PI / 2.7;
    portal.add(coreRing2);

    for (let i = 0; i < 12; i++) {
      const angle = i / 12 * Math.PI * 2;
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.13 + (i % 3) * 0.035, 0), i % 3 === 0 ? violet : gold);
      shard.position.set(Math.cos(angle) * 3.15, Math.sin(angle) * 3.15, (i % 2 ? 0.35 : -0.35));
      shard.rotation.set(angle, angle * 0.6, angle);
      world.add(shard);
    }

    const floor = new THREE.GridHelper(42, 42, 0x5c477f, 0x302744);
    floor.position.y = -3.45;
    (floor.material as THREE.Material).transparent = true;
    (floor.material as THREE.Material).opacity = 0.25;
    scene.add(floor);

    const starsGeo = new THREE.BufferGeometry();
    const count = 620;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 13;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xe9d8ad, size: 0.022, transparent: true, opacity: 0.68 }));
    scene.add(stars);

    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    const key = new THREE.PointLight(0xffd98a, 105, 20);
    key.position.set(-3, 4, 5);
    scene.add(key);
    const fill = new THREE.PointLight(0x8c67d2, 95, 18);
    fill.position.set(4, -1, 2);
    scene.add(fill);

    const pointer = new THREE.Vector2();
    const target = new THREE.Vector2();
    let frame = 0;
    let visible = true;
    let pageVisible = !document.hidden;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      camera.aspect = width / height;
      camera.position.z = width < 640 ? 12.2 : 10.5;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const rect = host.getBoundingClientRect();
      target.set(((event.clientX - rect.left) / rect.width - 0.5) * 0.65, ((event.clientY - rect.top) / rect.height - 0.5) * -0.4);
    };
    const onLeave = () => target.set(0, 0);
    const onVisibility = () => { pageVisible = !document.hidden; };
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.04 });
    const resizeObserver = new ResizeObserver(resize);
    intersection.observe(host);
    resizeObserver.observe(host);
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();

    const clock = new THREE.Clock();
    const render = () => {
      if (visible && pageVisible) {
        const t = clock.getElapsedTime();
        pointer.lerp(target, 0.035);
        world.rotation.y += (pointer.x * 0.22 - world.rotation.y) * 0.02;
        world.rotation.x += (pointer.y * 0.16 - world.rotation.x) * 0.02;
        portal.rotation.z = Math.sin(t * 0.12) * 0.035;
        outer.rotation.y = t * 0.09;
        inner.rotation.y = -t * 0.12;
        inner2.rotation.z = t * 0.08;
        core.rotation.x = t * 0.18;
        core.rotation.y = t * 0.28;
        coreRing.rotation.z = -t * 0.24;
        coreRing2.rotation.x = t * 0.17;
        stars.rotation.y = t * 0.006;
        world.children.forEach((object, i) => {
          if (object instanceof THREE.Mesh && i >= 3) object.rotation.y += 0.002 + (i % 3) * 0.0007;
        });
        const tint = realms[activeRef.current].tint;
        (core.material as THREE.MeshStandardMaterial).color.setHex(tint);
        (fill.color as THREE.Color).setHex(tint);
        renderer.render(scene, camera);
      }
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      intersection.disconnect();
      resizeObserver.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.LineSegments) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const realm = realms[active];
  return (
    <section id="arena" className="regalium-arena-section">
      <div className="arena-topline"><span>THE REGALIUM UNIVERSE</span><span>AN ECOSYSTEM IN MOTION · 001—003</span></div>
      <div className="arena-heading">
        <div><span className="arena-kicker">BEYOND THE TOKEN</span><h2>ENTER THE<br/><em>REGALIUM</em> REALM.</h2></div>
        <p>A connected vision for play, participation and digital ownership. Explore the pillars shaping the ecosystem as it develops.</p>
      </div>
      <div className="arena-stage">
        <div className="arena-scene" ref={hostRef} aria-label="Animated three-dimensional Regalium portal environment">
          <div className="arena-scene-caption"><span>RGLM</span><small>THE WORLD IS TAKING SHAPE</small></div>
        </div>
        <div className="arena-interface">
          <div className="arena-selector" role="tablist" aria-label="Explore Regalium realms">
            {realms.map((item, index) => (
              <button key={item.code} type="button" role="tab" aria-selected={active === index} className={active === index ? 'arena-tab active' : 'arena-tab'} onClick={() => setActive(index)}>
                <span>{item.code}</span><b>{item.name}</b><i>{item.label}</i>
              </button>
            ))}
          </div>
          <div className="arena-detail" aria-live="polite"><span>EXPLORE THE PILLAR</span><h3>{realm.name}</h3><p>{realm.copy}</p><div className="arena-detail-foot"><span>REGALIUM / {realm.code}</span><span>CONCEPT EXPERIENCE</span></div></div>
        </div>
      </div>
      <div className="arena-bottomline"><span>PLAY IS THE ENTRY POINT.</span><span>OWNERSHIP IS THE POSSIBILITY.</span><span>THE ECOSYSTEM IS THE VISION.</span></div>
    </section>
  );
}
