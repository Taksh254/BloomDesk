plugins {
    id("com.android.application") version "8.7.3"
}

android {
    namespace = "com.bloomdesk.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.bloomdesk.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        // Where the hosted BloomDesk web app lives, e.g. ./gradlew assembleRelease -PbloomdeskUrl=https://app.bloomdesk.in
        // Left empty, the app asks for the address on first launch (handy before the app is hosted).
        buildConfigField("String", "APP_URL", "\"${findProperty("bloomdeskUrl") ?: ""}\"")
    }

    buildFeatures { buildConfig = true }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
