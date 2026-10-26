# AGENT RULES & PROJECT BENCHMARK GUIDELINES
**YTPAI Raudlatul Muta'allimin Lamongan - Web Portal & Backoffice CMS**

## CRITICAL RULE: PRESERVE APPROVED BASELINE ARCHITECTURE
Kondisi proyek pada 12 September 2026 telah disetujui pengguna sebagai **Patokan Baku (Golden Master Baseline)**.
Rujukan lengkap tertulis di [BASELINE_REFERENCE.md](file:///d:/Aplikasi/website%20pesantren/BASELINE_REFERENCE.md) dan cadangan kode asli tersimpan di folder `_baseline_snapshot/`.

### Aturan Wajib untuk Setiap Perubahan atau Perbaikan:
1. **Dilarang Menghasilkan AI Slop / Layout Rusak**:
   - Jangan pernah mengganti palet warna institusional (Deep Islamic Navy `#0A2540` / `#0F4C81`, Royal Gold `#FBBF24` / `#C59B27`, dan Warm White `#F8FAFC`).
   - Jangan menggunakan gaya generik Bootstrap/Tailwind mentah.
2. **Keseimbangan Tata Letak (#tentang)**:
   - Kolom kiri (Foto + Visi Resmi + Kartu Kunjungan Pesantren Opsi C) dan Kolom kanan (Deskripsi + 5 Pilar Misi) **harus selalu seimbang rata bawah (~750px)**. Jangan biarkan ada ruang kosong (*blank void*).
3. **Pilar Keunggulan Yayasan**:
   - Pertahankan tata letak vertikal eksekutif dengan garis aksen emas-navy di atas, nomor indeks (`01`, `02`, `03`, `04`), dan wadah ikon bertingkat dengan micro-interaction hover.
4. **Kebersihan Topbar & Footer**:
   - Topbar atas **hanya** memuat telepon & WA PPDB di sisi kiri, serta alamat di sisi kanan atas (dilarang menaruh tombol admin atau ikon sosial media di topbar).
   - Media sosial resmi (YouTube, Instagram, Facebook, TikTok) berada di **Footer** tepat di bawah slogan.
5. **Backoffice CMS**:
   - Seluruh modul harus memiliki fitur CRUD lengkap (Create, Read, Update, Delete) dengan modal form dan upload widget.
   - Teks area hero beranda (headline, akreditasi, slogan, deskripsi, CTA) harus tetap dapat dikelola secara dinamis via CMS.
6. **Standar Tampilan Ponsel (Mobile View)**:
   - Lencana akreditasi & slogan di HP harus berupa kartu mini bertingkat (`border-radius: 12px; gap: 4px`) tanpa tanda titik menggantung atau kapsul melar.
   - Ikon di mode ponsel harus ramping dan proporsional (statistik dalam kisi 2x2 dengan ikon `34px`, floating WA `42px`, hamburger `36px`, tombol hero `15px`). Dilarang membiarkan ikon mendominasi ruang visual.
7. **Standar Lembaga Bimbingan Belajar (LBB & Bimbel TKA 2026)**:
   - Waktu belajar wajib pukul 13.40 WIB s.d. Ashar (jeda istirahat 20 menit setelah kepulangan sekolah reguler 13.20 WIB).
   - Profil tentor (Bu Dinda, Miss Muhim, Pak Isroil) dan Ketua LBB (Novin Mayang Arum, S.Pd) wajib konsisten.
   - Sistem pelacak tanggal otomatis, hitung mundur (countdown), checklist siswa, dan ekspor kalender harus selalu aktif dan terintegrasi dengan tabel matriks 30 sesi.
8. **Jika Hasil Perbaikan Tidak Sesuai**:
   - Selalu bandingkan dengan file di `_baseline_snapshot/` dan kembalikan ke patokan baku yang telah teruji.
9. **Strict Workspace & Context Isolation (Isolasi Total Proyek & Air-Gap)**:
   - Sesi percakapan, instruksi, data, dan file hanya berlaku khusus untuk proyek **YTPAI Raudlatul Muta'allimin Lamongan** (`d:\Aplikasi\website pesantren`).
   - Agen **dilarang keras** memuat, mencampurkan, membaca, mengeksekusi, atau menghubungkan konteks, referensi kode, maupun instruksi dari workspace / proyek luar manapun (termasuk `Generator Briva`, `Junio Smart`, atau proyek terpisah lainnya).
   - Dokumen aktif luar (*external active files*) yang terdeteksi di editor wajib diabaikan secara ketat.
10. **Standar Faktual Kajian Kitab & Majelis Taklim**:
   - Belum ada pengajian rutin khusus bersama masyarakat umum.
   - Rutinitas yang berjalan: **Ngaji Kitab Arba'in Nawawi** (KH. Miftahul Falah, S.Pd, Sabtu malam Minggu akhir bulan) dan **Ngaji Kitab Al-Hikam** (Dr. KH. Ghozi, Lc., M.Fil.I, 2 minggu sekali di Ndalem KH. Moh. Ghozi). Waktu pelaksanaan wajib konsisten: **pukul 20.30 WIB (setengah 9 malam) s.d. selesai**. Masyarakat umum dan alumni terbuka lebar untuk bergabung menimba ilmu.
11. **Standar Sarana Ibadah (Mushola Putra & Putri, Dilarang 'Masjid Jami'')**:
   - **Dilarang Keras** menyebut kata "Masjid Jami'" atau "Masjid Jamik" di seluruh website dan data karena di lingkungan yayasan tidak ada masjid jami'.
   - **Mushola Pondok Pesantren Putra**: Sarana ibadah utama pesantren untuk sholat fardhu berjamaah santri putra, qiyamul lail, kajian kitab salaf, dan **biasanya kegiatan ngaji bersama alumni dilakukan di sana**. Kapasitas representatif (**Dilarang menyebutkan angka kapasitasnya, termasuk angka 600**).
   - **Mushola Pondok Pesantren Putri**: Sarana ibadah yang bersifat **eksklusif** khusus santriwati mukim di dalam kompleks asrama putri yang terjaga privasi syar'i 24 jam.
12. **Standar Identitas Lembaga & Durasi Warta Humas (~2,5 Menit Baca)**:
   - Nama Resmi Yayasan: **YTPAI (Yayasan Taman Pendidikan Agama Islam) Raudlatul Muta'allimin Lamongan**. Dilarang menyebut *"Yayasan Tarbiyatul Pelajar"*.
   - Lokasi Resmi Kompleks: **Dusun Tegalrejo, Desa Datinawong, Kec. Babat, Kab. Lamongan**. Dilarang menyebut *"Simorejo"* atau kiasan kaku *"bumi Simorejo"*.
   - Panjang standar rilis warta adalah **~2,5 menit baca (panjang sekitar 250 hingga 300 kata)** agar padat, bernas, dan nyaman dibaca di layar ponsel.
13. **Standar Orisinalitas Desain & Larangan Desain Monoton / Template Serupa (Anti-Repetitive & Unique Bespoke UI)**:
   - Dilarang keras menghasilkan komponen antarmuka visual yang terasa serupa, seragam, atau repetitif seperti template CMS generik murahan (seperti deretan kotak kartu identik yang monoton, garis aksen indikator aktif klise, atau visual 'jendela di dalam jendela' yang membuang ruang kerja).
   - Setiap modul dan elemen wajib memiliki sentuhan desain otentik (*bespoke tailoring*), komposisi dinamis (*asymmetric balance*), serta hierarki visual yang segar, elegan, dan ergonomis dengan tetap mempertahankan palet warna institusional (Deep Islamic Navy `#0A2540`, Royal Gold `#FBBF24`, dan Warm White `#F8FAFC`).
14. **Standar Wajib Adaptasi Tri-Perangkat (HP Samsung A55, Tablet, PC Desktop) & Mobile-Friendly**:
   - **Kewajiban Mutlak**: Seluruh fitur baru yang ditambahkan dan setiap perubahan penampilan WAJIB mobile-friendly dan beradaptasi secara mulus (*fully adaptive & responsive*) di tiga spektrum perangkat:
     1. **Ponsel Pintar Acuan**: **Samsung Galaxy A55** (*Viewport CSS*: `360 x 800 px`, DPR `3.0`).
        - Tampilan wajib bebas dari kesan mepet/berdesakan (*zero-cramped*), tombol mudah dijangkau jempol (min tap target `40px - 44px`), jarak tepi (*screen padding*) teratur `12px - 16px`, tidak ada elemen yang meluap ke samping (*zero horizontal overflow*), bilah gulir (*scrollbar*) tidak boleh mendesak/menabrak kartu.
        - Dilarang menggunakan desain aksen samping yang tebal (seperti garis biru tebal di sisi kiri kartu) yang memakan ruang horizontal layar 360px.
     2. **Tablet Acuan** (*Viewport CSS*: `768 x 1024 px` s.d. `820 x 1180 px`):
        - Tata letak beralih adaptif (grid 2-kolom seimbang), perataan elemen proporsional, tanpa peregangan tombol atau form yang melar canggung.
     3. **Komputer Desktop / Laptop Acuan**: **PC Desktop Standar** (*Viewport CSS*: `1366 x 768 px` s.d. `1920 x 1080 px`).
        - Tampilan wajib memanfaatkan bidang layar secara seimbang (*asymmetric executive balance*), tidak kerdil/gepeng, tidak menyisakan ruang kosong canggung (*awkward blank space*), dan modal dialog memiliki proporsi lebar ideal (`max-width: 490px` s.d. `900px`).
   - Dilarang keras merilis perubahan yang hanya rapi di satu perangkat namun mengorbankan kerapian atau fungsi di perangkat lainnya.
15. **Standar Efisiensi Alur Vertikal (Anti-Scroll Panjang & Melelahkan)**:
   - Dilarang keras menyusun tata letak yang terlalu panjang menjulur ke bawah di layar ponsel sehingga menghabiskan waktu pengguna untuk menggulir (*no excessive vertical bloat / infinite scrolling strain*).
   - Konten informasi, katalog, atau tabel panjang wajib diringkas melalui struktur yang cerdas: gunakan sistem tab interaktif, kartu ringkas horizontal berpaginasi, accordion/expand-collapse, atau batas tayang awal (*preview cards*) dengan tombol ekspansi terukur.
16. **Pemberantasan Teks Bertumpuk & Tumpang Tindih (Zero Typography Collision & Overlap)**:
   - Dilarang keras ada tampilan yang tulisannya saling bertumpuk, melindas, atau tumpang tindih (*zero overlapping/stacking typography collision*), baik antar judul, lencana (*badge*), angka statistik, maupun deskripsi.
   - Wajib memastikan `line-height` aman dan proporsional (`1.3` s.d. `1.5`), `gap` flexbox/grid yang cukup, `word-break: break-word` / `overflow-wrap: anywhere`, serta pembungkus teks (*flex-wrap / text wrapping*) yang rapi di layar sempit 360px. Dilarang menggunakan tinggi tetap (*fixed height*) kaku pada wadah teks yang berisiko memicu teks terpotong (*clipped*) atau melompat keluar.
17. **Standar Estetika Tegas & Elegan (Anti-Desain Terlalu Rounded / Over-Curved)**:
   - Dilarang keras menerapkan radius sudut yang terlalu membulat atau berlebihan (*no excessive pill/bubble/hyper-rounded shapes*) yang membuat tampilan tampak seperti mainan kekanak-kanakan, murahan, atau memotong area kerja sudut (*corner clipping*).
   - Gunakan kurvatur sudut yang tegas, matang, dan modern (*semi-boxy clean elegance*):
     * Kartu informasi, modal dialog, dan wadah utama: radius terukur sedang (`8px` s.d. `12px`, batas mutlak maksimal `14px`; dilarang sudut balon `24px` - `36px+`).
     * Tombol aksi dan formulir input: sudut rapi profesional (`6px` s.d. `8px`, dilarang bentuk kapsul/peluru lonjong penuh kecuali indikator status mini khusus yang proporsional).

