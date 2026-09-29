# Mobile IDE Core

An industry-standard mobile IDE for Android: a touch-first code editor with a real
Linux shell (Alpine via libproot), full filesystem access (SAF + Scoped Storage),
git-diff decorations, and a full-page Copilot-style AI agent with BYOK keys.

## Architecture

```
/mobile-ide-core
├── /frontend-workspace-layer        # React Native app (UI + services + Android project)
│   ├── /android                     # Gradle project (buildable APK)
│   │   └── /app/src/main/java/com/mobileide/core
│   │       ├── /storage             # SAF / Scoped Storage bridge + Android Keystore
│   │       └── /terminal            # libproot PTY wrapper + native stream loop
│   ├── /components                  # Editor, Terminal, FileTree, Welcome, CommandBar, AI, Shortcuts
│   ├── /services                    # AiAgentEngine, NativeBridge, FileSystemBridge, Terminal
│   ├── App.tsx                      # screen router (welcome / workspace / settings / shortcuts)
│   └── package.json
├── /alpine-bootstrap                # Packaged light rootfs base image (asset cache)
│   ├── build-rootfs.sh              # fetch + repack Alpine minirootfs
│   ├── Dockerfile                   # full toolchain rootfs via Docker
│   └── packages.txt                 # gcc/g++/nodejs/python3/git/...
└── .github/workflows/build-apk.yml  # CI: build + upload release APK
```

## Feature matrix

- **Welcome Screen** — recent projects, clone-from-Git, new workspace, SSH connect, keyboard layout picker.
- **Full-page AI Copilot** — model selector (OpenAI/Claude/DeepSeek), new-chat, suggested prompts,
  streaming responses, code-diff preview with Apply/Discard, persistent per-workspace history.
- **Dual auth** — Mode 1 (BYOK, no login, keys in Android Keystore) / Mode 2 (OAuth GitHub/Google, managed gateway).
- **Mobile Command Bar** — touch accessory deck above the keyboard (brackets, symbols, Tab, undo/redo, AI trigger).
- **Git-Diff Visualizers** — green/red line decorations with Accept/Reject popups.
- **Keyboard Shortcuts** — full reference screen (editor, terminal, touch gestures).
- **AI Error Telemetry** — floating "Fix with AI Agent" badge on compile errors.
- **Sandbox dependency caching** — offline-preloaded npm chunks.

## Build

### Local (Android Studio / CLI)

```bash
cd frontend-workspace-layer
npm install
cd android
./gradlew assembleDebug      # debug APK (loads JS from Metro)
./gradlew assembleRelease    # release APK (bundles JS, signed with debug key)
```

The APK is written to `frontend-workspace-layer/android/app/build/outputs/apk/`.

### CI (GitHub Actions)

Pushing to `main` (or a manual `workflow_dispatch`) triggers `.github/workflows/build-apk.yml`,
which installs dependencies, generates a debug keystore, runs `assembleRelease`, and uploads the
APK as a build artifact.

## Alpine rootfs

The terminal mounts a packaged Alpine rootfs at `/` via libproot, so `apk add gcc g++ nodejs`
compiles directly against the local environment. Build the rootfs with:

```bash
cd alpine-bootstrap
./build-rootfs.sh arm64 dist          # or: docker build -t mobile-ide-rootfs .
```

See `alpine-bootstrap/README.md` for packaging into app assets.
