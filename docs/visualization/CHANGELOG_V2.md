# Miyabi Molecular Visualization - Enhanced Readability Update

## 🎯 Purpose
Make the 3D visualization more understandable, readable, and intuitive for visualizing software architecture as a "word space" (言葉空間).

## 📊 Major Changes

### 1. Layout Direction - BOTTOM-UP (Architectural View)
**Changed from**: Top-Down ('td')
**Changed to**: Bottom-Up ('bu')

**Rationale**:
```
TOP (Application Layer)
  ↑ (dependency direction)
BOTTOM (Foundation Layer)

miyabi-cli, miyabi-agents
           ↑
    miyabi-core
    miyabi-types
```

This matches the intuitive software architecture view where:
- Base libraries (types, core) are at the bottom
- High-level applications (cli, agents) are at the top
- Arrows show dependency flow from top to bottom

### 2. Enhanced Visual Clarity

#### Node Improvements
- **Size**: Increased from `val * 5` to `val * 7` (+40% larger)
- **Minimum Opacity**: Increased from 0.5 to 0.6 (less transparency)
- **Outline Effect**: Added subtle white outline (5% larger) for depth perception

#### Label Improvements
- **Crate Name**:
  - Size: 8px → 14px (+75%)
  - Background: rgba(0,0,0,0.7) → rgba(0,0,0,0.9) (darker)
  - Padding: 2px → 5px
  - Weight: bold
- **Category Label**:
  - Size: 5px → 8px (+60%)
  - Format: Added brackets `[Agent]`, `[Core]`, etc.
  - Background: rgba(0,0,0,0.6) → rgba(0,0,0,0.8)
  - Padding: 1px → 3px
- **LOC Label**:
  - Size: 4px → 7px (+75%)
  - Color: #AAAAAA → #DDDDDD (brighter)
  - Background: rgba(0,0,0,0.5) → rgba(0,0,0,0.75)

#### Link Improvements
- **Width**: 1.5x → 2.5x (67% thicker)
- **Opacity**: 0.4 → 0.6 (50% less transparent)
- **Arrow Size**: 6 → 10 (67% larger)
- **Particles**: 2 → 4 (doubled for clearer direction)
- **Particle Width**: 2 → 3 (+50%)
- **Runtime Color**: #88CCFF → #00BFFF (brighter blue)
- **Dev Color**: #666666 → #999999 (lighter gray)

### 3. Layer Separation
- **DAG Level Distance**: 100 → 200 (2x wider spacing)
- Clearer visual separation between architectural layers
- Easier to identify dependency levels

### 4. Enhanced Lighting
- **Ambient Light**: 0.6 → 0.8 (+33% brighter)
- **Main Directional Light**: 0.8 → 1.0 (+25%)
- **Secondary Directional Light**: 0.4 → 0.6 (+50%)
- **NEW: Hemisphere Light**: Added (0.5 intensity) for overall visibility
- **Background**: #0a0a0a → #0d1117 (slightly lighter for contrast)

### 5. UI/Control Panel Updates
- Updated legend to show new link colors
- Changed legend thickness (0.5px → 1px) with rounded corners
- Added explanation: "💡 Bottom-Up View: Base layers at bottom → High-level layers at top"
- Added note: "🔵 Arrows show dependency direction"

## 📈 Impact

### Before
```
❌ Small nodes hard to see
❌ Tiny labels unreadable at distance
❌ Top-down layout confusing (types on top?)
❌ Thin, faint links hard to follow
❌ Tight layer spacing causes overlap
```

### After
```
✅ 40% larger nodes with outlines
✅ 75% larger labels with darker backgrounds
✅ Bottom-up layout matches architectural intuition
✅ 67% thicker links with doubled particles
✅ 2x wider layer spacing prevents overlap
✅ 33% brighter lighting improves visibility
```

## 🔍 Word Space (言葉空間) Metaphor

The visualization now better represents the "word space" concept:

- **Nodes = Words/Concepts**: Each crate is a semantic unit in the codebase
- **Size = Importance**: Larger nodes represent more complex modules (LOC)
- **Position = Abstraction Level**: Bottom (fundamental) → Top (application)
- **Links = Semantic Relationships**: Dependencies show how concepts relate
- **Colors = Categories**: Visual grouping of similar semantic domains
- **Labels = Clarity**: What each word/concept represents

## 🎨 Visual Example

```
            [miyabi-cli]  <--- Application Layer (Top)
           /            \
    [miyabi-agents]  [miyabi-github]
           |              |
    [miyabi-core]  [miyabi-types]  <--- Foundation Layer (Bottom)
```

## 📁 Modified Files

1. `crates/miyabi-viz/frontend/components/MiyabiViewer.tsx`
   - Changed default DAG mode to 'bu'
   - Increased node size (val * 5 → val * 7)
   - Added node outlines
   - Enhanced all label sizes and styling
   - Improved link visibility (width, opacity, arrows, particles)
   - Increased DAG level distance (100 → 200)
   - Enhanced scene lighting
   - Lighter background color

2. `crates/miyabi-viz/frontend/components/ControlPanel.tsx`
   - Updated legend colors to match new scheme
   - Added explanatory text for bottom-up view
   - Improved legend visual design

3. `crates/miyabi-viz/frontend/app/page.tsx`
   - Changed default DAG mode state to 'bu'

## ✅ Testing

Server running at: http://localhost:3003

Expected results:
- Bottom-up layout with base layers at bottom
- Much larger, more readable labels
- Brighter, more visible links with clear directionality
- Better overall contrast and visibility
- Clearer architectural layer separation

## 🚀 Next Steps (Optional)

Future enhancements could include:
- Layer backgrounds/grids for visual grouping
- Interactive "layer collapse" feature
- Semantic similarity highlighting
- Dynamic label sizing based on zoom level
