import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Props = { active: number; onSelect: (index: number) => void };

const nodes = [
  { label: 'PLAY', sub: 'Game experiences', color: 0xd8b76c },
  { label: 'EARN', sub: 'Player rewards', color: 0xb69aff },
  { label: 'PARTICIPATE', sub: 'Events & campaigns', color: 0xe8d39a },
  { label: 'USE', sub: 'Ecosystem utility', color: 0x9d83df },
];

export default function RegaliumOrbit({ active, onSelect }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 9.5);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      host.classList.add('orbit-fallback');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.className = 'regalium-orbit-canvas';
    host.prepend(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);
    const gold = new THREE.MeshStandardMaterial({ color: 0xd8b76c, metalness: .88, roughness: .24 });
    const violet = new THREE.MeshStandardMaterial({ color: 0x8e6bd0, metalness: .76, roughness: .28 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.35, .012, 8, 180), new THREE.MeshBasicMaterial({ color: 0xd8b76c, transparent: true, opacity: .58 }));
    ring.rotation.x = .92;
    root.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.85, .008, 8, 180), new THREE.MeshBasicMaterial({ color: 0x9875dc, transparent: true, opacity: .32 }));
    ring2.rotation.y = .85;
    ring2.rotation.x = -.4;
    root.add(ring2);

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.72, 2), new THREE.MeshStandardMaterial({ color: 0xd9b86c, metalness: .95, roughness: .2, emissive: 0x4a2d08, emissiveIntensity: .35 }));
    root.add(core);
    const coreRing = new THREE.Mesh(new THREE.TorusGeometry(.94, .018, 8, 100), gold);
    coreRing.rotation.x = Math.PI / 2;
    root.add(coreRing);

    const orbitNodes = nodes.map((node, index) => {
      const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2;
      const group = new THREE.Group();
      group.position.set(Math.cos(angle) * 2.35, Math.sin(angle) * 2.35, index % 2 ? .16 : -.12);
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(.22, 32, 32), index % 2 ? violet : gold);
      group.add(sphere);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(.34, .012, 8, 48), new THREE.MeshBasicMaterial({ color: node.color, transparent: true, opacity: .75 }));
      halo.rotation.x = Math.PI / 2;
      group.add(halo);
      const glow = new THREE.PointLight(node.color, 1.8, 2.3);
      group.add(glow);
      root.add(group);
      return { group, sphere, halo, angle };
    });

    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const key = new THREE.PointLight(0xffdfa0, 36, 20);
    key.position.set(-3, 4, 5);
    scene.add(key);
    const fill = new THREE.PointLight(0x9470dc, 24, 18);
    fill.position.set(4, -3, 2);
    scene.add(fill);

    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(260 * 3);
    for (let i = 0; i < 260; i++) {
      starPositions[i * 3] = (Math.random() - .5) * 10;
      starPositions[i * 3 + 1] = (Math.random() - .5) * 6;
      starPositions[i * 3 + 2] = (Math.random() - .5) * 3 - 1;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xe8d39a, size: .018, transparent: true, opacity: .62 }));
    scene.add(stars);

    const pointer = new THREE.Vector2();
    const target = new THREE.Vector2();
    let frame = 0;
    let visible = true;
    let pageVisible = !document.hidden;
    const resize = () => {
      const rect = host.getBoundingClientRect();
      camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
      camera.position.z = rect.width < 640 ? 11.5 : 9.5;
      camera.updateProjectionMatrix();
      renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const rect = host.getBoundingClientRect();
      target.set(((event.clientX - rect.left) / rect.width - .5) * .7, ((event.clientY - rect.top) / rect.height - .5) * -.5);
    };
    const onLeave = () => target.set(0, 0);
    const onVisibility = () => { pageVisible = !document.hidden; };
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: .05 });
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
        pointer.lerp(target, .045);
        root.rotation.y += (pointer.x * .24 - root.rotation.y) * .025;
        root.rotation.x += (pointer.y * .2 - root.rotation.x) * .025;
        root.rotation.z = Math.sin(t * .16) * .025;
        core.rotation.y = t * .22;
        core.rotation.x = Math.sin(t * .3) * .12;
        coreRing.rotation.z = t * .18;
        ring.rotation.z = t * .075;
        ring2.rotation.z = -t * .045;
        orbitNodes.forEach(({ group, sphere, halo, angle }, i) => {
          const pulse = .94 + Math.sin(t * 1.4 + i * 1.3) * .08;
          group.scale.setScalar((i === active ? 1.35 : 1) * pulse);
          sphere.rotation.y = t * .5;
          halo.rotation.z = t * .25;
          group.position.z = Math.sin(t * .7 + i) * .12;
        });
        stars.rotation.y = t * .008;
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
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [active]);

  return (
    <div className="regalium-orbit-wrap">
      <div className="regalium-orbit-scene" ref={hostRef} aria-label="Interactive three-dimensional Regalium ecosystem map">
        <div className="regalium-orbit-core-label"><span>RGLM</span><small>THE CONNECTING ECONOMY</small></div>
      </div>
      <div className="regalium-orbit-controls" role="group" aria-label="Explore ecosystem pillars">
        {nodes.map((node, index) => (
          <button key={node.label} type="button" className={active === index ? 'orbit-control active' : 'orbit-control'} onClick={() => onSelect(index)} aria-pressed={active === index}>
            <span className="orbit-control-index">0{index + 1}</span><span className="orbit-control-copy"><b>{node.label}</b><small>{node.sub}</small></span><span className="orbit-control-dot" />
          </button>
        ))}
      </div>
    </div>
  );
}
