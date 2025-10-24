// ============================================================================
// MIYABI MOLECULAR VISUALIZATION - ADVANCED RENDERING SHADERS
// ============================================================================
// Based on NGL Viewer, PyMOL, and VMD rendering techniques
// Optimized for real-time visualization of 26-crate Miyabi workspace
// ============================================================================

// ============================================================================
// 1. SSAO (Screen Space Ambient Occlusion) Shader
// ============================================================================
// Purpose: Add depth perception to molecular structures
// Used by: NGL Viewer, PyMOL ray-tracing mode
// Performance: ~2ms at 1080p

// SSAO Vertex Shader
#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;

out vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}

// SSAO Fragment Shader
#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform sampler2D tNoise;
uniform vec3 samples[64];
uniform mat4 projection;
uniform float radius;        // Default: 0.5
uniform float bias;          // Default: 0.025
uniform float intensity;     // Default: 1.0
uniform vec2 resolution;

void main() {
    // Get view-space position from depth
    float depth = texture(tDepth, vUv).r;
    vec3 normal = texture(tNormal, vUv).rgb * 2.0 - 1.0;

    // Random rotation
    vec2 noiseScale = resolution / 4.0;
    vec3 randomVec = texture(tNoise, vUv * noiseScale).xyz;

    // Create TBN change-of-basis matrix
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;
    for (int i = 0; i < 64; ++i) {
        // Get sample position
        vec3 samplePos = TBN * samples[i];
        samplePos = samplePos * radius + vec3(vUv, depth);

        // Project sample position
        vec4 offset = vec4(samplePos, 1.0);
        offset = projection * offset;
        offset.xyz /= offset.w;
        offset.xy = offset.xy * 0.5 + 0.5;

        // Get sample depth
        float sampleDepth = texture(tDepth, offset.xy).r;

        // Range check & accumulate
        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(depth - sampleDepth));
        occlusion += (sampleDepth >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;
    }

    occlusion = 1.0 - (occlusion / 64.0);
    occlusion = pow(occlusion, intensity);

    fragColor = vec4(vec3(occlusion), 1.0);
}

// ============================================================================
// 2. Volumetric Rendering Shader (Ray Marching)
// ============================================================================
// Purpose: Render large point clouds (1000+ atoms) efficiently
// Used by: Mol*, VMD for density maps
// Performance: ~5ms at 1080p with 100 steps

// Volumetric Vertex Shader
#version 300 es
precision highp float;

in vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

out vec3 vOrigin;
out vec3 vDirection;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vOrigin = mvPosition.xyz;
    vDirection = position - cameraPosition;

    gl_Position = projectionMatrix * mvPosition;
}

// Volumetric Fragment Shader
#version 300 es
precision highp float;

in vec3 vOrigin;
in vec3 vDirection;
out vec4 fragColor;

uniform sampler3D tDensity;
uniform vec3 volumeSize;
uniform float threshold;     // Iso-surface threshold: 0.5
uniform vec3 lightDir;
uniform int steps;           // Ray marching steps: 100
uniform float stepSize;      // Default: 0.01

// Transfer function for density-to-color mapping
vec4 transferFunction(float density) {
    // Miyabi B-factor colormap (Blue -> Cyan -> Green -> Yellow -> Red)
    if (density < 0.25) {
        return mix(
            vec4(0.0, 0.0, 1.0, 0.0),
            vec4(0.0, 1.0, 1.0, 0.3),
            density * 4.0
        );
    } else if (density < 0.5) {
        return mix(
            vec4(0.0, 1.0, 1.0, 0.3),
            vec4(0.0, 1.0, 0.0, 0.6),
            (density - 0.25) * 4.0
        );
    } else if (density < 0.75) {
        return mix(
            vec4(0.0, 1.0, 0.0, 0.6),
            vec4(1.0, 1.0, 0.0, 0.8),
            (density - 0.5) * 4.0
        );
    } else {
        return mix(
            vec4(1.0, 1.0, 0.0, 0.8),
            vec4(1.0, 0.0, 0.0, 1.0),
            (density - 0.75) * 4.0
        );
    }
}

// Gradient computation for lighting
vec3 computeGradient(vec3 pos) {
    float delta = stepSize;
    vec3 gradient;
    gradient.x = texture(tDensity, pos + vec3(delta, 0, 0)).r
               - texture(tDensity, pos - vec3(delta, 0, 0)).r;
    gradient.y = texture(tDensity, pos + vec3(0, delta, 0)).r
               - texture(tDensity, pos - vec3(0, delta, 0)).r;
    gradient.z = texture(tDensity, pos + vec3(0, 0, delta)).r
               - texture(tDensity, pos - vec3(0, 0, delta)).r;
    return normalize(gradient);
}

void main() {
    vec3 rayDir = normalize(vDirection);
    vec3 rayPos = vOrigin;

    vec4 accumColor = vec4(0.0);
    float accumAlpha = 0.0;

    // Ray marching
    for (int i = 0; i < steps; ++i) {
        if (accumAlpha > 0.95) break;

        // Sample density
        vec3 uvw = (rayPos / volumeSize) * 0.5 + 0.5;
        float density = texture(tDensity, uvw).r;

        if (density > threshold) {
            vec4 sampleColor = transferFunction(density);

            // Lighting
            vec3 normal = computeGradient(uvw);
            float diffuse = max(dot(normal, lightDir), 0.0);
            sampleColor.rgb *= (0.3 + 0.7 * diffuse);

            // Front-to-back compositing
            sampleColor.a *= (1.0 - accumAlpha);
            accumColor += sampleColor;
            accumAlpha += sampleColor.a;
        }

        rayPos += rayDir * stepSize;
    }

    fragColor = accumColor;
}

// ============================================================================
// 3. Cartoon Representation Shader (Ribbon/Tube)
// ============================================================================
// Purpose: Visualize crate chains as smooth ribbons
// Used by: PyMOL cartoon, Chimera ribbon
// Technique: Cubic spline interpolation + tube geometry

// Cartoon Vertex Shader
#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;
in vec3 tangent;
in float bfactor;        // Miyabi: commit frequency (0-100)
in float chainId;        // Miyabi: 0=Core, 1=Agents, 2=Infra, 3=Tools

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform float time;      // For animation

out vec3 vNormal;
out vec3 vPosition;
out float vBfactor;
out float vChainId;

// Procedural ribbon width modulation
float getRibbonWidth(float bfactor) {
    // Wider ribbons for highly active crates
    return 1.0 + bfactor / 100.0 * 0.5;
}

void main() {
    // Apply ribbon width
    float width = getRibbonWidth(bfactor);
    vec3 offset = normal * width;

    // Thermal motion animation (molecular dynamics simulation)
    float motion = sin(time * 2.0 + position.x * 0.1) * 0.05 * (bfactor / 100.0);
    vec3 animatedPos = position + offset + tangent * motion;

    vec4 mvPosition = modelViewMatrix * vec4(animatedPos, 1.0);
    vPosition = mvPosition.xyz;
    vNormal = normalMatrix * normal;
    vBfactor = bfactor;
    vChainId = chainId;

    gl_Position = projectionMatrix * mvPosition;
}

// Cartoon Fragment Shader
#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vPosition;
in float vBfactor;
in float vChainId;

out vec4 fragColor;

uniform vec3 lightPosition;
uniform vec3 viewPosition;

// Chain-specific base colors
vec3 getChainColor(float chainId) {
    if (chainId < 0.5) {
        return vec3(0.3, 0.7, 1.0);  // Chain A: Core (Blue)
    } else if (chainId < 1.5) {
        return vec3(1.0, 0.5, 0.2);  // Chain B: Agents (Orange)
    } else if (chainId < 2.5) {
        return vec3(0.2, 0.9, 0.4);  // Chain C: Infra (Green)
    } else {
        return vec3(0.9, 0.3, 0.8);  // Chain D: Tools (Purple)
    }
}

// B-factor heat overlay
vec3 applyBfactorHeat(vec3 baseColor, float bfactor) {
    float heat = bfactor / 100.0;
    vec3 heatColor = vec3(1.0, heat, 0.0);  // Yellow to red
    return mix(baseColor, heatColor, heat * 0.4);
}

// PyMOL-style specular highlights
float specularPyMOL(vec3 normal, vec3 lightDir, vec3 viewDir) {
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfVec), 0.0), 80.0);
    return spec * 0.8;
}

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(lightPosition - vPosition);
    vec3 viewDir = normalize(viewPosition - vPosition);

    // Base color with B-factor heat
    vec3 baseColor = getChainColor(vChainId);
    vec3 color = applyBfactorHeat(baseColor, vBfactor);

    // Phong lighting
    float ambient = 0.2;
    float diffuse = max(dot(normal, lightDir), 0.0) * 0.7;
    float specular = specularPyMOL(normal, lightDir, viewDir);

    vec3 finalColor = color * (ambient + diffuse) + vec3(specular);

    // Rim lighting for depth
    float rim = 1.0 - max(dot(viewDir, normal), 0.0);
    rim = pow(rim, 3.0);
    finalColor += vec3(0.3, 0.5, 0.7) * rim * 0.3;

    fragColor = vec4(finalColor, 1.0);
}

// ============================================================================
// 4. Depth Peeling Shader (Multi-layer Transparency)
// ============================================================================
// Purpose: Render transparent overlapping structures correctly
// Used by: Mol*, NGL for surface transparency
// Technique: Dual depth peeling (2-3 layers sufficient)

// Depth Peel Vertex Shader
#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

out vec3 vNormal;
out vec4 vPosition;

void main() {
    vPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalMatrix * normal;
    gl_Position = projectionMatrix * vPosition;
}

// Depth Peel Fragment Shader (Pass N)
#version 300 es
precision highp float;

in vec3 vNormal;
in vec4 vPosition;

layout(location = 0) out vec4 fragColor;
layout(location = 1) out vec4 fragDepth;

uniform sampler2D tDepthPrev;  // Previous layer depth
uniform vec3 color;
uniform float opacity;
uniform vec2 resolution;

void main() {
    vec2 screenUV = gl_FragCoord.xy / resolution;
    float prevDepth = texture(tDepthPrev, screenUV).r;

    // Discard if behind previous layer
    if (gl_FragCoord.z <= prevDepth) {
        discard;
    }

    // Lighting
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vec3(0.0, 1.0, 1.0));
    float diffuse = max(dot(normal, lightDir), 0.0);

    vec3 finalColor = color * (0.3 + 0.7 * diffuse);

    fragColor = vec4(finalColor, opacity);
    fragDepth = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0);
}

// ============================================================================
// 5. Bloom Effect Shader (Glow for Active Components)
// ============================================================================
// Purpose: Highlight actively executing agents
// Used by: Game engines, Miyabi agent execution visualization

// Bloom Bright Pass
#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D tDiffuse;
uniform float threshold;  // Default: 0.8

void main() {
    vec4 color = texture(tDiffuse, vUv);
    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));

    if (brightness > threshold) {
        fragColor = color;
    } else {
        fragColor = vec4(0.0);
    }
}

// Bloom Gaussian Blur
#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D tDiffuse;
uniform vec2 direction;  // (1,0) for horizontal, (0,1) for vertical
uniform vec2 resolution;

const float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

void main() {
    vec2 texelSize = 1.0 / resolution;
    vec3 result = texture(tDiffuse, vUv).rgb * weights[0];

    for (int i = 1; i < 5; ++i) {
        vec2 offset = direction * float(i) * texelSize;
        result += texture(tDiffuse, vUv + offset).rgb * weights[i];
        result += texture(tDiffuse, vUv - offset).rgb * weights[i];
    }

    fragColor = vec4(result, 1.0);
}

// Bloom Composite
#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D tDiffuse;
uniform sampler2D tBloom;
uniform float bloomStrength;  // Default: 0.5

void main() {
    vec3 color = texture(tDiffuse, vUv).rgb;
    vec3 bloom = texture(tBloom, vUv).rgb;

    // Screen blend mode
    color += bloom * bloomStrength;

    fragColor = vec4(color, 1.0);
}

// ============================================================================
// 6. Instanced Rendering Shader (Performance Optimization)
// ============================================================================
// Purpose: Render 1000+ identical spheres (atoms) efficiently
// Used by: All molecular viewers for ball-and-stick
// Performance: Single draw call for all atoms

// Instanced Vertex Shader
#version 300 es
precision highp float;

in vec3 position;  // Sphere geometry
in vec3 normal;

// Per-instance attributes
in vec3 instancePosition;
in vec3 instanceColor;
in float instanceScale;
in float instanceBfactor;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

out vec3 vNormal;
out vec3 vColor;
out float vBfactor;

void main() {
    // Apply instance transform
    vec3 transformed = position * instanceScale + instancePosition;

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    vNormal = normalMatrix * normal;
    vColor = instanceColor;
    vBfactor = instanceBfactor;

    gl_Position = projectionMatrix * mvPosition;
}

// Instanced Fragment Shader
#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vColor;
in float vBfactor;

out vec4 fragColor;

uniform vec3 lightPosition;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(lightPosition);

    // Apply B-factor as emissive
    float heat = vBfactor / 100.0;
    vec3 emissive = vColor * heat * 0.3;

    float diffuse = max(dot(normal, lightDir), 0.0);
    vec3 color = vColor * (0.3 + 0.7 * diffuse) + emissive;

    fragColor = vec4(color, 1.0);
}

// ============================================================================
// 7. Edge Detection Shader (Outline for Selected Components)
// ============================================================================
// Purpose: Highlight selected crates/agents with outline
// Used by: Mol* selection, PyMOL selection outline

// Edge Detection Fragment Shader (Sobel)
#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform vec2 resolution;
uniform float thickness;  // Default: 1.0

void main() {
    vec2 texel = 1.0 / resolution;

    // Sobel kernel for edge detection
    float depth[9];
    depth[0] = texture(tDepth, vUv + texel * vec2(-1, -1)).r;
    depth[1] = texture(tDepth, vUv + texel * vec2( 0, -1)).r;
    depth[2] = texture(tDepth, vUv + texel * vec2( 1, -1)).r;
    depth[3] = texture(tDepth, vUv + texel * vec2(-1,  0)).r;
    depth[4] = texture(tDepth, vUv).r;
    depth[5] = texture(tDepth, vUv + texel * vec2( 1,  0)).r;
    depth[6] = texture(tDepth, vUv + texel * vec2(-1,  1)).r;
    depth[7] = texture(tDepth, vUv + texel * vec2( 0,  1)).r;
    depth[8] = texture(tDepth, vUv + texel * vec2( 1,  1)).r;

    float gx = -depth[0] - 2.0*depth[3] - depth[6] + depth[2] + 2.0*depth[5] + depth[8];
    float gy = -depth[0] - 2.0*depth[1] - depth[2] + depth[6] + 2.0*depth[7] + depth[8];
    float edge = sqrt(gx*gx + gy*gy);

    vec4 color = texture(tDiffuse, vUv);

    if (edge > thickness * 0.01) {
        fragColor = vec4(1.0, 1.0, 0.0, 1.0);  // Yellow outline
    } else {
        fragColor = color;
    }
}

// ============================================================================
// END OF SHADER LIBRARY
// ============================================================================
// Total shaders: 7 rendering techniques
// Estimated performance: 60fps at 1080p with 500 atoms, 3 chains
// Compatible with: WebGL 2.0, Three.js r150+
// ============================================================================
