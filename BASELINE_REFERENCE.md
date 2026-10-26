# GOLDEN MASTER BASELINE REFERENCE
**Website Portal Terpadu & Backoffice CMS YTPAI Raudlatul Muta'allimin Lamongan**
*Disimpan pada: 12 September 2026 (Versi Resmi yang Disetujui Pengguna)*

Dokumen ini dan folder `_baseline_snapshot/` merupakan **patokan baku (baseline benchmark)** resmi dari proyek website ini. Apabila ada pengerjaan atau revisi di masa mendatang yang hasilnya melenceng, merusak tata letak, atau menghasilkan tampilan yang tidak sesuai (*AI slop*), **wajib merujuk dan mengembalikan ke standar patokan ini**.

---

## 1. Snapshot File Asli yang Dicadangkan
Salinan kode murni yang telah divalidasi dan berjalan 100% sempurna disimpan di direktori `_baseline_snapshot/`:
- `_baseline_snapshot/index.html` (Halaman publik utama)
- `_baseline_snapshot/admin.html` (Panel Backoffice CMS)
- `_baseline_snapshot/css/main.css` & `css/components.css` (Sistem desain & komponen visual)
- `_baseline_snapshot/js/data.js` (Struktur basis data reaktif & auto-migrasi)
- `_baseline_snapshot/js/main.js` (Logika frontend, slider, render dinamis, dan listener sinkronisasi antar-tab)
- `_baseline_snapshot/js/admin.js` (Sistem CRUD lengkap seluruh modul CMS)

---

## 2. Aturan Baku Tata Letak & Desain (UI/UX Hierarchy)

### A. Topbar Atas (`.topbar`)
- **Tata Letak Bersih & Seimbang**: Sisi kiri (`.topbar-left`) memuat Telepon `(0322) 321-789` & WhatsApp PPDB `+62 812-3456-7890`; sisi kanan (`.topbar-right`) memuat alamat resmi pesantren.
- **DILARANG** menempatkan tautan admin CMS atau ikon sosial media di topbar atas (sudah dihapus sesuai instruksi pengguna demi kebersihan visual).

### B. Sticky Navbar (`.navbar`)
- Logo pesantren + nama yayasan berhuruf kapital resmi (`YTPAI RAUDLATUL MUTA'ALLIMIN LAMONGAN`) + alamat di bawahnya.
- 8 menu navigasi: Beranda, Tentang Kami, Pendidikan & Program, Pimpinan, Fasilitas, Ekskul, Warta & Prestasi, Kontak.
- Tombol aksi primer: `Daftar Santri Baru`.

### C. Area Hero Beranda (`.hero-section`)
- Background slider dengan foto asli santri & pesantren, efek *smooth zoom & crossfade*.
- Konten teks dinamis yang **wajib dapat diubah oleh admin**:
  1. Lencana Akreditasi: `★ Akreditasi Unggul (A) • Slogan`
  2. Judul Utama (Headline): Mendukung teks biasa maupun sorotan `<span class="highlight">kata</span>`.
  3. Paragraf Deskripsi Utama.
  4. Tombol Aksi 1 (PPDB) & Tombol Aksi 2 (Satuan Pendidikan).

### D. Bagian "Tentang Yayasan" (`#tentang`) — Keseimbangan Tata Letak
- **Kolom Kiri**:
  1. Foto Gedung Pusat (rasio 16:9).
  2. Kartu Visi Resmi Yayasan (`.yayasan-vision-card`).
  3. Kartu Interaktif Silaturahmi & Kunjungan Pesantren (`.about-visit-card` - Opsi C): Berisi ajakan kunjungan, checklist layanan, tombol WA reservasi, dan tombol unduh profil.
- **Kolom Kanan**:
  1. Judul & Sejarah Pendirian 1984.
  2. Kotak 5 Pilar Misi Yayasan (`.yayasan-mission-box`).
- **Keduanya WAJIB memiliki tinggi yang seimbang (~750px) dan sejajar rata bawah**. Tidak boleh ada ruang kosong (*blank void*).

### E. 4 Pilar Keunggulan Yayasan (`.about-pillars-grid`)
- Layout **vertikal eksekutif**:
  - Garis aksen pita emas-navy di bagian atas kartu (`::before`).
  - Wadah ikon bertingkat berdiameter 48px dengan animasi rotasi/skala halus saat di-*hover*.
  - Nomor indeks eksklusif (`01`, `02`, `03`, `04`) yang berubah menjadi emas saat di-*hover*.
  - Judul navy tebal (`#0A2540`) dengan deskripsi berjarak baris longgar (`line-height: 1.6`).

### F. Footer (`.footer`)
- Kolom Brand: Logo yayasan + Nama Kapital + Alamat + Deskripsi + Slogan.
- **Media Sosial Resmi Yayasan (Santri RM Official)**: Tepat di bawah teks slogan, memuat 4 tombol lingkaran berdiameter 38px:
  1. YouTube (`@santrirmoffical9144`) - Hover Merah YouTube `#FF0000`.
  2. Instagram (`@santri_rm_official`) - Hover Gradien Instagram.
  3. Facebook (`santri.rm.official`) - Hover Biru Facebook `#1877F2`.
  4. TikTok (`@santri_rm_official`) - Hover Dark Cyan TikTok `#00f2fe`.
- Kolom Satuan Formal, Unit Non-Formal & PPDB (Tombol PPDB berlatar emas berkilau kontras tinggi `#FBBF24`), serta Sekretariat & Jam Layanan.

### G. Standar Tampilan Ponsel (Mobile View) & Tolok Ukur Samsung Galaxy A55
- **Tolok Ukur Utama Ponsel**: Samsung Galaxy A55 (`360 x 800 px`, DPR 3.0). Wajib bebas mepet (*zero-cramped*), tap target nyaman (min `40px - 44px`), padding tepi `12px - 16px`, dan bebas luapan horizontal.
- **Lencana Akreditasi & Slogan (Hero Badge)**: Menggunakan kartu mini bertingkat (`border-radius: 12px; gap: 4px`) yang rapi. Dilarang menggunakan pill `border-radius: 9999px` pada multi-baris di HP agar tidak melar/lonjong tidak simetris. Titik pemisah (`•`) disembunyikan di HP.
- **Skala Ikon Proporsional & Elegan**: Seluruh ikon di layar ponsel diskalakan agar ramping (tidak mendominasi ruang visual):
  - Wadah ikon kartu statistik: `34px` (SVG `17px`) dalam **kisi 2x2 rapi** (bukan 1 kolom memanjang).
  - Floating WhatsApp PPDB: lingkaran `42px` (SVG `20px`) yang halus dan tidak menutupi isi kartu.
  - Hamburger menu: tombol `36px` dengan ikon `18px`.
  - Wadah ikon pilar keunggulan, fasilitas, dan satuan pendidikan: `34px - 38px`.
  - Ikon tombol aksi hero: `15px`.

### H. Standar Efisiensi Vertikal, Tipografi Anti-Tabrakan, & Kurvatur Elegan
- **Anti-Scroll Panjang & Melelahkan**: Dilarang membuat susunan layout yang terlalu panjang menjulur ke bawah di layar ponsel. Gunakan tab interaktif, kartu ringkas berpaginasi, accordion, atau preview card.
- **Zero Typography Collision & Overlap**: Teks, judul, lencana, angka, dan ikon dilarang saling bertumpuk atau terpotong. Gunakan `line-height` aman (1.3 - 1.5) dan hindari container berketinggian tetap (*fixed height*).
- **Anti-Desain Over-Rounded**: Dilarang menggunakan sudut membulat berlebihan (*no excessive pill/bubble/hyper-rounded shapes*). Gunakan estetika tegas (*semi-boxy clean elegance*): kartu/modal `8px - 12px` (maksimal `14px`), tombol/input `6px - 8px`.

---


## 3. Aturan Baku Backoffice CMS (`admin.html`)
- Semua modul konten harus memiliki fitur **CRUD lengkap**:
  - `hero`: Formulir edit teks hero beranda pada tab *Konten & Slide Beranda*.
  - `heroSlides`: Tambah, edit, dan hapus foto latar beranda.
  - `programs`: Tambah, edit, dan hapus 6 Program Unggulan & Khidmah Santri.
  - `units`: 7 Satuan Pendidikan Formal.
  - `leadership`: Dewan Pimpinan & Pembina.
  - `facilities`: Fasilitas Yayasan & Asrama.
  - `achievements`: Etalase Prestasi.
  - `studentWorks`: Ruang Karya Santri.
  - `testimonials`: Testimoni Santri & Alumni.
  - `news`: Warta & Berita.
- **Sinkronisasi Reaktif**:
  - Penyimpanan menggunakan `saveDB(db)` yang memicu `ytpai_db_updated` dan `storage` event.
  - Halaman `index.html` langsung merender perubahan secara *live* tanpa perlu refresh paksa.

---

## 4. Aturan Baku Lembaga Bimbingan Belajar (LBB) & Sistem Pelacak Sesi TKA 2026 (`lbb.html`)
- **Snapshot Tersimpan**: `_baseline_snapshot/lbb.html` dan `_baseline_snapshot/version_2026-09-12_lbb_smart_schedule/`.
- **Ketua LBB Resmi**: **Novin Mayang Arum, S.Pd** (Motto: *"Belajar Hari Ini, Sukses Esok Hari"*).
- **Waktu KBM Bimbingan Belajar**:
  - Disesuaikan khusus dengan jam kepulangan sekolah santri: **Pukul 13.40 WIB s.d. Ashar**.
  - Wajib menyertakan panduan jeda 20 menit pasca kepulangan sekolah reguler (13.20 - 13.40 WIB) untuk istirahat dan makan siang.
- **Tentor Pengampu Sesi Tatap Muka TKA 2026**:
  - **Hari Rabu**: Bu Dinda, S.Pd (Bahasa Indonesia - 10 Sesi).
  - **Hari Kamis**: Miss Muhim, S.Pd (Bahasa Inggris - 10 Sesi).
  - **Hari Ahad**: Pak Isroil, M.Pd (Matematika - 10 Sesi).
- **Sistem Pelacak Otomatis & Hitung Mundur Real-Time (`#liveScheduleTracker`)**:
  - Menghitung secara otomatis pertemuan terdekat berdasarkan tanggal sistem (`new Date()`).
  - Menampilkan countdown timer 4 kotak (Hari, Jam, Menit, Detik) menuju pukul 13.40 WIB pada tanggal sesi.
  - Menyediakan ekspor pengingat satu klik: **Google Calendar** dan **Unduh Berkas Kalender (.ics)**.
- **Tabel Matriks 30 Pertemuan Interaktif (`#tkaScheduleTable`)**:
  - 30 baris data lengkap dengan status otomatis: `Selesai`, `Sesi Terdekat` (highlight emas), dan `Akan Datang`.
  - Filter interaktif: `Semua (30)`, `Sesi Mendatang`, `Riwayat Selesai`, serta filter mata pelajaran (`B. Indonesia`, `B. Inggris`, `Matematika`).
- **Kebersihan Desain & Bahasa**:
  - 100% Bahasa Indonesia baku tanpa istilah asing tidak baku.
  - Bersih dari elemen visual berlebihan (kotak pamflet/flyer ditiadakan agar fokus pada matriks pembelajaran dan sistem pelacak).

---

## 5. Standar Faktual Kajian Kitab & Pengajian Pesantren
- **Pengajian Umum Masyarakat**: Di YTPAI / Pondok Pesantren Raudlatul Muta'allimin Tegalrejo **belum ada pengajian rutin khusus bersama masyarakat umum**.
- **Kajian Kitab yang Berjalan**:
  1. **Ngaji Kitab Arba'in Nawawi**: Bersama alumni santri di akhir bulan, diasuh **KH. Miftahul Falah, S.Pd** (Ketua Dewan Pengasuh), diadakan pada **Sabtu malam Minggu akhir bulan**, pukul **20.30 WIB (setengah 9 malam) s.d. selesai**.
  2. **Ngaji Kitab Al-Hikam (Tasawuf)**: Diadakan **setiap 2 minggu sekali** di **ndalem KH. Moh. Ghozi, S.Pd.I**, pukul **20.30 WIB (setengah 9 malam) s.d. selesai**, diikuti oleh santri SLTA (MA/SMA) dan para alumni. Jika masyarakat umum ingin bergabung menimba ilmu, sangat dipersilakan dengan terbuka.
- **AI Chatbot Guardrail**: Chatbot RAUDLY dilarang mengklaim adanya pengajian umum mingguan untuk orang luar/tua, dan wajib memberikan informasi faktual dua kajian di atas secara ramah dan santun termasuk waktu pelaksanaan pukul 20.30 WIB s.d. selesai.

---
*Gunakan panduan ini sebagai benteng kualitas agar website YTPAI Raudlatul Muta'allimin Lamongan senantiasa berkelas, kredibel, dan profesional.*
