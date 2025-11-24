# Miyabi Console - Adaptive UI Guide

## 🎯 Overview

The Adaptive UI system uses **Gemini 3 Pro Preview** to dynamically generate dashboard interfaces based on real-time system data. This creates a personalized, impactful viewing experience that adapts to the current state of your Miyabi system.

## 🚀 Quick Start

### 1. Prerequisites

- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Miyabi backend API running on port 4000

### 2. Setup

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Add your Gemini API key to .env
echo "VITE_GEMINI_API_KEY=your_actual_key_here" > .env

# 3. Restart the dev server
npm run dev
```

### 3. Usage

1. Navigate to the Dashboard page (http://localhost:3002)
2. Look for the **"✨ Adaptive UI"** toggle in the top-right corner
3. Enable the toggle to activate dynamic UI generation
4. Watch the multi-stage loading animation:
   - 📊 Collecting System Data
   - 🧠 AI Analysis in Progress
   - ✨ Generating Adaptive UI
   - 🎨 Finalizing Experience
5. Experience your personalized, AI-generated dashboard

## 🏗 Architecture

### System Flow

```
DashboardPage
  ↓
  [Adaptive UI Toggle] → DynamicUIOrchestrator
                            ↓
                     Stage 1: Data Collection
                     - Fetch agents status
                     - Fetch infrastructure metrics
                     - Fetch database status
                            ↓
                     Stage 2-3: AI Generation
                     - Send data to Gemini 3
                     - Generate React component code
                     - Apply reasoning & optimization
                            ↓
                     Stage 4: Rendering
                     - Execute code in sandboxed environment
                     - Display generated UI
```

### Key Components

#### 1. DynamicUIOrchestrator
**Location**: `src/components/dynamic-ui/DynamicUIOrchestrator.tsx`

Coordinates the entire pipeline:
- Collects system data from multiple API endpoints
- Sends structured request to Gemini 3
- Manages loading states and error handling
- Triggers re-generation in adaptive mode

#### 2. GeminiUIClient
**Location**: `src/lib/gemini/client.ts`

Interfaces with Gemini 3 API:
- Constructs detailed prompts following "The Adaptive Runtime" spec
- Enforces structured JSON output
- Handles API errors and retries

#### 3. LoadingAnimation
**Location**: `src/components/dynamic-ui/LoadingAnimation.tsx`

Provides impactful loading experience:
- Multi-stage progress visualization
- Smooth animations using Framer Motion
- Particle effects background

#### 4. DynamicRenderer
**Location**: `src/components/dynamic-ui/DynamicRenderer.tsx`

Safely executes generated code:
- Uses `react-live` for sandboxed execution
- Pre-loads common libraries (Lucide icons, Recharts, etc.)
- Provides error boundary with fallback UI
- Exposes AgentBridge for user actions

## 🎨 Customization

### Modify the UI Generation Prompt

Edit `DynamicUIOrchestrator.tsx`:

```tsx
<DynamicUIOrchestrator
  prompt="Create a minimal, zen-like dashboard with focus on critical metrics only"
  adaptive={false}
/>
```

### Enable Auto-Regeneration

Set `adaptive={true}` to regenerate UI every 30 seconds:

```tsx
<DynamicUIOrchestrator
  prompt="..."
  adaptive={true}  // Auto-regenerates every 30 seconds
/>
```

### Handle User Actions

```tsx
<DynamicUIOrchestrator
  prompt="..."
  onAction={(actionType, payload) => {
    if (actionType === 'start_agent') {
      // Handle agent start
      console.log('Starting agent:', payload.agentId);
    }
  }}
/>
```

## 🔒 Security

### Sandboxed Execution

Generated code runs in an isolated scope with:
- No access to global window object
- No network requests (uses pre-provided data)
- No file system access
- Limited to pre-approved libraries

### API Key Protection

- ✅ API key is stored in `.env` (never committed to git)
- ✅ Requests are made client-side (no server-side proxy needed)
- ✅ Rate limiting handled by Gemini API
- ⚠️ Monitor API usage to avoid unexpected costs

## 📊 Performance

### Optimization Strategies

1. **Caching**: Generated UI is cached until data changes
2. **Lazy Loading**: Adaptive UI only loads when toggle is enabled
3. **Progressive Enhancement**: Falls back to static UI if generation fails
4. **Adaptive Polling**: Only re-generates when data changes significantly

### Expected Generation Times

- Data Collection: ~1-2 seconds
- AI Generation: ~2-4 seconds
- Rendering: ~0.5 seconds
- **Total**: 3.5-6.5 seconds

## 🐛 Troubleshooting

### "VITE_GEMINI_API_KEY environment variable is not set"

**Solution**: Create `.env` file with your API key:
```bash
echo "VITE_GEMINI_API_KEY=your_key_here" > .env
npm run dev
```

### "UI Generation Error"

**Possible causes**:
1. Invalid API key
2. Gemini API quota exceeded
3. Network error

**Solution**: Check browser console for detailed error message

### Generated UI looks broken

**Possible causes**:
1. Missing dependencies in DynamicRenderer scope
2. Gemini generated invalid React code

**Solution**:
1. Click "Retry" button
2. Check LiveError output in developer tools
3. Disable Adaptive UI toggle and use static UI

### API calls failing (404 errors)

**Solution**: Ensure backend API is running:
```bash
# Check if server is running
curl http://localhost:4000/api/v1/agents

# If not running, start it
cd crates/miyabi-web-api
cargo run --release
```

## 📝 Examples

### Example Generated UI

The Adaptive UI can generate various layouts depending on system state:

**High Activity State**:
- Prominent agent status cards
- Real-time activity feed
- Resource utilization graphs
- Quick action buttons

**Low Activity State**:
- Calm, zen-like layout
- Focus on system health
- Suggested next actions
- Historical performance charts

**Error State**:
- Alert cards prominently displayed
- Troubleshooting guides
- Quick fix buttons
- System diagnostics

## 🔮 Future Enhancements

- [ ] Multi-language UI generation (EN/JA)
- [ ] Voice-controlled UI updates
- [ ] Persistent UI preferences
- [ ] A/B testing of different prompts
- [ ] User feedback loop for UI improvement
- [ ] Theme customization (dark mode, color schemes)
- [ ] Export generated UI as template

## 📚 Related Documentation

- [The Adaptive Runtime Spec](.claude/agents/The_Adaptive_Runtime.md)
- [Gemini 3 API Documentation](https://ai.google.dev/docs)
- [react-live Documentation](https://github.com/FormidableLabs/react-live)
- [Framer Motion Documentation](https://www.framer.com/motion/)

---

**Last Updated**: 2025-11-18
**Version**: 1.0.0
**Maintainer**: Miyabi Team
