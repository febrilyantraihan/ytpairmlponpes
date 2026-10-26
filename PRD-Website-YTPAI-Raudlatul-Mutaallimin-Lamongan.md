# PRODUCT REQUIREMENT DOCUMENT (PRD)
## SISTEM INFORMASI DAN PORTAL WEB TERPADU
### YAYASAN TAMAN PENDIDIKAN AGAMA ISLAM (YTPAI) RAUDLATUL MUTA’ALLIMIN LAMONGAN

---

## 1. INFORMASI DOKUMEN & METADATA

| Atribut | Keterangan |
| :--- | :--- |
| **Nama Proyek** | Portal Web Terpadu & Backoffice CMS YTPAI Raudlatul Muta’allimin |
| **Instansi / Klien** | Yayasan Taman Pendidikan Agama Islam Raudlatul Muta’allimin Lamongan |
| **Versi Dokumen** | 1.0.0 |
| **Status** | Approved for Development |
| **Klasifikasi** | Internal & Development Team |
| **Slogan Lembaga** | *"Unggul dalam Prestasi, Berkarakter dalam Budaya"* |
| **Target Rilis** | Q4 2026 |

---

## 2. LATAR BELAKANG & TUJUAN PROYEK

### 2.1 Latar Belakang
Yayasan Taman Pendidikan Agama Islam (YTPAI) Raudlatul Muta’allimin Lamongan merupakan institusi pendidikan Islam terpadu yang menaungi 7 (tujuh) satuan pendidikan formal (KB, TK, MI, MTs, SMP, MA, SMA) dan 4 (empat) unit non-formal/penunjang (Madrasah Diniyah, KBIHU, LPBA, LBB). Seiring dengan era transformasi digital dan tuntutan transparansi informasi, yayasan membutuhkan representasi digital berskala profesional (*full-power web system*) yang elegan, informatif, dan berjiwa muda tanpa meninggalkan nilai-nilai luhur kepesantrenan.

### 2.2 Tujuan Proyek
1. **Representasi Identitas Kelembagaan:** Menghadirkan portal utama yang menyatukan seluruh unit pendidikan dalam satu ekosistem digital berstandar modern.
2. **Kanal Informasi & Konversi Calon Santri:** Memfasilitasi calon wali santri dan masyarakat luas dalam mengakses info profil, program akademik, keunggulan fasilitas, hingga Penerimaan Peserta Didik/Santri Baru (PPDB/PSB).
3. **Pemberdayaan Humas & Operator Multi-Unit:** Menyediakan ruang admin (*Backoffice/CMS*) terpadu dengan hak akses berjenjang (*Role-Based Access Control*) untuk mengelola konten berita, prestasi, galeri, dan pesan masyarakat secara mandiri tanpa ketergantungan teknis.

---

## 3. IDENTITAS VISUAL & DESIGN SYSTEM

* **Gaya Desain:** Bersih (*clean*), minimalis, modern, dan berjiwa muda (*fresh & dynamic*).
* **Palet Warna Utama:**
  * **Deep Royal Blue (`#0F4C81` / `#0D47A1`):** Melambangkan kedalaman ilmu, kewibawaan, intelektual, dan stabilitas kelembagaan.
  * **Pure White (`#FFFFFF`):** Melambangkan kesucian, kebersihan akhlak, kejujuran, dan kesederhanaan pesantren.
  * **Slate / Sky Blue Accent (`#E3F2FD` / `#2196F3`):** Elemen pemanis interaktif, hover button, badge, dan background selingan.
  * **Soft Charcoal Dark (`#1E293B`):** Tipografi teks utama agar kontras tinggi dan ramah keterbacaan (*eye-friendly*).
* **Tipografi:** Sans-serif modern dan tegas (contoh: *Inter*, *Plus Jakarta Sans*, atau *Outfit*).
* **Prinsip Tampilan:** Mobile-first, transisi mikro halus (*smooth transitions, fade-up on scroll*), tata letak lapang (*generous whitespace*), dan tanpa ornamen visual yang berlebihan.

---

## 4. CAKUPAN UNIT LEMBAGA (MULTI-UNIT ARCHITECTURE)

Website ini mengintegrasikan seluruh unit di bawah naungan YTPAI Raudlatul Muta’allimin:

### 4.1 Unit Pendidikan Formal
1. **Kelompok Bermain (KB) Raudlatul Muta’allimin:** Pendidikan usia dini berbasis stimulasi motorik dan nilai islami.
2. **Taman Kanak-Kanak (TK) Raudlatul Muta’allimin:** Penguatan karakter dasar, adab harian, dan sosialisasi santri cilik.
3. **Madrasah Ibtidaiyah (MI) Raudlatul Muta’allimin:** Penguasaan dasar agama, tahfidz juz 30, dan sains kurikulum madrasah.
4. **Madrasah Tsanawiyah (MTs) Raudlatul Muta’allimin:** Penguatan kurikulum keagamaan Kemenag dan kurikulum nasional terpadu asrama.
5. **Sekolah Menengah Pertama (SMP) Raudlatul Muta’allimin:** Pendekatan akademik umum berbasis lingkungan santri religius.
6. **Madrasah Aliyah (MA) Raudlatul Muta’allimin:** Jenjang menengah atas berbasis kepesantrenan dengan peminatan **IPA, IPS, dan Keagamaan/Bahasa**.
7. **Sekolah Menengah Atas (SMA) Raudlatul Muta’allimin:** Jenjang menengah atas umum dengan peminatan **IPA, IPS, dan Bahasa** yang diperkuat kepemimpinan santri.

### 4.2 Unit Non-Formal & Penunjang
1. **Madrasah Diniyah (Madin):** Pusat kajian keislaman tradisional, pembelajaran gramatika Arab (Nahwu, Shorof), dan pengajian kitab kuning berjenjang.
2. **KBIHU (Kelompok Bimbingan Ibadah Haji dan Umrah):** Layanan bimbingan manasik haji & umrah resmi bagi jamaah dan masyarakat umum.
3. **LPBA (Lembaga Pengembangan Bahasa Asing):** Akselerasi kecakapan bahasa internasional santri (khususnya Bahasa Arab & Bahasa Inggris) berbasis lingkungan aktif (*bilingual environment*).
4. **LBB (Lembaga Bimbingan Belajar):** Pembinaan intensif materi akademik, persiapan ujian sekolah, dan pendampingan masuk Perguruan Tinggi Negeri (PTN) / Kedinasan.

---

## 5. SPESIFIKASI KEBUTUHAN FUNGSIONAL: HALAMAN UTAMA (LANDING PAGE)

### 5.1 Struktur & Alur Halaman (Layout Flow)
```
[ Topbar Informasi & Akses Cepat ]
[ Sticky Navbar & Tombol CTA Utama ]
  ├── 1. Hero Section (Visual Banner, Logo, Slogan, CTA Actions)
  ├── 2. Tentang Yayasan (Sejarah, Visi, Misi, Counter Statistik)
  ├── 3. Berita & Kegiatan Terbaru (3 Kartu Sorotan Berita)
  ├── 4. Sambutan Pimpinan (Tabs: Ketua Yayasan & 3 Dewan Pembina)
  ├── 5. Program Akademik & Direktori Penjurusan
  ├── 6. Fasilitas Unggulan Kompleks Yayasan & Pesantren
  ├── 7. Ekstrakurikuler & Organisasi Santri
  ├── 8. Prestasi & Etalase Penghargaan
  ├── 9. Testimoni Santri & Alumni
  └── 10. Hubungi Kami & Peta Lokasi
[ Footer Terpadu & Copyright ]
```

---

### 5.2 Rincian Modul & Komponen Frontend

#### A. Topbar & Sticky Navigation
* **Topbar:** Nomor WhatsApp Humas, Alamat Email Resmi, Tautan Akun Media Sosial (YouTube, Instagram, Facebook, TikTok).
* **Logo & Brand:** Logo resmi YTPAI Raudlatul Muta’allimin di sisi kiri dengan teks nama yayasan yang jelas.
* **Menu Utama:**
  * Beranda
  * Tentang Kami (Dropdown: Profil, Visi-Misi, Struktur Organisasi)
  * Satuan Pendidikan (Dropdown: 7 Unit Formal & 4 Unit Non-Formal)
  * Akademik (Kurikulum, Penjurusan IPA/IPS/Bahasa)
  * Fasilitas & Ekskul
  * Prestasi
  * Warta (Berita & Artikel)
  * Kontak
* **Tombol Aksi (Sticky CTA):** Tombol mencolok berlatar Biru khas bertuliskan **"Daftar Sekarang"** (mengarahkan ke modul pendaftaran/PPDB) dan tombol sekunder **"Hubungi Kami"**.

#### B. Hero Section (Tampilan Pembuka)
* **Media Latar:** Slider foto resolusi tinggi / video latar ringkas gedung yayasan, asrama, dan suasana kegiatan santri dengan *dark-overlay* proporsional untuk keterbacaan teks.
* **Logo Yayasan:** Tampil tajam dan proporsional di tengah atau sisi kiri atas tajuk.
* **Judul Utama:** *"Yayasan Taman Pendidikan Agama Islam Raudlatul Muta’allimin Lamongan"*.
* **Slogan Lembaga:** *"Unggul dalam Prestasi, Berkarakter dalam Budaya"*.
* **Tombol Ajakan Bertindak (CTA Buttons):**
  1. `Primary CTA`: **"Daftar Sekarang"** (Warna Biru Royal, mengarah ke info pendaftaran).
  2. `Secondary CTA`: **"Lihat Prestasi"** (Warna outline putih/biru, meluncur mulus ke bagian Prestasi).
  3. `Tertiary CTA`: **"Hubungi Kami"** (Tombol tautan cepat meluncur ke formulir kontak).

#### C. Bagian 1: Tentang Yayasan
* **Sejarah Singkat:** Narasi perjalanan berdirinya YTPAI Raudlatul Muta’allimin di Lamongan sebagai kawah candradimuka generasi berilmu dan berakhlak.
* **Visi & Misi:** Disajikan dalam kartu visual elegan:
  * *Visi:* Membentuk generasi muslim yang bertafaqquh fiddin, mandiri, unggul secara akademik, dan berbudaya luhur.
  * *Misi:* Poin-poin strategis pengembangan karakter, penguasaan ilmu pengetahuan, dan integrasi kurikulum.
* **Counter Statistik (Animasi Angka Berjalan):**
  * Total Santri Aktif (misal: 2.500+ Santri)
  * Tenaga Pendidik & Asatidz (misal: 150+ Ustadz/Guru)
  * Unit Pendidikan (11 Unit Terpadu)
  * Akreditasi Unggul / A

#### D. Bagian 2: Berita & Kegiatan Terbaru
* Menampilkan **3 artikel berita terbaru** yang diterbitkan oleh tim redaksi/admin.
* Format Kartu Berita:
  * Gambar thumbnail berasio 16:9.
  * Lencana kategori unit (contoh: `MA`, `Madin`, `Kegiatan Yayasan`).
  * Tanggal publikasi dan nama penulis/humas.
  * Judul artikel (maksimal 2 baris).
  * Cuplikan ringkas (*excerpt* 2 baris).
* Tombol: *"Lihat Semua Berita"* mengarah ke arsip berita lengkap.

#### E. Bagian 3: Sambutan Pimpinan & Dewan Pembina
* Format tabulasi interaktif atau kartu berdampingan yang rapi dan khidmat:
  1. **Sambutan Ketua Yayasan:** Ucapan selamat datang, pesan kepemimpinan, dan komitmen pelayanan pendidikan berkualitas bagi umat.
  2. **Sambutan Dewan Pembina 1:** Amanah penanaman sanad keilmuan dan tradisi salafus sholih.
  3. **Sambutan Dewan Pembina 2:** Arah pembinaan akhlaqul karimah dan adab penuntut ilmu.
  4. **Sambutan Dewan Pembina 3:** Dorongan integrasi ilmu sains modern dan wawasan kebangsaan.
* Komponen: Foto resmi jas/busana santri rapi, ornamen kutipan pembuka (*quote icon*), nama lengkap beserta gelar, dan tanda tangan digital.

#### F. Bagian 4: Program Akademik & Direktori Unit
* **Kategori Formal:** Menampilkan penjelasan menyeluruh tentang kurikulum terpadu serta sorotan khusus penjurusan tingkat atas:
  * **Jurusan IPA (Ilmu Pengetahuan Alam):** Riset sains, kedokteran, teknologi, matematika terapan, dan praktikum laboratorium.
  * **Jurusan IPS (Ilmu Pengetahuan Sosial):** Ekonomi syariah, sosiologi, kewirausahaan, diplomasi, dan literasi hukum.
  * **Jurusan Bahasa:** Penguasaan aktif Bahasa Arab, Bahasa Inggris, sastra, dan teknik penerjemahan.
* **Kategori Non-Formal:**
  * Profil ringkas Madin (kitab kuning), KBIHU (bimbingan haji/umrah profesional), LPBA (kampung bahasa santri), dan LBB (bimbingan sukses PTN).
* Tombol detail pada tiap kartu unit yang mengarah ke halaman spesifik masing-masing unit.

#### G. Bagian 5: Fasilitas Unggulan
* Galeri foto responsif dilengkapi deskripsi singkat fungsi dan keunggulan:
  * **Mushola Pondok Pesantren Putra (Utama):** Pusat ibadah sholat fardhu berjamaah santri putra, taklim kitab salaf, dan kegiatan ngaji bersama alumni (tanpa sebutan masjid jami').
  * **Mushola Pondok Pesantren Putri:** Sarana ibadah eksklusif santriwati mukim di dalam kompleks asrama putri.
  * **Laboratorium Sains & Komputer:** Fasilitas riset biologi, fisika, kimia, serta lab komputer mutakhir berkecepatan tinggi.
  * **Perpustakaan Terpadu:** Koleksi literatur kitab klasik nusantara, buku teks nasional, dan koleksi e-library.
  * **Aula Serbaguna:** Ruang pertemuan megah untuk wisuda, seminar nasional, dan musabaqah santri.
  * **Ruang Multimedia & Studio Podcast:** Ruang kreasi konten dakwah digital santri dan pembelajaran audio-visual.
  * **Asrama Santri & Sarana Olahraga:** Asrama bersih berdisiplin tinggi, lapangan futsal, voli, dan arena bela diri.

#### H. Bagian 6: Ekstrakurikuler & Pembinaan Bakat
* Grid kartu dinamis dengan ikon dan dokumentasi aksi santri:
  * **Gerakan Pramuka Pesantren:** Kepanduan berkarakter tangguh, disiplin, dan cinta alam.
  * **IPNU & IPPNU:** Wadah kepemimpinan, organisasi kebangsaan, dan kaderisasi generasi Nahdliyin.
  * **Seni Shalawat Banjari / Hadrah:** Pengembangan seni rebana klasik dan kontemporer.
  * **Seni Baca Al-Qur'an (Qira’ah / MTQ):** Bimbingan nagham Al-Qur'an tartil dan tilawah bersanad.
  * **Desain Grafis & Multimedia:** Pelatihan editing video, animasi, desain media dakwah, dan coding dasar.
  * **Bela Diri Tradisional (Pagar Nusa / Silat):** Olah fisik ketangkasan dan benteng diri santri.

#### I. Bagian 7: Prestasi Lembaga & Santri
* Galeri filter interaktif (*Filter: Semua, Akademik, Seni Islami, Olahraga, Internasional*):
  * Foto dokumentasi kejuaraan / penyerahan piala.
  * Judul Penghargaan (contoh: *"Juara 1 MTQ Nasional Remaja 2026"*).
  * Nama Santri / Kontingen dan Asal Unit (contoh: *Santri MA Raudlatul Muta'allimin*).
  * Tahun perolehan prestasi.

#### J. Bagian 8: Testimoni Santri & Alumni
* Slider testimoni modern dengan kutipan pengalaman otentik:
  * **Kutipan Santri Aktif:** Suasana kekeluargaan di asrama, bimbingan ustadz yang telaten, dan fasilitas modern.
  * **Kutipan Alumni:** Kisah sukses berkuliah di PTN favorit, luar negeri (Al-Azhar Kairo, Timur Tengah), aparatur negara, maupun wirausaha muda.
* Data profil: Foto santri/alumni, Nama Lengkap, Tahun Angkatan/Lulusan, dan Profesi/Aktivitas saat ini.

#### K. Bagian 9: Hubungi Kami & Peta Lokasi
* **Peta Interaktif:** Embed Google Maps resmi lokasi yayasan dan pesantren di Kabupaten Lamongan, Jawa Timur.
* **Identitas Kontak Lengkap:**
  * Alamat Kantor Sekretariat Yayasan.
  * Nomor Telepon Kantor / Call Center.
  * Tautan Langsung Chat WhatsApp Customer Care / Admin PPDB.
  * Alamat Email Resmi Domain Yayasan.
* **Formulir Kontak Sederhana:**
  * Form Field: Nama Lengkap, Nomor WhatsApp, Alamat Email, Pilihan Unit yang Dituju (Dropdown), dan Subjek/Pesan.
  * Validasi form otomatis dan pengamanan anti-spam.

#### L. Footer Area
* Kolom 1: Profil ringkas yayasan, logo legalitas, dan akreditasi.
* Kolom 2: Tautan Cepat Satuan Pendidikan Formal (KB, TK, MI, MTs, SMP, MA, SMA).
* Kolom 3: Tautan Unit Non-Formal (Madin, KBIHU, LPBA, LBB) & Informasi Pendaftaran.
* Kolom 4: Jam Operasional Sekretariat & Saluran Media Sosial Resmi.
* Baris Bawah: Copyright © 2026 YTPAI Raudlatul Muta’allimin Lamongan. Dilindungi Undang-Undang.

---

## 6. SPESIFIKASI KEBUTUHAN RUANG ADMIN (BACKOFFICE CMS)

Ruang admin dirancang khusus dengan antarmuka intuitif berbahasa Indonesia agar memudahkan tenaga pengurus, sekretariat yayasan, maupun admin unit sekolah.

### 6.1 Arsitektur Peran & Hak Akses (Role-Based Access Control)
1. **Super Admin Yayasan:**
   * Akses tak terbatas ke seluruh modul sistem.
   * Manajemen akun pengguna (*user management*), pemberian hak akses, dan log aktivitas sistem.
   * Konfigurasi identitas yayasan, slogan, sambutan pimpinan, dan integrasi API (WhatsApp/Email).
2. **Admin Humas / Media Yayasan:**
   * Pengelolaan berita, artikel kegiatan, pengumuman, dan agenda yayasan.
   * Pengelolaan galeri foto fasilitas, slider beranda, dokumentasi ekskul, dan prestasi.
   * Manajemen ulasan/testimoni santri dan alumni.
3. **Operator Unit Sekolah (Sub-Admin):**
   * Diberikan kepada admin masing-masing unit (Operator MA, Operator SMP, Operator Madin, dll.).
   * Hanya berhak menerbitkan berita/artikel berkategori unitnya sendiri dan mengunggah prestasi santri unit terkait.
4. **Petugas Layanan Informasi / Admin Kontak:**
   * Membaca dan menindaklanjuti pesan masuk dari formulir *Hubungi Kami*.
   * Ekspor data kontak/prospek calon wali santri baru.

---

### 6.2 Modul-Modul Utama Backoffice CMS

```
[ BACKOFFICE CMS YTPAI LAMONGAN ]
├── 1. Dashboard Utama
│    ├── Metrik Total Berita Terbit
│    ├── Metrik Total Prestasi Tercatat
│    ├── Metrik Pesan Masuk (Hari Ini & Belum Dibalas)
│    └── Grafik Pengunjung Web Bulanan
├── 2. Manajemen Konten Warta
│    ├── Daftar Artikel / Berita (Filter Kategori Unit)
│    ├── Tambah/Edit Berita (Rich Text WYSIWYG, Gambar, Tag, SEO Meta)
│    └── Kategori & Tag Berita
├── 3. Profil Lembaga & Pimpinan
│    ├── Edit Sejarah, Visi, Misi & Statistik
│    ├── Manajemen Sambutan Ketua Yayasan
│    └── Manajemen Sambutan 3 Dewan Pembina (Foto, Naskah, Profil)
├── 4. Manajemen Satuan Pendidikan (Unit)
│    ├── Pengaturan 7 Unit Formal (Kurikulum, Penjurusan IPA/IPS/Bahasa)
│    └── Pengaturan 4 Unit Non-Formal (Madin, KBIHU, LPBA, LBB)
├── 5. Manajemen Fasilitas & Ekskul
│    ├── Unggah Foto Sarana Prasarana (Kategori, Keterangan)
│    └── Data Ekstrakurikuler (Nama, Pembina, Jadwal, Dokumentasi)
├── 6. Etalase Prestasi
│    ├── Tambah Prestasi Baru (Bidang, Tingkat, Pemenang, Bukti Foto/Sertifikat)
│    └── Filter Kategori (Formal, Diniyah, Olahraga, dll.)
├── 7. Suara Santri (Testimoni)
│    ├── Kurasi Testimoni (Setujui / Sembunyikan)
│    └── Tambah Testimoni Santri / Alumni Baru
├── 8. Kotak Pesan & Leads PPDB
│    ├── Inbox Formulir Hubungi Kami (Status: Baru, Dihubungi, Arsip)
│    └── Fitur Ekspor Data ke Format Excel (.xlsx / .csv)
├── 9. Galeri Media Terpusat
│    ├── Kompresi Gambar Otomatis (Konversi ke format WebP)
│    └── Folder Berkas Dokumen Publik (Brosur PDF, Panduan PPDB)
└── 10. Pengaturan Sistem
     ├── Kelola Pengguna & Peran (Role & Permission)
     ├── Log Audit Aktivitas
     └── Konfigurasi Google Maps, Media Sosial, & SEO Global
```

---

## 7. KEBUTUHAN NON-FUNGSIONAL (NON-FUNCTIONAL REQUIREMENTS)

| Parameter | Kebutuhan & Standar Kualitas |
| :--- | :--- |
| **Responsivitas Perangkat** | 100% responsif di semua resolusi layar (Mobile 360px+, Tablet 768px+, Desktop 1080px+ hingga 4K). |
| **Performa & Waktu Muat** | Skor Google PageSpeed / Lighthouse minimal **85+** di mode mobile dan **95+** di mode desktop. Waktu muat awal (*First Contentful Paint*) ≤ 1.8 detik. |
| **Keamanan Sistem** | • Enkripsi komunikasi SSL/TLS (HTTPS) standar grade A.<br>• Proteksi formulir terhadap bot spam menggunakan Cloudflare Turnstile / Google reCAPTCHA v3.<br>• Perlindungan backend terhadap serangan Cross-Site Scripting (XSS), SQL Injection, dan Cross-Site Request Forgery (CSRF).<br>• Kebijakan kata sandi kuat pada login admin serta pembatasan percobaan login salah (*rate-limiting*). |
| **Search Engine Optimization (SEO)** | • Struktur URL semantik dan ramah mesin pencari (slug bahasa Indonesia).<br>• Otomatisasi OpenGraph Tags (Twitter Card, Facebook/WhatsApp Preview Card) untuk setiap artikel dan laman profil.<br>• Peta situs dinamis (`sitemap.xml`) dan `robots.txt` otomatis terindeks Google. |
| **Penyimpanan & Kompresi Media** | Sistem CMS wajib melakukan optimasi otomatis pada setiap unggahan foto: auto-resize dimensi maksimal 1920px dan konversi ekstensi ke **WebP** berbobot rendah tanpa mengurangi ketajaman visual. |

---

## 8. USULAN SPESIFIKASI TEKNOLOGI (TECH STACK RECOMENDATION)

Untuk menjamin kinerja situs yang cepat, aman, dan mudah dirawat:

* **Opsi Arsitektur Modern (Direkomendasikan):**
  * **Frontend (User Portal):** Next.js (React) atau Astro + Tailwind CSS (Menghasilkan performa *Static Site Generation / Server-Side Rendering* super cepat).
  * **Backend & API:** Node.js (NestJS) atau PHP (Laravel 11 REST API).
  * **Headless CMS / Backoffice:** Strapi / Filament PHP (Antarmuka admin bawaan yang sangat siap pakai dan fleksibel).
  * **Basis Data:** PostgreSQL atau MariaDB/MySQL.
  * **Infrastruktur & Hosting:** Cloud VPS (Ubuntu LTS) dengan Nginx/LiteSpeed, CDN Cloudflare, dan Object Storage S3 untuk media.

---

## 9. RENCANA KERJA & TAHAPAN IMPLEMENTASI (ROADMAP)

| Fase | Durasi | Sasaran & Deliverables |
| :--- | :--- | :--- |
| **Fase 1: Riset & Pengumpulan Aset** | Minggu 1 | • Pengumpulan foto resolusi tinggi gedung, fasilitas, kegiatan santri.<br>• Pengumpulan materi profil yayasan, visi-misi, sambutan 3 dewan pembina dan ketua yayasan.<br>• Finalisasi struktur navigasi dan konten detail unit. |
| **Fase 2: Perancangan UI/UX (Figma)** | Minggu 2 | • Pembuatan *High-Fidelity Wireframe* halaman beranda dan halaman dalam.<br>• Perancangan desain dashboard admin.<br>• Asistensi dan persetujuan dewan pimpinan yayasan. |
| **Fase 3: Pengembangan Frontend** | Minggu 3 | • Pengkodean halaman beranda, animasi visual, transisi hero section.<br>• Integrasi layout responsif dan palet warna Biru-Putih. |
| **Fase 4: Pengembangan Backoffice CMS** | Minggu 4 | • Pembangunan database terpadu multi-unit.<br>• Implementasi manajemen berita, sambutan, prestasi, dan formulir kontak.<br>• Konfigurasi sistem otentikasi dan hak akses berjenjang. |
| **Fase 5: Integrasi & UAT** | Minggu 5 | • Uji coba menyeluruh oleh tim yayasan (*User Acceptance Testing*).<br>• Uji beban, kecepatan, dan kompatibilitas peramban.<br>• Pelatihan (*training*) penggunaan CMS bagi staf sekretariat. |
| **Fase 6: Peluncuran (Go-Live)** | Minggu 6 | • Pemasangan domain resmi (`.sch.id` atau `.ponpes.id`).<br>• Konfigurasi sertifikat SSL, penyerahan dokumentasi panduan admin, dan pemeliharaan awal. |

---

## 10. KRITERIA KEBERHASILAN PROYEK (ACCEPTANCE CRITERIA)

1. Halaman utama memuat seluruh 9 (sembilan) bagian wajib secara runtut, rapi, dan estetis sesuai skema warna Biru-Putih.
2. Sambutan Ketua Yayasan dan ke-3 Dewan Pembina tampil berwibawa dengan foto tajam dan keterbacaan naskah yang optimal.
3. Seluruh unit formal (KB, TK, MI, MTs, SMP, MA, SMA) dan non-formal (Madin, KBIHU, LPBA, LBB) terwakili dengan jelas dan memiliki kanal informasi masing-masing.
4. Ruang admin memungkinkan operator mengunggah berita baru dan prestasi dalam waktu kurang dari 3 menit tanpa kendala teknis.
5. Formulir kontak berfungsi secara *real-time*, menyimpan pesan ke dalam database admin, dan dapat diekspor ke format Excel.
6. Website lolos pengujian responsivitas pada perangkat Android, iPhone, tablet, dan PC desktop tanpa elemen visual yang patah.

---
*Dokumen ini disusun sebagai acuan kerja resmi perancangan dan pengembangan Portal Web Terpadu YTPAI Raudlatul Muta’allimin Lamongan.*
