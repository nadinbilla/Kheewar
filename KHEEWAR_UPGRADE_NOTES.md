# Kheewar Upgrade Notes

Perubahan utama pada paket ini:

1. **Avatar islami baru**
   - Pilihan avatar `female_hijab`
   - Pilihan avatar `male_modest` (celana panjang dan tampilan sopan)
   - Tersedia di modal profil

2. **Cafe lebih hidup**
   - Ada NPC barista/penjual di belakang counter
   - Ada pengunjung NPC tambahan
   - Rak botol dan dekorasi cafe ditingkatkan

3. **UI lebih mirip aplikasi social speaking**
   - Modal peta dunia/lokasi
   - Modal `Talk Invitation`
   - Modal konfirmasi masuk lokasi
   - Panel room dan mission diperhalus

4. **Realtime avatar payload diperluas**
   - Broadcast dan presence sekarang juga mengirim `avatar_variant`

5. **Supabase schema diupdate**
   - Tambah kolom `avatar_variant` pada tabel `profiles`
   - File: `supabase/schema.sql`

## Hal yang perlu dilakukan setelah extract ZIP

1. Jalankan update schema Supabase (`supabase/schema.sql`)
2. Install dependency project:
   ```bash
   npm install
   ```
3. Jalankan project:
   ```bash
   npm run dev
   ```

## Catatan
Build penuh belum bisa saya verifikasi sempurna di environment kerja ini karena proses install dependency `next` tidak selesai dalam batas waktu container. Namun source code utama dan struktur upgrade sudah dimasukkan ke project.
