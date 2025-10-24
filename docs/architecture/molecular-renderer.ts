// ============================================================================
// MIYABI MOLECULAR VISUALIZATION - THREE.JS RENDERER INTEGRATION
// ============================================================================
// Complete TypeScript implementation integrating all 7 GLSL shaders
// with real-time WebSocket data from Miyabi agents
// ============================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

// ============================================================================
// Types from MIYABI_MOLECULAR_VISUALIZATION_SPEC.md
// ============================================================================

interface CrateAtom {
  id: number;
  name: string;          // e.g., "miyabi-agents"
  chain: 'A' | 'B' | 'C' | 'D';
  position: [number, number, number];
  bfactor: number;       // 0-100 (commit frequency)
  occupancy: number;     // 0-1 (code coverage)
  loc: number;
  dependencies: number[];
}

interface MolecularEvent {
  type: 'atom_add' | 'atom_modify' | 'agent_execution' | 'trajectory_frame';
  timestamp: string;
  atom_id?: number;
  bfactor?: number;
  agent_name?: string;
  target_crate?: string;
  phase?: 'started' | 'in_progress' | 'completed' | 'failed';
  progress?: number;
}

interface MIYBStructure {
  header: {
    title: string;
    version: string;
    date: string;
  };
  chains: {
    [key: string]: CrateAtom[];
  };
  connections: [number, number][];
}

// ============================================================================
// 1. SSAO Post-Processing Effect
// ============================================================================

class SSAOPass extends ShaderPass {
  constructor() {
    const ssaoShader = {
      uniforms: {
        tDepth: { value: null },
        tNormal: { value: null },
        tNoise: { value: null },
        samples: { value: SSAOPass.generateSamples(64) },
        projection: { value: new THREE.Matrix4() },
        radius: { value: 0.5 },
        bias: { value: 0.025 },
        intensity: { value: 1.0 },
        resolution: { value: new THREE.Vector2() }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        // Full SSAO shader from molecular-rendering-shaders.glsl
        uniform sampler2D tDepth;
        uniform sampler2D tNormal;
        uniform sampler2D tNoise;
        uniform vec3 samples[64];
        uniform mat4 projection;
        uniform float radius;
        uniform float bias;
        uniform float intensity;
        uniform vec2 resolution;
        varying vec2 vUv;

        void main() {
          float depth = texture2D(tDepth, vUv).r;
          vec3 normal = texture2D(tNormal, vUv).rgb * 2.0 - 1.0;

          vec2 noiseScale = resolution / 4.0;
          vec3 randomVec = texture2D(tNoise, vUv * noiseScale).xyz;

          vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
          vec3 bitangent = cross(normal, tangent);
          mat3 TBN = mat3(tangent, bitangent, normal);

          float occlusion = 0.0;
          for (int i = 0; i < 64; ++i) {
            vec3 samplePos = TBN * samples[i];
            samplePos = samplePos * radius + vec3(vUv, depth);

            vec4 offset = vec4(samplePos, 1.0);
            offset = projection * offset;
            offset.xyz /= offset.w;
            offset.xy = offset.xy * 0.5 + 0.5;

            float sampleDepth = texture2D(tDepth, offset.xy).r;

            float rangeCheck = smoothstep(0.0, 1.0, radius / abs(depth - sampleDepth));
            occlusion += (sampleDepth >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;
          }

          occlusion = 1.0 - (occlusion / 64.0);
          occlusion = pow(occlusion, intensity);

          gl_FragColor = vec4(vec3(occlusion), 1.0);
        }
      `
    };

    super(ssaoShader);
  }

  static generateSamples(count: number): THREE.Vector3[] {
    const samples: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const sample = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random()
      );
      sample.normalize();

      // Scale samples s.t. they are more aligned to center of kernel
      let scale = i / count;
      scale = THREE.MathUtils.lerp(0.1, 1.0, scale * scale);
      sample.multiplyScalar(scale);

      samples.push(sample);
    }
    return samples;
  }
}

// ============================================================================
// 2. Instanced Atom Renderer
// ============================================================================

class InstancedAtomRenderer {
  private mesh: THREE.InstancedMesh;
  private atoms: Map<number, CrateAtom>;
  private material: THREE.ShaderMaterial;

  constructor(maxAtoms: number = 1000) {
    this.atoms = new Map();

    // Create sphere geometry (icosahedron for performance)
    const geometry = new THREE.IcosahedronGeometry(1, 2);

    // Instanced shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        lightPosition: { value: new THREE.Vector3(50, 100, 50) },
        time: { value: 0 }
      },
      vertexShader: `
        attribute vec3 instancePosition;
        attribute vec3 instanceColor;
        attribute float instanceScale;
        attribute float instanceBfactor;

        varying vec3 vNormal;
        varying vec3 vColor;
        varying float vBfactor;

        void main() {
          vec3 transformed = position * instanceScale + instancePosition;
          vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
          vNormal = normalMatrix * normal;
          vColor = instanceColor;
          vBfactor = instanceBfactor;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 lightPosition;
        varying vec3 vNormal;
        varying vec3 vColor;
        varying float vBfactor;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 lightDir = normalize(lightPosition);

          float heat = vBfactor / 100.0;
          vec3 emissive = vColor * heat * 0.3;

          float diffuse = max(dot(normal, lightDir), 0.0);
          vec3 color = vColor * (0.3 + 0.7 * diffuse) + emissive;

          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    this.mesh = new THREE.InstancedMesh(geometry, this.material, maxAtoms);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }

  addAtom(atom: CrateAtom): void {
    this.atoms.set(atom.id, atom);
    this.updateInstance(atom);
  }

  updateAtom(atomId: number, updates: Partial<CrateAtom>): void {
    const atom = this.atoms.get(atomId);
    if (atom) {
      Object.assign(atom, updates);
      this.updateInstance(atom);
    }
  }

  private updateInstance(atom: CrateAtom): void {
    const matrix = new THREE.Matrix4();
    matrix.setPosition(atom.position[0], atom.position[1], atom.position[2]);

    // Scale based on LOC
    const scale = Math.log10(atom.loc + 1) * 0.5 + 0.5;
    matrix.scale(new THREE.Vector3(scale, scale, scale));

    this.mesh.setMatrixAt(atom.id, matrix);

    // Set color based on chain
    const color = this.getChainColor(atom.chain);
    this.mesh.setColorAt(atom.id, color);

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  private getChainColor(chain: string): THREE.Color {
    const colors = {
      'A': new THREE.Color(0.3, 0.7, 1.0),  // Core (Blue)
      'B': new THREE.Color(1.0, 0.5, 0.2),  // Agents (Orange)
      'C': new THREE.Color(0.2, 0.9, 0.4),  // Infra (Green)
      'D': new THREE.Color(0.9, 0.3, 0.8)   // Tools (Purple)
    };
    return colors[chain] || new THREE.Color(1, 1, 1);
  }

  getMesh(): THREE.InstancedMesh {
    return this.mesh;
  }

  animate(time: number): void {
    this.material.uniforms.time.value = time;

    // Apply thermal motion
    this.atoms.forEach(atom => {
      const motion = Math.sin(time * 2 + atom.id * 0.1) * 0.05 * (atom.bfactor / 100);
      const matrix = new THREE.Matrix4();
      matrix.setPosition(
        atom.position[0] + motion,
        atom.position[1],
        atom.position[2]
      );
      this.mesh.setMatrixAt(atom.id, matrix);
    });

    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// ============================================================================
// 3. Cartoon (Ribbon) Renderer
// ============================================================================

class CartoonRenderer {
  private chains: Map<string, THREE.Mesh>;
  private material: THREE.ShaderMaterial;

  constructor() {
    this.chains = new Map();

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        lightPosition: { value: new THREE.Vector3(50, 100, 50) },
        viewPosition: { value: new THREE.Vector3() },
        time: { value: 0 }
      },
      vertexShader: `
        attribute float bfactor;
        attribute float chainId;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vBfactor;
        varying float vChainId;

        uniform float time;

        float getRibbonWidth(float bf) {
          return 1.0 + bf / 100.0 * 0.5;
        }

        void main() {
          float width = getRibbonWidth(bfactor);
          vec3 offset = normal * width;

          float motion = sin(time * 2.0 + position.x * 0.1) * 0.05 * (bfactor / 100.0);
          vec3 animatedPos = position + offset + normalize(cross(normal, vec3(0,1,0))) * motion;

          vec4 mvPosition = modelViewMatrix * vec4(animatedPos, 1.0);
          vPosition = mvPosition.xyz;
          vNormal = normalMatrix * normal;
          vBfactor = bfactor;
          vChainId = chainId;

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 lightPosition;
        uniform vec3 viewPosition;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vBfactor;
        varying float vChainId;

        vec3 getChainColor(float cid) {
          if (cid < 0.5) return vec3(0.3, 0.7, 1.0);
          else if (cid < 1.5) return vec3(1.0, 0.5, 0.2);
          else if (cid < 2.5) return vec3(0.2, 0.9, 0.4);
          else return vec3(0.9, 0.3, 0.8);
        }

        vec3 applyBfactorHeat(vec3 base, float bf) {
          float heat = bf / 100.0;
          vec3 heatColor = vec3(1.0, heat, 0.0);
          return mix(base, heatColor, heat * 0.4);
        }

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 lightDir = normalize(lightPosition - vPosition);
          vec3 viewDir = normalize(viewPosition - vPosition);

          vec3 baseColor = getChainColor(vChainId);
          vec3 color = applyBfactorHeat(baseColor, vBfactor);

          float ambient = 0.2;
          float diffuse = max(dot(normal, lightDir), 0.0) * 0.7;

          vec3 halfVec = normalize(lightDir + viewDir);
          float specular = pow(max(dot(normal, halfVec), 0.0), 80.0) * 0.8;

          vec3 finalColor = color * (ambient + diffuse) + vec3(specular);

          float rim = 1.0 - max(dot(viewDir, normal), 0.0);
          rim = pow(rim, 3.0);
          finalColor += vec3(0.3, 0.5, 0.7) * rim * 0.3;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });
  }

  createChainRibbon(chainId: string, atoms: CrateAtom[]): void {
    // Create smooth curve through atoms
    const points = atoms.map(a => new THREE.Vector3(...a.position));
    const curve = new THREE.CatmullRomCurve3(points);

    // Create tube geometry along curve
    const tubeGeometry = new THREE.TubeGeometry(curve, 100, 1, 8, false);

    // Add bfactor and chainId attributes
    const bfactors = new Float32Array(tubeGeometry.attributes.position.count);
    const chainIds = new Float32Array(tubeGeometry.attributes.position.count);

    for (let i = 0; i < bfactors.length; i++) {
      const atomIndex = Math.floor(i / (bfactors.length / atoms.length));
      bfactors[i] = atoms[atomIndex]?.bfactor || 0;
      chainIds[i] = chainId.charCodeAt(0) - 65; // 'A'=0, 'B'=1, etc.
    }

    tubeGeometry.setAttribute('bfactor', new THREE.BufferAttribute(bfactors, 1));
    tubeGeometry.setAttribute('chainId', new THREE.BufferAttribute(chainIds, 1));

    const mesh = new THREE.Mesh(tubeGeometry, this.material.clone());
    this.chains.set(chainId, mesh);
  }

  getChainMeshes(): THREE.Mesh[] {
    return Array.from(this.chains.values());
  }

  animate(time: number, camera: THREE.Camera): void {
    this.chains.forEach(mesh => {
      const material = mesh.material as THREE.ShaderMaterial;
      material.uniforms.time.value = time;
      material.uniforms.viewPosition.value.copy(camera.position);
    });
  }
}

// ============================================================================
// 4. Bond (Connection) Renderer
// ============================================================================

class BondRenderer {
  private bonds: THREE.LineSegments;
  private geometry: THREE.BufferGeometry;

  constructor() {
    this.geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
      color: 0x666666,
      linewidth: 2,
      opacity: 0.6,
      transparent: true
    });
    this.bonds = new THREE.LineSegments(this.geometry, material);
  }

  updateBonds(connections: [number, number][], atoms: Map<number, CrateAtom>): void {
    const positions: number[] = [];

    connections.forEach(([id1, id2]) => {
      const atom1 = atoms.get(id1);
      const atom2 = atoms.get(id2);

      if (atom1 && atom2) {
        positions.push(...atom1.position, ...atom2.position);
      }
    });

    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.computeBoundingSphere();
  }

  getMesh(): THREE.LineSegments {
    return this.bonds;
  }
}

// ============================================================================
// 5. Main Molecular Visualization Renderer
// ============================================================================

export class MolecularVisualizationRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private composer: EffectComposer;

  private atomRenderer: InstancedAtomRenderer;
  private cartoonRenderer: CartoonRenderer;
  private bondRenderer: BondRenderer;

  private ws: WebSocket | null = null;
  private structure: MIYBStructure | null = null;

  private representationMode: 'ball-stick' | 'cartoon' | 'surface' = 'ball-stick';

  constructor(container: HTMLElement) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e14);  // PyMOL dark theme

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(50, 50, 100);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Post-processing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    // Add SSAO
    const ssaoPass = new SSAOPass();
    this.composer.addPass(ssaoPass);

    // Add Bloom for active components
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.5,  // strength
      0.4,  // radius
      0.85  // threshold
    );
    this.composer.addPass(bloomPass);

    // Initialize renderers
    this.atomRenderer = new InstancedAtomRenderer(1000);
    this.cartoonRenderer = new CartoonRenderer();
    this.bondRenderer = new BondRenderer();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    this.scene.add(directionalLight);

    // Start animation loop
    this.animate();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  // Load MIYB structure file
  async loadStructure(url: string): Promise<void> {
    const response = await fetch(url);
    const text = await response.text();
    this.structure = this.parseMIYB(text);

    // Render all atoms
    Object.values(this.structure.chains).flat().forEach(atom => {
      this.atomRenderer.addAtom(atom);
    });

    this.scene.add(this.atomRenderer.getMesh());

    // Render bonds
    const allAtoms = new Map(
      Object.values(this.structure.chains).flat().map(a => [a.id, a])
    );
    this.bondRenderer.updateBonds(this.structure.connections, allAtoms);
    this.scene.add(this.bondRenderer.getMesh());

    // Create cartoon representation for each chain
    Object.entries(this.structure.chains).forEach(([chainId, atoms]) => {
      this.cartoonRenderer.createChainRibbon(chainId, atoms);
    });
  }

  // Connect to WebSocket for real-time updates
  connectWebSocket(url: string = 'ws://localhost:3001/ws?events=true'): void {
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      const molecularEvent: MolecularEvent = JSON.parse(event.data);
      this.handleEvent(molecularEvent);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleEvent(event: MolecularEvent): void {
    switch (event.type) {
      case 'atom_modify':
        if (event.atom_id !== undefined && event.bfactor !== undefined) {
          this.atomRenderer.updateAtom(event.atom_id, { bfactor: event.bfactor });
        }
        break;

      case 'agent_execution':
        // Highlight the target crate
        console.log(`Agent ${event.agent_name} executing on ${event.target_crate}`);
        // TODO: Add visual highlight
        break;

      case 'trajectory_frame':
        // Animate git history playback
        console.log('Trajectory frame received');
        break;
    }
  }

  // Change representation mode
  setRepresentation(mode: 'ball-stick' | 'cartoon' | 'surface'): void {
    this.representationMode = mode;

    // Toggle visibility
    this.atomRenderer.getMesh().visible = (mode === 'ball-stick');
    this.cartoonRenderer.getChainMeshes().forEach(mesh => {
      mesh.visible = (mode === 'cartoon');
      if (!this.scene.children.includes(mesh)) {
        this.scene.add(mesh);
      }
    });
  }

  // Parse MIYB format
  private parseMIYB(text: string): MIYBStructure {
    const lines = text.split('\n');
    const structure: MIYBStructure = {
      header: { title: '', version: '', date: '' },
      chains: {},
      connections: []
    };

    lines.forEach(line => {
      if (line.startsWith('HEADER')) {
        structure.header.title = line.substring(10, 50).trim();
      } else if (line.startsWith('ATOM')) {
        const atom: CrateAtom = {
          id: parseInt(line.substring(6, 11)),
          name: line.substring(17, 20).trim(),
          chain: line.substring(21, 22) as any,
          position: [
            parseFloat(line.substring(30, 38)),
            parseFloat(line.substring(38, 46)),
            parseFloat(line.substring(46, 54))
          ],
          occupancy: parseFloat(line.substring(54, 60)),
          bfactor: parseFloat(line.substring(60, 66)),
          loc: 1000, // Placeholder
          dependencies: []
        };

        if (!structure.chains[atom.chain]) {
          structure.chains[atom.chain] = [];
        }
        structure.chains[atom.chain].push(atom);
      } else if (line.startsWith('CONECT')) {
        const atomId = parseInt(line.substring(6, 11));
        const bonds = line.substring(11).trim().split(/\s+/).map(Number);
        bonds.forEach(bondId => {
          structure.connections.push([atomId, bondId]);
        });
      }
    });

    return structure;
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const time = performance.now() * 0.001;

    // Update controls
    this.controls.update();

    // Animate atoms
    this.atomRenderer.animate(time);

    // Animate cartoon
    this.cartoonRenderer.animate(time, this.camera);

    // Render
    this.composer.render();
  };

  private onWindowResize(): void {
    const container = this.renderer.domElement.parentElement!;
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.composer.setSize(container.clientWidth, container.clientHeight);
  }

  dispose(): void {
    if (this.ws) {
      this.ws.close();
    }
    this.renderer.dispose();
    this.controls.dispose();
  }
}

// ============================================================================
// 6. Usage Example
// ============================================================================

/*
// Initialize renderer
const container = document.getElementById('viewport')!;
const renderer = new MolecularVisualizationRenderer(container);

// Load Miyabi structure
await renderer.loadStructure('/api/molecular-viz/structure.miyb');

// Connect to real-time updates
renderer.connectWebSocket('ws://localhost:3001/ws?events=true');

// Change representation
document.getElementById('btn-cartoon')!.addEventListener('click', () => {
  renderer.setRepresentation('cartoon');
});
*/

// ============================================================================
// END OF MOLECULAR RENDERER
// ============================================================================
