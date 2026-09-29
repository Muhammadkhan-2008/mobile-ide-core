#!/usr/bin/env bash
#
# build-rootfs.sh — produce a portable Alpine minirootfs tarball that the
# Android app unpacks into /data/data/com.mobileide.core/files/alpine-rootfs
# and mounts via libproot at `/`.
#
# Usage:
#   ./build-rootfs.sh [ARCH] [OUTPUT_DIR]
#
#   ARCH       one of: arm64, armhf, amd64, x86  (default: arm64)
#   OUTPUT_DIR where to write alpine-rootfs.tar.gz (default: ./dist)
#
# Requires: curl, tar, gzip. Optionally uses docker for a richer image.

set -euo pipefail

ARCH="${1:-arm64}"
OUTPUT_DIR="${2:-dist}"
ALPINE_VERSION="3.19.1"
MIRROR="https://dl-cdn.alpinelinux.org/alpine"

mkdir -p "$OUTPUT_DIR"

ROOTFS_DIR="$(mktemp -d)"
trap 'rm -rf "$ROOTFS_DIR"' EXIT

echo "[alpine] downloading minirootfs for $ARCH (v$ALPINE_VERSION)"
MINIROOTFS="alpine-minirootfs-${ALPINE_VERSION}-${ARCH}.tar.gz"
curl -fsSL "$MIRROR/v${ALPINE_VERSION%.*}/releases/$ARCH/$MINIROOTFS" -o "$ROOTFS_DIR/$MINIROOTFS"

echo "[alpine] extracting"
mkdir -p "$ROOTFS_DIR/rootfs"
tar -xzf "$ROOTFS_DIR/$MINIROOTFS" -C "$ROOTFS_DIR/rootfs"

# Configure package repositories so `apk add` works inside the sandbox.
echo "[alpine] configuring repositories"
cat > "$ROOTFS_DIR/rootfs/etc/apk/repositories" <<EOF
$MIRROR/v${ALPINE_VERSION%.*}/main
$MIRROR/v${ALPINE_VERSION%.*}/community
EOF

# Install the runtime packages (requires chroot or proot on the host).
if command -v proot >/dev/null 2>&1; then
  echo "[alpine] installing packages via proot"
  proot -r "$ROOTFS_DIR/rootfs" -b /dev -b /proc -b /sys \
    /bin/sh -c "apk update && apk add $(tr '\n' ' ' < packages.txt)"
else
  echo "[alpine] proot not found — skipping package install (base rootfs only)."
  echo "[alpine] install 'proot' or build via Dockerfile for a full toolchain."
fi

echo "[alpine] repacking"
tar -czf "$OUTPUT_DIR/alpine-rootfs.tar.gz" -C "$ROOTFS_DIR/rootfs" .

echo "[alpine] done -> $OUTPUT_DIR/alpine-rootfs.tar.gz"
