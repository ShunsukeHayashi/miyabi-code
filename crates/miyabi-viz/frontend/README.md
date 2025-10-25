# Miyabi Molecular Visualization - Frontend

Interactive 3D visualization of the Miyabi codebase using Next.js and 3d-force-graph.

## 🚀 Quick Start

### 1. Generate Visualization Data

```bash
# From workspace root
cargo run --package miyabi-viz --features cli --bin miyabi-viz -- generate --output crates/miyabi-viz/frontend/public/structure.json
```

### 2. Start Development Server

```bash
cd crates/miyabi-viz/frontend
npm run dev
```

### 3. Open Browser

Navigate to [http://localhost:3000](http://localhost:3000) (or the port shown in terminal).

## 🎨 Features

### 3D Visualization

- **DAG Layout Modes**: Top-down, Bottom-up, Left-right, Right-left, Radial
- **Force-Directed Graph**: Physics-based layout for natural clustering
- **Interactive Camera**: Rotate, pan, zoom with mouse/trackpad

### Visual Encoding

| Attribute | Meaning | Range |
|-----------|---------|-------|
| **Node Size** | Lines of Code | Log scale |
| **Node Color** | B-factor (code volatility) | Blue (stable) → Red (volatile) |
| **Node Opacity** | Test Coverage | 0% (transparent) → 100% (opaque) |
| **Link Color** | Dependency Type | White (Runtime), Gray (Dev), Gold (Build) |
| **Link Width** | Dependency Importance | 0.5 (Dev) → 2.0 (Build) |

## 📚 Related Documentation

- [3d-force-graph API](https://github.com/vasturiano/3d-force-graph#api-reference)
- [Next.js App Router](https://nextjs.org/docs/app)

**Parent Issue**: [#545 - Miyabi Molecular Visualization System](https://github.com/customer-cloud/miyabi-private/issues/545)
