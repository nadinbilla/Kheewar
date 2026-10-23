# Kheewar — Full-stack Arabic Conversation World

Kheewar adalah starter project website pembelajaran **Maharah Kalam** dengan dunia 3D, avatar, lokasi virtual, misi percakapan, chat ruang, autentikasi, dan opsi voice chat antarpengguna. Aplikasi ini dirancang untuk latihan **antarmanusia**, bukan percakapan dengan AI.

## Yang sudah tersedia

- Landing page dan UI responsif berbahasa Indonesia.
- Dunia 3D bergaya stylized dengan kafe yang lebih detail, material kayu, jendela, konter kopi, papan menu Arab, tanaman, furnitur, dan lampu gantung.
- Lima lokasi/ruang: kafe, rumah, kantor, kampus, dan pasar.
- Avatar dengan nama, bendera negara, wajah, pakaian, sepatu, gerakan idle, dan animasi jalan sederhana.
- Kamera bebas: drag untuk memutar, scroll/pinch untuk zoom, serta pan untuk menggeser pandangan.
- Kontrol keyboard (WASD/panah) dan D-pad layar sentuh untuk perangkat mobile.
- Dukungan opsional untuk model `public/models/cafe.glb`/`cafe.gltf` dan `public/models/avatar.glb`/`avatar.gltf`; jika file tidak ada atau gagal dimuat, scene procedural digunakan sebagai fallback.
- Mode demo yang bisa dibuka tanpa konfigurasi backend.
- Login/registrasi Supabase Auth.
- Supabase Realtime Presence/Broadcast untuk kehadiran avatar, posisi, dan chat ruang.
- Chat ruang yang tersimpan ke tabel database saat Supabase sudah disiapkan.
- Endpoint token LiveKit untuk voice chat WebRTC (opsional, perlu kredensial LiveKit).
- SQL schema dan RLS dasar untuk profil, pesan, serta progres belajar.

## Persyaratan

- Node.js 20.9+ (disarankan Node.js 22 LTS)
- npm
- Akun GitHub dan Vercel untuk publikasi
- Akun Supabase untuk autentikasi dan fitur multi-pengguna
- Akun LiveKit Cloud (opsional) untuk voice chat

## 1. Jalankan lokal

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`. Tanpa env Supabase, website berjalan dalam **mode demo lokal**: UI, scene 3D, gerakan avatar, pergantian lokasi, misi, dan chat lokal dapat diuji. Demo lokal tidak menyambungkan pengguna dari perangkat/browser lain.

Di Windows PowerShell, salin file contoh dengan:

```powershell
Copy-Item .env.example .env.local
```

## 2. Aktifkan backend Supabase

1. Buat project di [Supabase](https://supabase.com/).
2. Buka **Project Settings → API** (atau Connect) dan salin Project URL serta publishable/anon key.
3. Isi `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

4. Buka **SQL Editor** di Supabase dan jalankan seluruh isi `supabase/schema.sql`.
5. Di **Authentication → URL Configuration**, atur Site URL untuk lokal (`http://localhost:3000`) dan tambahkan redirect URL `http://localhost:3000/**`. Setelah deploy, tambahkan URL Vercel juga.
6. Jalankan ulang `npm run dev`, daftar akun melalui `/login`, kemudian buka `/world`.

**Catatan keamanan:** jangan pernah menaruh `service_role` key di `NEXT_PUBLIC_*`, GitHub, atau browser. Project ini hanya menggunakan public/anon key di browser dan cookie auth di server.

### Menguji realtime

- Buka dua browser/perangkat berbeda.
- Buat akun berbeda dan login ke kedua perangkat.
- Pilih nama ruang yang sama, misalnya **Kafe Pemula**.
- Presence dan posisi avatar dikirim melalui Supabase Realtime; pesan teks disiarkan melalui channel ruang dan disimpan di `conversation_messages`.
- Untuk kebijakan channel yang lebih ketat, tambahkan Supabase Realtime Authorization/private-channel policies sebelum dipakai publik. Prototipe ini menggunakan channel bernama ruang untuk memudahkan uji awal.

## 3. Aktifkan voice chat LiveKit (opsional)

1. Buat project di [LiveKit Cloud](https://cloud.livekit.io/).
2. Ambil WebSocket URL, API key, dan API secret.
3. Isi environment variables:

```dotenv
NEXT_PUBLIC_LIVEKIT_URL=wss://YOUR_PROJECT.livekit.cloud
LIVEKIT_API_KEY=YOUR_LIVEKIT_API_KEY
LIVEKIT_API_SECRET=YOUR_LIVEKIT_API_SECRET
```

4. Restart server. Login dengan akun Supabase, buka ruang yang sama, lalu klik **Mulai voice**.

Token LiveKit dibuat server-side setelah memverifikasi user Supabase. Jangan pernah mengirim API secret ke client. Untuk production, atur batas peserta, rate limit endpoint, moderasi, dan kebijakan privasi audio.

## 4. Upload ke GitHub

Gunakan repository yang sudah ada: `https://github.com/nadinbilla/Kheewar`. Jangan menambahkan `.env.local` ke repository. Buat branch pengembangan terlebih dahulu agar branch `main` tetap aman.

```bash
git switch -c improve-kheewar-3d
git add components/WorldScene.tsx app/globals.css app/page.tsx app/login/page.tsx app/layout.tsx app/api/livekit/token/route.ts lib/config.ts middleware.ts public/models package.json README.md 3D_UPGRADE.md
git commit -m "Improve Kheewar stylized 3D cafe"
git push -u origin improve-kheewar-3d
```


## 5. Deploy ke Vercel

1. Buka [Vercel](https://vercel.com/) dan pilih **Add New → Project**.
2. Pilih repository `nadinbilla/Kheewar` yang sudah ada.
3. Framework preset: Next.js; build command dan output dapat memakai default.
4. Tambahkan environment variables yang sama seperti `.env.local` di Project Settings → Environment Variables. Tambahkan Supabase vars wajib; LiveKit vars hanya jika voice chat diaktifkan.
5. Deploy.
6. Tambahkan domain Vercel ke Supabase Auth → URL Configuration (Site URL dan Redirect URLs), lalu redeploy bila perlu.

## Struktur utama

```text
app/
  api/livekit/token/route.ts  # server endpoint untuk token voice room
  login/page.tsx              # daftar dan masuk
  world/page.tsx              # dunia belajar
  page.tsx                    # landing page
components/
  WorldExperience.tsx         # state aplikasi, rooms, presence, chat, profil
  WorldScene.tsx              # scene 3D dan kontrol avatar
  VoiceChat.tsx               # UI koneksi LiveKit
lib/
  rooms.ts                    # konfigurasi ruang dan negara
  supabase/                   # browser/server clients dan middleware
supabase/schema.sql           # tabel, trigger profil, dan RLS
```

## Peningkatan visual 3D Kheewar

- Kafe sekarang menggunakan scene stylized procedural yang lebih rinci sebagai fallback bawaan.
- `WorldScene.tsx` mendeteksi model lokal `public/models/cafe.glb`/`cafe.gltf` dan `public/models/avatar.glb`/`avatar.gltf`. Model tidak disertakan karena perlu dipilih berdasarkan lisensi dan kualitas; petunjuk format dan orientasi ada di `public/models/README.md`.
- `cafe.glb` atau `cafe.gltf` menggantikan seluruh interior procedural jika tersedia dan berhasil dimuat. Normalisasikan ukuran serta titik asal model sesuai petunjuk sebelum digunakan.
- `avatar.glb` atau `avatar.gltf` sebaiknya berupa karakter rigged dengan animasi bernama `Idle` dan `Walk`. Jika model tidak ada/gagal dimuat, avatar procedural tetap ditampilkan.
- Kamera mendukung rotasi bebas, zoom, dan pan; perangkat sentuh mendapat kontrol D-pad untuk gerak avatar.
- Kualitas gambar dibatasi pada DPR maksimum 1.45, memakai AdaptiveDpr saat interaksi berat, dan satu directional shadow map 1024 untuk menyeimbangkan detail dengan performa mobile.

## Pengujian yang harus dilakukan setelah instalasi dependency

```bash
npm install
npm run build
npm run dev
```

Buka `/world`, lalu uji rotasi kamera dengan drag, zoom dengan scroll/pinch, pan kamera, gerak WASD, dan D-pad pada HP. Uji juga mode demo dan backend yang dikonfigurasi. Build penuh belum dapat diverifikasi di lingkungan pembuatan arsip karena akses registry npm mengalami kegagalan DNS (`EAI_AGAIN`); jalankan `npm run build` di laptop atau CI sebelum deploy.

## Batasan prototype saat ini

- Aset GLB/GLTF eksternal tidak disertakan; scene procedural tetap berjalan sampai kamu menambahkan model yang lisensinya sesuai.
- Mode demo hanya lokal; realtime antarpengguna memerlukan Supabase yang dikonfigurasi dan dua akun berbeda.
- Voice chat memerlukan akun LiveKit, konfigurasi server, dan izin mikrofon.
- Pencarian partner otomatis, daftar teman persisten, moderasi lanjutan, dan evaluasi pelafalan belum diimplementasikan penuh.
- Chat persisten memerlukan SQL schema dan kebijakan RLS diterapkan dengan benar.
- Sebelum peluncuran publik, tinjau aturan Realtime channel, pembatasan spam, validasi profil, laporan/blokir, dan kebijakan perlindungan pengguna.

## Troubleshooting

- **Canvas kosong:** gunakan browser WebGL modern, perbarui driver grafis, lalu buka DevTools Console.
- **Tidak bisa daftar:** periksa Supabase URL/key, email confirmation, dan Redirect URLs.
- **Pengguna tidak muncul:** pastikan kedua akun memakai `room_id` yang sama, Supabase Realtime aktif, dan browser tidak memblokir koneksi.
- **Pesan tidak tersimpan:** jalankan `supabase/schema.sql` dan periksa policy/RLS.
- **Voice chat gagal:** periksa LiveKit URL/key/secret, login Supabase, izin mikrofon, dan URL `wss://`.

## Lisensi

Starter project ini dapat kamu modifikasi untuk proyek pembelajaranmu. Periksa lisensi masing-masing dependency dan aset tambahan yang kamu gunakan.
