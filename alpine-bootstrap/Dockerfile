# Dockerfile — build a full Alpine rootfs (with compiler toolchain) that can be
# packaged and shipped inside the Android APK assets. This is the recommended
# path when the host lacks proot.
#
#   docker build -t mobile-ide-rootfs .
#   docker run --rm -v "$PWD/dist:/out" mobile-ide-rootfs

FROM alpine:3.19

RUN apk add --no-cache \
    alpine-base bash coreutils git openssh-client curl wget \
    gcc g++ make cmake musl-dev \
    python3 py3-pip nodejs npm vim nano

# Export the rootfs as a tarball.
CMD ["sh", "-c", "tar -czf /out/alpine-rootfs.tar.gz --exclude=/proc --exclude=/sys --exclude=/dev --exclude=/out -C / ."]
