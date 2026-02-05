# Issue #12: Memory Leak Fix Plan
## IPC Event Listener Cleanup for Terminal Unmount

**Issue**: [#12 - Memory leak: IPC event listeners not cleaned up on terminal unmount](https://github.com/ipdelete/vibe-playground/issues/12)

**Status**: ✅ FIXED in v0.4.3

---

## Problem Summary

When a `TerminalView` component unmounts, IPC event listeners for `terminal:data` and `terminal:exit` were not removed, causing memory leaks as listeners accumulated over time.

---

## Root Cause Analysis (DISCOVERED THROUGH DEBUGGING)

The issue was **two-fold**:

### Issue 1: IPC listeners not cleaned up
- `onData` and `onExit` in `preload.ts` didn't return cleanup functions
- TerminalView had no way to unsubscribe

### Issue 2: setTimeout not cleared on unmount (NEWLY DISCOVERED)
- React StrictMode mounts/unmounts/remounts components in development
- The setTimeout for PTY creation wasn't being cleared
- This caused **double PTY creation** and duplicate terminal output

---

## Solution Implemented

### 1. Updated `preload.ts` - Return cleanup functions

```typescript
onData: (callback) => {
  const handler = (_event, id, data) => callback(id, data);
  ipcRenderer.on('terminal:data', handler);
  return () => ipcRenderer.removeListener('terminal:data', handler);
},
onExit: (callback) => {
  const handler = (_event, id, exitCode) => callback(id, exitCode);
  ipcRenderer.on('terminal:exit', handler);
  return () => ipcRenderer.removeListener('terminal:exit', handler);
},
```

### 2. Updated `TerminalView.tsx` - Proper cleanup

- Added `initTimeoutRef` to track the PTY creation timeout
- Store cleanup functions from `onData`/`onExit`
- In useEffect cleanup:
  - Clear `initTimeoutRef` to prevent double PTY creation
  - Call IPC listener cleanup functions
  - Dispose xterm terminal
  - Reset `initializedRef`

---

## Files Modified

| File | Changes |
|------|---------|
| `src/preload.ts` | `onData`/`onExit` return cleanup functions, updated types |
| `src/renderer/components/CenterPane/TerminalView.tsx` | Added `initTimeoutRef`, proper cleanup |
| `src/renderer/components/CenterPane/TerminalView.test.tsx` | Updated mocks to return cleanup functions |
| `package.json` | Version bump to 0.4.3 |

---

## Testing

- ✅ 127 tests passing
- ✅ Terminal renders correctly (single prompt, no duplicates)
- ✅ Cleanup functions called on unmount
- ✅ No duplicate PTY creation in React StrictMode
