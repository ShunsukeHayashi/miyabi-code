# Bug Fix Summary: Tauri API Error Handling

## Date
2025-11-01

## Issue
The Miyabi Desktop application was throwing multiple runtime errors when run in browser mode (`npm run dev`) instead of Tauri mode (`npm run tauri dev`):

```
TypeError: Cannot read properties of undefined (reading 'invoke')
TypeError: Cannot read properties of undefined (reading 'transformCallback')
TypeError: this.emitter.setMaxListeners is not a function
```

## Root Cause
The application was using Tauri APIs (`invoke`, `listen`) without checking if the Tauri runtime was available. When running in browser mode (Vite dev server only), these APIs are undefined, causing the errors.

## Solution

### 1. Created Safe Tauri API Wrappers (`src/lib/tauri-utils.ts`)

Added utility functions to safely interact with Tauri APIs:

- **`isTauriAvailable()`**: Detects if Tauri runtime is present
- **`safeInvoke()`**: Wraps `invoke` with availability check and error handling
- **`safeListen()`**: Wraps `listen` with availability check and error handling
- **`getTauriStatusMessage()`**: Returns user-friendly status message

Benefits:
- Prevents undefined errors when Tauri is not available
- Provides clear console warnings to developers
- Returns sensible defaults (empty arrays, null values)

### 2. Updated API Modules

Modified the following files to use safe wrappers:

#### `src/lib/agent-api.ts`
- Replaced direct `invoke()` calls with `safeInvoke()`
- Replaced direct `listen()` calls with `safeListen()`
- Updated return types to handle null cases

#### `src/lib/github-api.ts`
- Same updates as agent-api.ts
- Returns empty arrays when Tauri unavailable (e.g., `listIssues()` returns `[]`)

#### `src/components/TmuxManager.tsx`
- Updated all Tauri command invocations to use `safeInvoke()`
- Handles null responses gracefully

### 3. Added User-Facing Status Indicator

Created `src/components/TauriStatusIndicator.tsx`:

- **Yellow banner**: Displayed when running in browser mode
- **Clear message**: "Use 'npm run tauri dev' for full functionality"
- **Automatic hiding**: Banner hidden when in proper Tauri mode

Integrated into `src/App.tsx` at the top level.

### 4. Created Documentation

Added `TAURI_SETUP.md` explaining:
- Correct vs incorrect ways to run the app
- Why Tauri mode is required
- Development workflow
- Common issues and solutions

## Testing

### Browser Mode (npm run dev)
✅ No console errors
✅ Yellow warning banner visible
✅ API calls fail gracefully with warnings
✅ UI remains usable (with limited functionality)

### Tauri Mode (npm run tauri dev)
✅ No warning banner
✅ All Tauri APIs work correctly
✅ Full functionality available

## Files Changed

### Created
- `src/lib/tauri-utils.ts` - Safe API wrappers
- `src/components/TauriStatusIndicator.tsx` - Status indicator UI
- `TAURI_SETUP.md` - Setup documentation
- `BUGFIX_SUMMARY.md` - This file

### Modified
- `src/lib/agent-api.ts` - Use safe wrappers
- `src/lib/github-api.ts` - Use safe wrappers
- `src/components/TmuxManager.tsx` - Use safe wrappers
- `src/App.tsx` - Add status indicator

## Impact

### Before Fix
- Application crashes when run in browser mode
- Confusing error messages
- Poor developer experience
- No guidance on correct usage

### After Fix
- Graceful degradation when Tauri unavailable
- Clear warnings and guidance
- Better developer experience
- Documentation for proper setup

## Recommendations

1. **Always run with Tauri**: Use `npm run tauri dev` during development
2. **Check status indicator**: Yellow banner means you're in browser mode
3. **Read setup guide**: Refer to `TAURI_SETUP.md` for details
4. **CI/CD consideration**: Ensure build pipelines use Tauri mode

## Future Improvements

1. Add TypeScript strict mode compatibility checks
2. Create automated tests for both Tauri and browser modes
3. Add telemetry to track browser mode usage
4. Consider mock Tauri API for testing in CI/CD

## Notes

The EventEmitter error (`setMaxListeners is not a function`) was a side effect of the Tauri API failures. The custom EventEmitter implementation in `src/utils/EventEmitter.ts` already had the method defined - the error occurred because event listener setup was failing due to undefined Tauri APIs.
