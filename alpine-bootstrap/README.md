# Alpine Bootstrap (rootfs)

A packaged, lightweight Alpine Linux rootfs stored in the app's asset cache and
unpacked to `/data/data/com.mobileide.core/files/alpine-rootfs` on first launch.

The native terminal layer (`TerminalBridgePlugin`) launches `proot -r <rootfs>`
so that `execve()` calls resolve against Alpine's glibc/musl environment,
enabling `apk add gcc g++ nodejs` and direct local compilation.

## Building the rootfs

```bash
# On a Linux host with proot + alpine available:
mkdir -p alpine-rootfs
wget -qO- https://dl-cdn.alpinelinux.org/alpine/v3.19/releases/x86_64/alpine-minirootfs-3.19.1-x86_64.tar.gz \
  | tar -xz -C alpine-rootfs

# Pre-install the toolchain so it ships in the asset cache (offline-ready):
proot -r alpine-rootfs -b /dev -b /proc -b /sys /bin/sh -c \
  "apk add --no-cache gcc g++ make nodejs npm python3 git openssh"
```

## Packaging into the APK

1. Place the resulting `alpine-rootfs/` directory under `android-native-layer/src/main/assets/`.
2. On first launch, `MainApplication` (or a bootstrap service) copies the asset
   to the app's internal files dir and verifies the checksum.
3. The terminal then mounts it via `proot` as described above.

## Sandbox dependency caching

Common npm packages (web tooling, framework templates) are pre-downloaded as
compressed chunks into the asset cache so that `npm install` is fast and works
offline. See `frontend-workspace-layer/services/` for the cache manifest format.
