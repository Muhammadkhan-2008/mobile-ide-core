package com.mobileide.core.terminal

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import java.io.File

/**
 * Native PTY stream loop. Spawns a sandboxed shell through libproot, which
 * intercepts execve() and mounts the packaged Alpine rootfs at `/` so that
 * `apk add gcc g++ nodejs` compiles directly against the local environment.
 */
class TerminalBridgePlugin(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val ROOTFS_PATH = "/data/data/com.mobileide.core/files/alpine-rootfs"
    }

    private var ptyProcess: Process? = null
    private var streamThread: Thread? = null

    override fun getName(): String = "TerminalBridgePlugin"

    @ReactMethod
    fun createPtySession(workspacePath: String) {
        destroySession()

        val rootfs = File(ROOTFS_PATH)
        val command = if (rootfs.exists()) {
            listOf(
                "proot",
                "-r", ROOTFS_PATH,
                "-b", "/dev",
                "-b", "/proc",
                "-b", "/sys",
                "-b", "/storage/emulated/0:/sdcard",
                "-w", workspacePath,
                "/bin/sh"
            )
        } else {
            // Fallback: plain sh while the rootfs is still unpacking.
            listOf("/system/bin/sh", "-c", "cd \"$workspacePath\" && exec sh")
        }

        ptyProcess = ProcessBuilder(command)
            .redirectErrorStream(true)
            .start()

        streamThread = Thread {
            ptyProcess?.inputStream?.bufferedReader()?.use { reader ->
                val buffer = CharArray(4096)
                while (true) {
                    val count = reader.read(buffer)
                    if (count == -1) break
                    emit("onPtyData", String(buffer, 0, count))
                }
            }
            emit("onPtyExit", "")
        }.apply { isDaemon = true; start() }
    }

    @ReactMethod
    fun writeToPtyStream(input: String) {
        try {
            ptyProcess?.outputStream?.write(input.toByteArray(Charsets.UTF_8))
            ptyProcess?.outputStream?.flush()
        } catch (_: Exception) {
            // Process exited; ignore late writes.
        }
    }

    @ReactMethod
    fun resizePty(columns: Int, rows: Int) {
        // PTY ioctl(TIOCSWINSZ) goes here once a real pty (not a pipe) is used.
    }

    @ReactMethod
    fun destroySession() {
        try {
            ptyProcess?.destroy()
        } catch (_: Exception) {
        }
        ptyProcess = null
        streamThread = null
    }

    private fun emit(eventName: String, data: String) {
        reactApplicationContext
            .getJSModule(RCTDeviceEventEmitter::class.java)
            .emit(eventName, data)
    }
}
