# Kheewar — Sidebar kiri seperti desain awal

Patch ini mengembalikan sidebar kiri pada halaman `/world` ke gaya **awal Kheewar** yang lebih ringan:
- Navigasi "Jelajahi dunia", "Teman", "Misi belajar" kembali menjadi baris sederhana tanpa card besar.
- Daftar lokasi kembali menjadi list transparan tanpa tombol kotak abu-abu.
- Lokasi aktif disorot lembut hijau muda, bukan border tebal.
- Counter dan kartu motivasi tetap ditampilkan dengan desain awal.

Perubahan hanya pada `components/WorldExperience.tsx`. Semua halaman Avatar Creator 3D, scene kafe, autentikasi, real-time, dan LiveKit tetap dalam paket dan tidak dirombak.

## Cara menerapkan
1. Ekstrak `Kheewar-Sidebar-Awal.zip` dan ambil file `components/WorldExperience.tsx`.
2. Backup file dengan nama sama pada repository `Kheewar`.
3. Timpa file tersebut lalu `git add components/WorldExperience.tsx && git commit -m "Restore clean world sidebar"`.
4. Jalankan `npm install` dan `npm run build` lokal. Setelah sukses, push ke branch `upgrade-3d` atau branch pengembangan kamu; periksa Preview Vercel sebelum merge ke `main`.

## Catatan
Patch ini adalah perubahan tampilan dan handler menu sidebar, bukan penggantian desain atau algoritma 3D. Tidak perlu migrasi Supabase untuk patch ini.
