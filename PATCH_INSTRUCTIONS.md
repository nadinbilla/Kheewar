# Cara menerapkan file upgrade 3D

Arsip ini berisi file yang diubah, bukan keseluruhan proyek. Buat backup source code dahulu.

Ekstrak arsip ini, lalu salin folder `components`, `app`, `lib`, `public`, dan file `middleware.ts`, `package.json`, `README.md`, `3D_UPGRADE.md` ke root repository `Kheewar`, dengan mempertahankan struktur folder. Bandingkan perubahan halaman dan `app/globals.css` terlebih dahulu jika kamu punya edit lain.

Karena `package.json` mengubah nama paket menjadi `kheewar`, jalankan `npm install` untuk menyelaraskan `package-lock.json` jika repository kamu memilikinya. Setelah itu, dari root proyek jalankan:

```powershell
npm run build
npm run dev
```

Buka `http://localhost:3000/world`. Jangan push ke branch `main` sebelum build berhasil.
