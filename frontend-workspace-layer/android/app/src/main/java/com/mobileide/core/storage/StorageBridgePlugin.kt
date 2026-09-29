package com.mobileide.core.storage

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import java.io.File

/**
 * SAF / Scoped Storage bridge. On Android 11+ raw path manipulation is blocked,
 * so the terminal relies on MANAGE_EXTERNAL_STORAGE while this bridge exposes a
 * safe, permission-checked surface for the JS file-tree and editor.
 */
class StorageBridgePlugin(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "StorageBridgePlugin"

    @ReactMethod
    fun getDirectoryFiles(targetPath: String, promise: Promise) {
        try {
            val dir = File(targetPath)
            if (!dir.isDirectory) {
                promise.reject("NOT_A_DIRECTORY", "Path is not a directory: $targetPath")
                return
            }
            val entries: WritableArray = Arguments.createArray()
            dir.listFiles()
                ?.sortedWith(compareBy({ !it.isDirectory }, { it.name.lowercase() }))
                ?.forEach { file ->
                    entries.pushMap(
                        Arguments.createMap().apply {
                            putString("name", file.name)
                            putString("path", file.absolutePath)
                            putBoolean("isDirectory", file.isDirectory)
                            putDouble("size", file.length().toDouble())
                            putDouble("lastModified", file.lastModified().toDouble())
                        }
                    )
                }
            promise.resolve(entries)
        } catch (e: Exception) {
            promise.reject("READ_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun readFileContents(filePath: String, promise: Promise) {
        try {
            promise.resolve(File(filePath).readText())
        } catch (e: Exception) {
            promise.reject("READ_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun writeFileContents(filePath: String, content: String, promise: Promise) {
        try {
            File(filePath).writeText(content)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("WRITE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun createDirectory(parentPath: String, name: String, promise: Promise) {
        try {
            val created = File(parentPath, name).mkdirs()
            promise.resolve(created)
        } catch (e: Exception) {
            promise.reject("MKDIR_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun deletePath(targetPath: String, promise: Promise) {
        try {
            promise.resolve(File(targetPath).deleteRecursively())
        } catch (e: Exception) {
            promise.reject("DELETE_ERROR", e.message, e)
        }
    }
}
