Kheewar - perbaikan oval putih pada halaman /#fitur

Akar masalah: dua aturan .demo-notice mengatur top dan bottom sekaligus pada elemen position:fixed. Dengan border-radius:999px, elemen memanjang menjadi oval.

Perbaikan: CSS telah dipisahkan menjadi .landing-shell > .demo-notice (notifikasi bawah) dan .world-app > .demo-notice (notifikasi atas), dengan top/bottom lawan di-reset ke auto.

Cara pasang: upload file app/globals.css dalam ZIP ke lokasi app/globals.css pada branch GitHub Kheewar yang sekarang, lalu commit dan redeploy Vercel.

Jangan upload file README-PERBAIKAN.txt jika tidak ingin menambah file.
