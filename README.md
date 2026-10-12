# LifeBIT 🏃‍♂️💨
> **Aplikasi Pelacak Lari & Pemantau Kesehatan Cerdas Berbasis React Native & Expo**

[![React Native](https://img.shields.io/badge/React_Native-0.86.3-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK-57-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web-brightgreen)](#)

---

## 📌 Tentang LifeBIT

**LifeBIT** adalah aplikasi kebugaran all-in-one yang dirancang untuk memantau aktivitas lari, menghitung kesehatan fisik (BMI, BMR, TDEE), serta melacak target mingguan secara presisi. Dilengkapi dengan **Peta Satelit Hybrid Esri** yang 100% interaktif dan sistem penyaringan GPS multi-lapis untuk menghasilkan visualisasi rute yang mulus dan bebas jitter.

---

## ✨ Fitur Unggulan

### 1. 🛰️ Pelacak Lari Real-Time (*Live GPS Tracker*)
- **Peta Satelit HD Hybrid**: Menampilkan citra satelit Esri beresolusi tinggi dengan overlay jalan dan batas wilayah yang interaktif (geser, cubit untuk memperbesar, tombol zoom `+`/`−`).
- **3-Layer GPS Accuracy & Path Smoothing Filter**:
  - *Accuracy Gate*: Mengeliminasi koordinat GPS dengan akurasi buruk (> 18 meter) agar titik tidak melompat.
  - *EMA Smoothing (Exponential Moving Average, $\alpha = 0.45$)*: Mengurangi getaran horizontal (*jitter*) saat berjalan/berlari lurus sehingga lintasan rute terlihat lurus dan rapi tanpa efek zig-zag.
  - *Displacement & Motion Gate*: Menghitung akumulasi jarak dan durasi hanya saat pengguna bergerak aktif.
- **Metrik Lengkap Real-Time**: Total jarak tempuh (km), durasi aktif, *pace* (menit/km), kalori terbakar (rumus MET dinamis), dan penghitung langkah (*step counter* via sensor giroskop/akselerometer).

### 2. 📜 Riwayat Sesi Lari (*Workout History*)
- **Waktu Real-Time WIB Presisi**: Sesi lari disimpan dengan format tanggal dan waktu Indonesia yang akurat (contoh: `Selasa, 29 Sep 2026 • 16:39 WIB`).
- **Peta Rute Interaktif**: Setiap sesi menampilkan pratinjau lintasan lari lengkap dengan pin awal (*Start*) dan pin akhir (*Finish*) yang dapat digeser dan di-zoom langsung.
- **Manajemen Sesi**: Kemudahan menghapus sesi individual maupun membersihkan seluruh riwayat sesi yang tersimpan di penyimpanan lokal (*AsyncStorage*).

### 3. ⚖️ Profil Kesehatan & Kalkulator BMI
- **Kalkulator BMI (Indeks Massa Tubuh)**: Klasifikasi otomatis status berat badan (*Kurus*, *Normal*, *Kelebihan Berat*, *Obesitas*) lengkap dengan saran kesehatan.
- **Rentang Berat Badan Ideal**: Rekomendasi berat badan ideal berdasarkan tinggi badan pengguna.
- **Perhitungan BMR & TDEE**: Menggunakan formula ilmiah *Mifflin-St Jeor* untuk memperkirakan kebutuhan kalori harian.
- **Rekomendasi Target Mingguan Otomatis**: Rekomendasi jarak lari mingguan yang disesuaikan secara dinamis berdasarkan usia, jenis kelamin, dan BMI.

### 4. 🏆 Target Mingguan & Rekor Statistik
- Pelacakan progres target mingguan (km lari yang telah ditempuh vs target).
- Ringkasan total jarak keseluruhan, akumulasi kalori terbakar, dan durasi lari.

### 5. ⚡ Optimasi Ukuran File APK
- Konfigurasi **ABI Splitting** (`arm64-v8a`, `armeabi-v7a`, `x86_64`, `x86`).
- **R8 Code Shrinking & Resource Minification** aktif untuk build rilis.
- Ukuran file APK rilis berhasil ditekan dari **~104 MB** menjadi hanya **36 MB** (`arm64-v8a`), sangat ringan dan hemat kuota untuk perangkat pengguna.

---

## 🛠️ Arsitektur & Teknologi

| Komponen | Teknologi / Pustaka |
| :--- | :--- |
| **Framework Utama** | React Native `0.86.3` via Expo SDK `57` (Expo Router) |
| **Bahasa Pemrograman** | TypeScript `6.0` |
| **Peta & Pemetaan** | Leaflet.js `1.9.4` via `react-native-webview`, Esri World Imagery Satellite |
| **Sensor & Lokasi** | `expo-location`, `expo-sensors` (Accelerometer, Gyroscope) |
| **Penyimpanan Lokal** | `@react-native-async-storage/async-storage` |
| **Ikon & Antarmuka** | `@expo/vector-icons` (Ionicons, MaterialCommunityIcons, FontAwesome5) |
| **Animasi & Gestur** | `react-native-reanimated`, `react-native-gesture-handler` |

---

## 📁 Struktur Direktori

```text
LifeBIT/
├── android/                 # Konfigurasi native Android & Gradle
│   └── app/
│       ├── build.gradle     # Konfigurasi ABI Split & R8 Proguard
│       └── src/main/        # AndroidManifest & aset native
├── assets/                  # Logo aplikasi, ikon, dan splash screen
│   └── images/
├── src/
│   ├── app/
│   │   ├── _layout.tsx      # Root layout & routing
│   │   └── index.tsx        # Dashboard utama (Single Page Dashboard)
│   ├── components/
│   │   ├── BMITracker.tsx   # Modal profil & kalkulator BMI/BMR
│   │   ├── OSMMap.tsx       # Komponen Peta Satelit Esri Leaflet (100% Interaktif)
│   │   ├── RunHistory.tsx   # Daftar riwayat sesi lari tersimpan
│   │   ├── RunTracker.tsx   # Mesin pelacak lari, GPS filter & live stats
│   │   └── StravaStats.tsx  # Statistik pencapaian & target mingguan
│   ├── types/
│   │   └── fitness.ts       # Definisi tipe TypeScript data kesehatan & sesi
│   └── utils/
│       └── fitnessHelpers.ts# Rumus BMI, BMR, TDEE, Haversine, & format WIB
├── app.json                 # Konfigurasi metadata Expo
├── package.json             # Daftar dependensi & npm scripts
└── tsconfig.json            # Konfigurasi TypeScript
```

---

## 🚀 Memulai (Get Started)

### Prasyarat
- [Node.js](https://nodejs.org/) (versi 18 atau lebih baru)
- npm atau yarn
- Android Studio & Android SDK (jika ingin menjalankan di emulator / build native Android)

### 1. Kloning & Instalasi Dependensi
```bash
# Masuk ke direktori proyek
cd LifeBIT

# Pasang dependensi
npm install
```

### 2. Menjalankan Aplikasi dalam Mode Pengembangan
```bash
# Menjalankan Expo development server
npx expo start

# Menjalankan langsung pada emulator / perangkat Android
npm run android

# Menjalankan pada browser Web
npm run web
```

---

## 📦 Membangun File APK Release

Proyek ini telah dikonfigurasi dengan *ABI Splitting* dan *ProGuard/R8* untuk menghasilkan APK yang sangat teroptimasi:

```bash
cd android
./gradlew assembleRelease
```

File APK rilis yang dihasilkan berada di:
`android/app/build/outputs/apk/release/`

| Varian APK | Ukuran | Peruntukan |
| :--- | :---: | :--- |
| **`app-arm64-v8a-release.apk`** | **~36 MB** | **Perangkat Android modern (Rekomendasi Utama)** |
| `app-armeabi-v7a-release.apk` | ~30 MB | Perangkat Android 32-bit |
| `app-x86_64-release.apk` | ~38 MB | Emulator Android x86_64 |
| `app-universal-release.apk` | ~95 MB | Paket gabungan seluruh arsitektur |

---

## 📄 Lisensi

Proyek ini didistribusikan di bawah lisensi **MIT**. Lihat file [LICENSE](LICENSE) untuk rincian lebih lanjut.
