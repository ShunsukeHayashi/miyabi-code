# Miyabi Desktop - Tauri Setup Guide

## Running the Application

The Miyabi Desktop application is built with Tauri and requires the Tauri runtime to function properly.

### ✅ Correct Way (Tauri Mode)

```bash
# Install dependencies (first time only)
npm install

# Run in Tauri development mode
npm run tauri dev
```

### ❌ Incorrect Way (Browser Mode - Limited Functionality)

```bash
# This only starts Vite dev server WITHOUT Tauri runtime
npm run dev  # ⚠️ Many features will not work!
```

## Why Tauri Mode is Required

Running `npm run dev` starts only the Vite development server, which runs the React frontend in a regular browser. This causes several issues:

1. **Tauri API unavailable**: Functions like `invoke()` and `listen()` will be undefined
2. **Backend commands fail**: All Rust backend integrations will fail
3. **No native features**: File system access, tmux integration, etc. won't work
4. **Console errors**: You'll see errors like "Cannot read properties of undefined (reading 'invoke')"

## Error Detection

The application now includes automatic Tauri runtime detection:

- **Yellow banner**: Displayed when running in browser mode (npm run dev)
- **No banner**: Running correctly in Tauri mode (npm run tauri dev)

## Architecture

```
miyabi-desktop/
├── src/                    # React frontend (TypeScript)
├── src-tauri/              # Rust backend (Tauri)
├── vite.config.ts          # Vite configuration
└── package.json            # NPM scripts
```

### Frontend Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **UI**: Tailwind CSS + Radix UI
- **State**: Zustand

### Backend Stack
- **Runtime**: Tauri 2
- **Language**: Rust 2021 Edition
- **Features**:
  - Agent execution via CLI
  - GitHub API integration
  - Tmux session management
  - Native OS integrations

## Development Workflow

### 1. Start Development Server

```bash
npm run tauri dev
```

This will:
1. Start Vite dev server on port 1420
2. Compile and run the Rust backend
3. Open the Tauri window with hot reload enabled

### 2. Make Changes

- Frontend changes (src/**): Hot reload automatically
- Backend changes (src-tauri/**): Requires manual restart

### 3. View Logs

- **Frontend logs**: Browser DevTools (Cmd+Option+I)
- **Backend logs**: Terminal where `tauri dev` is running

## Building for Production

```bash
# Build optimized binary
npm run tauri build
```

Output location:
- **macOS**: `src-tauri/target/release/bundle/macos/`
- **Windows**: `src-tauri/target/release/bundle/`
- **Linux**: `src-tauri/target/release/bundle/`

## Common Issues

### Issue: "Tauri runtime not available" error

**Cause**: Running `npm run dev` instead of `npm run tauri dev`

**Solution**: Use `npm run tauri dev`

### Issue: Backend commands not working

**Cause**: Rust backend not compiled or running

**Solution**:
1. Check `src-tauri/Cargo.toml` dependencies
2. Run `cargo build` in `src-tauri/` directory
3. Restart `npm run tauri dev`

### Issue: Port 1420 already in use

**Cause**: Previous dev server still running

**Solution**:
```bash
# Kill process on port 1420
lsof -ti:1420 | xargs kill -9

# Or change port in vite.config.ts
```

## Testing

```bash
# Run frontend tests
npm test

# Run Rust backend tests
cd src-tauri && cargo test
```

## Further Reading

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
