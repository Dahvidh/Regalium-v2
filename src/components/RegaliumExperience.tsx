import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function RegaliumExperience() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 8.8);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      host.classList.add('three-fallback');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.className = 'regalium-three-canvas';
    renderer.domElement.setAttribute('aria-label', 'Interactive three-dimensional gold Regalium RGLM coin');
    host.prepend(renderer.domElement);

    const coin = new THREE.Group();
    scene.add(coin);

    const gold = new THREE.MeshStandardMaterial({ color: 0xd7b45f, metalness: 0.92, roughness: 0.23 });
    const paleGold = new THREE.MeshStandardMaterial({ color: 0xffe6a0, metalness: 0.88, roughness: 0.19 });
    const darkGold = new THREE.MeshStandardMaterial({ color: 0x76521c, metalness: 0.86, roughness: 0.3 });
    const faceMat = new THREE.MeshStandardMaterial({ color: 0xc99b43, metalness: 0.9, roughness: 0.27 });
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 0.24, 128, 1, false), gold);
    edge.rotation.x = Math.PI / 2;
    coin.add(edge);

    const face = new THREE.Mesh(new THREE.CircleGeometry(1.57, 128), faceMat);
    face.position.z = 0.126;
    coin.add(face);
    const back = new THREE.Mesh(new THREE.CircleGeometry(1.57, 128), darkGold);
    back.position.z = -0.126;
    back.rotation.y = Math.PI;
    coin.add(back);

    // Keep the RGLM mark physically attached to the coin so it turns with the 3D face.
    const markCanvas = document.createElement('canvas');
    markCanvas.width = 512;
    markCanvas.height = 512;
    const markContext = markCanvas.getContext('2d');
    if (markContext) {
      markContext.clearRect(0, 0, 512, 512);
      markContext.textAlign = 'center';
      markContext.textBaseline = 'middle';
      markContext.fillStyle = '#241708';
      markContext.font = 'bold 330px Georgia, serif';
      markContext.fillText('R', 256, 235);
      markContext.fillStyle = '#4b3516';
      markContext.font = 'bold 34px Arial, sans-serif';
      markContext.letterSpacing = '15px';
      markContext.fillText('RGLM', 256, 390);
    }
    const markTexture = new THREE.CanvasTexture(markCanvas);
    markTexture.colorSpace = THREE.SRGBColorSpace;
    const mark = new THREE.Mesh(
      new THREE.PlaneGeometry(1.78, 1.78),
      new THREE.MeshBasicMaterial({ map: markTexture, transparent: true, depthWrite: false })
    );
    mark.position.z = 0.17;
    coin.add(mark);

    const addRing = (radius: number, tube: number, z: number, material: THREE.Material) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 128), material);
      ring.position.z = z;
      coin.add(ring);
    };
    addRing(1.43, 0.025, 0.145, paleGold);
    addRing(1.28, 0.012, 0.15, darkGold);
    addRing(1.43, 0.025, -0.145, paleGold);

    // A restrained radial engraving pattern gives the coin real dimensional detail.
    const ticks = new THREE.Group();
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.025, i % 3 === 0 ? 0.12 : 0.065, 0.018), paleGold);
      mark.position.set(Math.sin(a) * 1.49, Math.cos(a) * 1.49, 0.15);
      mark.rotation.z = -a;
      ticks.add(mark);
    }
    coin.add(ticks);

    const crown = new THREE.Group();
    const crownBase = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.075, 0.045), paleGold);
    crownBase.position.y = 0.62;
    crown.add(crownBase);
    const crownShape = new THREE.Shape();
    crownShape.moveTo(-0.42, 0.65);
    crownShape.lineTo(-0.35, 1.02);
    crownShape.lineTo(-0.08, 0.82);
    crownShape.lineTo(0, 1.1);
    crownShape.lineTo(0.12, 0.82);
    crownShape.lineTo(0.38, 1.02);
    crownShape.lineTo(0.43, 0.65);
    crownShape.closePath();
    const crownMesh = new THREE.Mesh(new THREE.ShapeGeometry(crownShape), paleGold);
    crownMesh.position.z = 0.04;
    crown.add(crownMesh);
    coin.add(crown);

    const lightA = new THREE.PointLight(0xffdf91, 95, 18);
    lightA.position.set(-3.8, 4.5, 5);
    scene.add(lightA);
    const lightB = new THREE.PointLight(0x9871ef, 65, 16);
    lightB.position.set(4, -2.5, 3);
    scene.add(lightB);
    scene.add(new THREE.AmbientLight(0xffffff, 1.25));

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(2.15, 0.008, 8, 180),
      new THREE.MeshBasicMaterial({ color: 0xd9b86c, transparent: true, opacity: 0.52 })
    );
    halo.rotation.x = 0.95;
    halo.rotation.y = 0.25;
    scene.add(halo);

    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 170;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(particlesGeometry, new THREE.PointsMaterial({ color: 0xe8cc8d, size: 0.022, transparent: true, opacity: 0.72 }));
    scene.add(particles);

    const pointer = new THREE.Vector2(0, 0);
    const target = new THREE.Vector2(0, 0);
    let width = 1;
    let height = 1;
    let frame = 0;
    let visible = true;
    let pageVisible = !document.hidden;
    const clock = new THREE.Clock();

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      camera.aspect = width / height;
      camera.position.z = width < 520 ? 10.2 : 8.8;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    let dragging = false;
    let dragPointer = -1;
    let lastX = 0;
    let lastY = 0;
    const onPointerDown = (event: PointerEvent) => {
      dragging = true; dragPointer = event.pointerId; lastX = event.clientX; lastY = event.clientY;
      host.setPointerCapture?.(event.pointerId);
      host.classList.add('is-dragging');
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragging && event.pointerId === dragPointer) {
        const dx = event.clientX - lastX; const dy = event.clientY - lastY;
        lastX = event.clientX; lastY = event.clientY;
        const sensitivity = event.pointerType === 'touch' ? 0.018 : 0.012;
        target.x = THREE.MathUtils.clamp(target.x + dx * sensitivity, -1.6, 1.6);
        target.y = THREE.MathUtils.clamp(target.y + dy * sensitivity * 0.75, -1.2, 1.2);
        return;
      }
      if (event.pointerType === 'touch') return;
      const rect = host.getBoundingClientRect();
      target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.75;
      target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.55;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId !== dragPointer) return;
      dragging = false; dragPointer = -1; host.classList.remove('is-dragging');
    };
    const onPointerLeave = () => { if (!dragging) target.set(0, 0); };
    const onVisibility = () => { pageVisible = !document.hidden; };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.05 });
    observer.observe(host);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    host.addEventListener('pointerdown', onPointerDown);
    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerup', onPointerUp);
    host.addEventListener('pointercancel', onPointerUp);
    host.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();

    const render = () => {
      if (!visible || !pageVisible) {
        frame = requestAnimationFrame(render);
        return;
      }
      const elapsed = clock.getElapsedTime();
      pointer.lerp(target, reduced ? 0.04 : 0.055);
      if (!reduced) {
        coin.rotation.y = elapsed * 0.7 + pointer.x * 0.72;
        coin.rotation.x = -pointer.y * 0.42 + Math.sin(elapsed * 0.32) * 0.035;
        coin.rotation.z = Math.sin(elapsed * 0.2) * 0.025;
        coin.position.y = Math.sin(elapsed * 0.62) * 0.07;
        halo.rotation.z = elapsed * 0.055;
        particles.rotation.y = elapsed * 0.012;
      } else {
        // Reduced-motion users can still rotate the coin manually; only idle motion is disabled.
        coin.rotation.y = pointer.x * 0.72;
        coin.rotation.x = -pointer.y * 0.42;
        coin.rotation.z = 0;
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      host.removeEventListener('pointerdown', onPointerDown);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerup', onPointerUp);
      host.removeEventListener('pointercancel', onPointerUp);
      host.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      markTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="regalium-three-experience" ref={hostRef}>
      <div className="regalium-three-hint"><span /> DRAG TO ROTATE · TOUCH TO EXPLORE</div>
    </div>
  );
}
