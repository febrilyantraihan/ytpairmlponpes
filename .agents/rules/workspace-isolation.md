# STRICT WORKSPACE & CONTEXT ISOLATION RULE

## TARGET WORKSPACE RESMI: `d:\Aplikasi\website pesantren`
**Entitas Resmi**: YTPAI (Yayasan Taman Pendidikan Agama Islam) Raudlatul Muta'allimin Lamongan
**Website Portal & Backoffice CMS**

---

### ATURAN UTAMA ISOLASI TOTAL & PEMBATASAN PROYEK (AIR-GAP BOUNDARY):

1. **Karantina Konteks Mutlak (Zero Cross-Project Contamination)**:
   - Sesi percakapan, instruksi, memori kerja, dan pembuatan kode di ruang kerja ini **HANYA BERLAKU KHUSUS** untuk proyek **YTPAI Raudlatul Muta'allimin Lamongan** (`d:\Aplikasi\website pesantren`).
   - Agen AI dilarang keras mengaitkan, memuat, membaca, memodifikasi, mengeksekusi, atau merujuk file dari proyek eksternal lain di perangkat pengguna, termasuk:
     - Proyek `d:\Aplikasi\Generator Briva` (Sistem Generator BRIVA / Perbankan)
     - Proyek `d:\Aplikasi\Junio Smart` (Aplikasi Tagihan Mandiri)
     - Proyek `d:\Aplikasi\pesantren` (Dokumen Smart Pesantren PRD terpisah)
     - Serta seluruh direktori lain di luar root `d:\Aplikasi\website pesantren`.
   - Jika IDE mendeteksi tab file aktif (*Active Document*) atau referensi yang merujuk ke luar direktori `d:\Aplikasi\website pesantren`, AI **WAJIB MENGABAIKANNYA** dan tetap fokus 100% pada ruang lingkup `d:\Aplikasi\website pesantren`.

2. **Batasan Pembacaan & Operasi File (Strict File Boundary)**:
   - Agen hanya diizinkan membaca, mencari, membuat, atau memodifikasi file yang berada di bawah direktori `d:\Aplikasi\website pesantren`.
   - Dilarang membuat path absolut atau relasional yang mengakses folder luar (misal: `..\Generator Briva`, `..\Junio Smart`, atau `C:\Users\...`).
   - Semua perintah shell (`run_command`) wajib menetapkan parameter `Cwd` pada direktori di dalam `d:\Aplikasi\website pesantren`.

3. **Isolasi Penyimpanan State & LocalStorage**:
   - Penyimpanan data browser (LocalStorage, SessionStorage) untuk modul Backoffice CMS YTPAI wajib menggunakan namespace/prefix terisolasi (`ytpai_*`, `rm_pesantren_*`, `admin_*`) agar tidak saling menimpa (*collision*) dengan aplikasi lokal lain yang dijalankan pada server/port lokal yang sama (`localhost:5500`, `localhost:5501`, dll.).

4. **Peran & Integritas Brand YTPAI**:
   - Dalam workspace ini, AI bertindak sebagai **Lead Web Architect & Technical Maintainer YTPAI Raudlatul Muta'allimin Lamongan**.
   - Lokasi resmi: **Dusun Tegalrejo, Desa Datinawong, Kec. Babat, Kab. Lamongan**.
   - Dilarang menggunakan nama "Yayasan Tarbiyatul Pelajar" dan dilarang menyebut "Simorejo" atau kiasan "bumi Simorejo".
   - Sarana Ibadah: Mushola Pondok Pesantren Putra & Putri (Dilarang menyebut "Masjid Jami'").
   - Palet warna wajib: Deep Islamic Navy (`#0A2540` / `#0F4C81`), Royal Gold (`#FBBF24` / `#C59B27`), Warm White (`#F8FAFC`).

5. **Verifikasi Status Pasca-Perubahan (Status Check Protocol)**:
   - Setelah setiap pembaruan, konfigurasi, atau perbaikan, wajib dilakukan pemeriksaan status menyeluruh (integritas kode, benchmark standar, dan kesiapan sistem) untuk memastikan tidak ada kebocoran konteks dan aplikasi tetap berjalan prima.
