# Kheewar — Avatar Creator 3D

Ini adalah source code **Kheewar versi Avatar Creator** yang dikembangkan dari versi upgrade Kheewar yang sebelumnya. Struktur Next.js tetap utuh sehingga bisa dikirim ke repo GitHub lama.

## Fitur baru

- Halaman `/avatar` untuk membuat dan mengedit avatar dengan nama tampilan yang bisa diubah (2–24 karakter).
- Preview voxel/avatar 3D yang bisa diputar dan di-zoom pada komputer maupun HP.
- Pencarian negara dan pilihan bendera.
- Karakter perempuan dengan hijab / khimar; karakter laki-laki dengan peci atau tanpa peci, **selalu memakai celana panjang**.
- Pilihan warna kulit, warna pakaian, gaya santai/formal/tradisional, dan level bahasa Arab.
- Tombol **Simpan & Masuk Dunia**.
- **Model avatar yang sama** dipakai pada preview dan ruang 3D (`components/avatar/VoxelAvatar.tsx`).
- Pemilihan identitas/penampilan dikirimkan melalui Supabase Realtime untuk avatar pemain lain bila backend dikonfigurasi.
- Mode demo tanpa akun menggunakan localStorage browser. **Tidak sinkron antardevice**.

## Langkah menjalankan

Dari root project (folder yang berisi `package.json`, `app`, `components`, `lib`):

```bash
npm ci
npm run build
npm run dev
```

Buka `http://localhost:3000/avatar`, edit nama dan penampilan, klik **Simpan & Masuk Dunia**, lalu periksa avatar di `http://localhost:3000/world`.

## Supabase untuk akun yang login

Jika proyek Supabase Kheewar **sudah ada**, buka **SQL Editor** dan jalankan **hanya** `supabase/avatar_creator_upgrade.sql` untuk menambah kolom baru. Ini migrasi tambahan, bukan reset database.

Jika proyek Supabase baru/kosong, jalankan `supabase/schema.sql` mengikuti README lama.

Tambahkan environment variables `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` ke `.env.local` di komputer dan ke **Vercel → Project Settings → Environment Variables** (untuk deploy). Jangan upload file `.env.local`.

**Jika menyimpan avatar dengan akun masih gagal:** baca pesan error di halaman `/avatar`, periksa kolom Supabase dan kebijakan akses tabel `profiles`. Jangan abaikan error SQL.

## GitHub dan Vercel

- ZIP ini sengaja disusun dengan **file aplikasi di root ZIP**, bukan dalam folder pembungkus.
- Untuk perubahan aman, unggah isinya ke branch `upgrade-avatar` di repo Kheewar lama. Buat Pull Request lalu uji Vercel Preview.
- `app/` dan `package.json` harus berada di direktori root yang dipakai Vercel. Jika repo punya folder pembungkus lain, ubah Root Directory sesuai lokasi `package.json` Next.js.
- Gunakan `npm run build` dan tes dua browser sebelum merge ke `main`.

## Batasan yang perlu diketahui

- Avatar sengaja menggunakan gaya **voxel kotak seperti contoh screenshot**, bukan model animasi premium/halus. Semua bentuk dibuat dengan mesh Three.js, **tanpa mengklaim menggunakan model GLB profesional**.
- Voice chat tetap menggunakan komponen LiveKit proyek lama dan **masih memerlukan konfigurasi backend** serta dua pengguna sungguhan untuk percakapan.
- NPC di kafe dari versi upgrade sebelumnya tetap berupa karakter visual, bukan AI dan bukan pengguna manusia.
- Desain halaman terinspirasi susunan dua panel pada screenshot, tetapi implementasi visual, kode, dan gaya dibuat khusus untuk Kheewar.
- Pemeriksaan build harus dijalankan secara lokal/Vercel. Lingkungan pengerjaan ini tidak berhasil memasang dependency karena cache npm belum lengkap, sehingga build penuh belum terverifikasi.
