package com.mobileide.core

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.mobileide.core.storage.SecureKeystore
import com.mobileide.core.storage.StorageBridgePlugin
import com.mobileide.core.terminal.TerminalBridgePlugin

class CoreNativePackage : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(
            StorageBridgePlugin(reactContext),
            TerminalBridgePlugin(reactContext),
            SecureKeystore(reactContext)
        )

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
