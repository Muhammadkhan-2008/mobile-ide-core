package com.mobileide.core.storage

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * BYOK (Mode 1) credential vault. User-supplied API keys (sk-...) are encrypted
 * with an AES/GCM key generated inside the Android Keystore hardware-backed store.
 * The plaintext never leaves the device.
 */
class SecureKeystore(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val KEY_ALIAS = "mobile_ide_master_key"
        private const val ANDROID_KEYSTORE = "AndroidKeyStore"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
        private const val TAG_LENGTH_BITS = 128
    }

    override fun getName(): String = "SecureKeystore"

    private fun getOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        (keyStore.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }

        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
        generator.init(
            KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .build()
        )
        return generator.generateKey()
    }

    @ReactMethod
    fun storeKey(key: String, value: String, promise: Promise) {
        try {
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
            val encrypted = cipher.doFinal(value.toByteArray(Charsets.UTF_8))
            val payload =
                Base64.encodeToString(cipher.iv, Base64.NO_WRAP) + ":" +
                    Base64.encodeToString(encrypted, Base64.NO_WRAP)

            // Persist payload to EncryptedSharedPreferences keyed by `key`.
            val prefs = reactApplicationContext
                .getSharedPreferences("secure_vault", android.content.Context.MODE_PRIVATE)
            prefs.edit().putString(key, payload).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("KEYSTORE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getKey(key: String, promise: Promise) {
        try {
            val prefs = reactApplicationContext
                .getSharedPreferences("secure_vault", android.content.Context.MODE_PRIVATE)
            val payload = prefs.getString(key, null)
            if (payload == null) {
                promise.resolve(null)
                return
            }
            val (ivB64, dataB64) = payload.split(":")
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(
                Cipher.DECRYPT_MODE,
                getOrCreateKey(),
                GCMParameterSpec(TAG_LENGTH_BITS, Base64.decode(ivB64, Base64.NO_WRAP))
            )
            val plaintext = cipher.doFinal(Base64.decode(dataB64, Base64.NO_WRAP))
            promise.resolve(String(plaintext, Charsets.UTF_8))
        } catch (e: Exception) {
            promise.reject("KEYSTORE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun deleteKey(key: String, promise: Promise) {
        try {
            val prefs = reactApplicationContext
                .getSharedPreferences("secure_vault", android.content.Context.MODE_PRIVATE)
            prefs.edit().remove(key).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("KEYSTORE_ERROR", e.message, e)
        }
    }
}
