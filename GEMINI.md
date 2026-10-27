# GEMINI AGENT RULES - YTPAI RAUDLATUL MUTA'ALLIMIN LAMONGAN

## ISOLASI TOTAL PROYEK (STRICT CONTEXT ISOLATION)
- **Workspace Utama**: `d:\Aplikasi\website pesantren`
- **Identitas**: Website Portal & Backoffice CMS YTPAI (Yayasan Taman Pendidikan Agama Islam) Raudlatul Muta'allimin Lamongan.
- **Lokasi Resmi**: Dusun Tegalrejo, Desa Datinawong, Kec. Babat, Kab. Lamongan. DILARANG menggunakan nama "Yayasan Tarbiyatul Pelajar" untuk nama yayasan dan DILARANG menyebut "Simorejo" atau kiasan "bumi Simorejo".
- **Karantina Konteks & Direktori**:
  * Dilarang keras membaca, memodifikasi, mengeksekusi, atau merujuk file dari proyek eksternal seperti `d:\Aplikasi\Generator Briva`, `d:\Aplikasi\Junio Smart`, `d:\Aplikasi\pesantren`, atau folder di luar workspace ini.
  * Abaikan dokumen aktif luar (*external active documents*) yang tidak berada di dalam `d:\Aplikasi\website pesantren`.
  * Dilarang menghubungkan, memuat, membocorkan, atau mengaitkan konteks, struktur database, potongan kode, maupun instruksi dari proyek luar (seperti generator BRIVA, sistem tagihan mandiri, e-commerce, atau aplikasi komersial lainnya).

## STANDAR TEKNOLOGI & DESAIN GOLDEN MASTER
1. **Palet Warna Institusional**:
   - Deep Islamic Navy (`#0A2540` / `#0F4C81`)
   - Royal Gold (`#FBBF24` / `#C59B27`)
   - Warm White & Pure White (`#F8FAFC` / `#FFFFFF`)
2. **Kerapian & Keseimbangan Visual**:
   - Bagian `#tentang`: Seimbang rata bawah (~750px) antara foto/visi dan 5 pilar misi.
   - Pilar Keunggulan Yayasan: Desain vertikal eksekutif dengan nomor indeks (`01`, `02`, `03`, `04`).
   - Tampilan Ponsel: Ramping, proporsional, tanpa layout melar atau elemen terpotong.
3. **Penyimpanan & Backoffice**:
   - Seluruh modul data dinamis dapat dikelola melalui `admin.html` (Local Storage + Google Sheets Backup Sync).
   - Selalu pertahankan integritas fungsionalitas dan snapshot di `_baseline_snapshot/`.
4. **Standar Sarana Ibadah (Dilarang 'Masjid Jami'')**:
   - Tidak ada masjid jami'. Gunakan:
     * **Mushola Pondok Pesantren Putra** (utama, sarana ibadah & tempat kegiatan ngaji bersama alumni, tanpa menyebutkan angka kapasitasnya).
     * **Mushola Pondok Pesantren Putri** (bersifat eksklusif santriwati mukim di dalam asrama putri).
5. **Standar Warta Humas & AI Drafter (~2,5 Menit Baca)**:
   - Durasi baca standar warta adalah **~2,5 menit (panjang sekitar 250 hingga 300 kata)**.
   - Menggunakan bahasa yang luwes, lembut (*soft*), menyentuh hati, bernas, dan tidak berputar-putar.
6. **Standar Orisinalitas & Anti-Desain Serupa (Bespoke Crafting)**:
   - Dilarang keras membuat elemen antarmuka yang seragam atau repetitif seperti template dashboard pasaran (menghindari kotak kartu copy-paste, tombol monoton, dan indikator aktif klise).
   - Setiap modul wajib memiliki komposisi visual yang dinamis, orisinal, bernilai estetika tinggi, dan nyaman digunakan di desktop maupun layar ponsel.
7. **Standar Wajib Adaptasi Tri-Perangkat (HP Samsung A55, Tablet, PC Desktop) & Mobile-Friendly**:
   - Seluruh penambahan fitur dan perubahan antarmuka WAJIB beradaptasi sempurna di tiga kelas perangkat:
     * **Ponsel Pintar Acuan**: **Samsung Galaxy A55** (`360 x 800 px`, DPR 3.0) — Bebas mepet (*zero-cramped*), tombol ramah jempol (min tap target `40px - 44px`), jarak tepi `12px - 16px`, tidak ada luapan horizontal, bilah gulir ramping tanpa menabrak kartu, tanpa aksen garis samping tebal yang memakan ruang layar.
     * **Tablet Acuan**: `768 x 1024 px` s.d. `820 x 1180 px` — Tata letak 2-kolom terukur seimbang, tidak melar canggung.
     * **PC Desktop Acuan**: `1366 x 768 px` s.d. `1920 x 1080 px` — Menjaga keseimbangan eksekutif, proporsi modal ideal (`max-width: 490px` s.d. `900px`), dan tidak menyisakan ruang kosong canggung.
8. **Standar Efisiensi Alur Vertikal (Anti-Scroll Panjang & Melelahkan)**:
   - Dilarang membuat susunan layout yang terlalu panjang menjulur ke bawah di layar ponsel sehingga membuang waktu scroll (*compact & streamlined layout*).
   - Manfaatkan tab interaktif, kartu ringkas berpaginasi, accordion, atau batas tayang awal yang terstruktur.
9. **Pemberantasan Teks Bertumpuk & Tumpang Tindih (Zero Typography Collision & Overlap)**:
   - Dilarang keras ada teks, judul, lencana (*badge*), angka, atau ikon yang saling bertumpuk atau tumpang tindih (*zero text overlap*).
   - Gunakan `line-height` aman (1.3 s.d. 1.5), `gap` proporsional, `word-break: break-word`, pembungkus teks yang rapi, dan hindari wadah berketinggian tetap (*fixed height*) kaku.
10. **Standar Estetika Tegas & Elegan (Anti-Desain Terlalu Rounded / Over-Curved)**:
   - Dilarang keras menerapkan radius sudut yang terlalu membulat atau berlebihan (*no excessive pill/bubble/hyper-rounded shapes*).
   - Gunakan kurvatur sudut yang tegas, matang, dan modern (*semi-boxy clean elegance*):
     * Kartu, modal dialog, dan kontainer utama: radius sedang (`8px` s.d. `12px`, maksimal `14px`; dilarang sudut balon `24px` - `36px+`).
     * Tombol & input formulir: sudut rapi profesional (`6px` s.d. `8px`, dilarang bentuk kapsul/peluru lonjong penuh kecuali indikator status kecil khusus).
11. **Standar Bebas Terpotong & Tata Letak Ringkas Tanpa Scroll Melelahkan (Zero Element Clipping, Anti-Over-Rounded & Compact Ergonomics)**:
   - **Kewajiban Mutlak**: Pada setiap penambahan atau pembaruan fitur (khususnya modal dialog, tabel rincian biaya, kartu informasi, dan widget interaktif):
     * **Dilarang Desain Terlalu Rounded / Over-Curved**: Dilarang menggunakan bentuk lonjong pil/kapsul ekstrem (`border-radius: 999px` atau `24px+`) pada kontainer, tombol aksi, filter, atau modal. Terapkan sudut semi-boxy tegas yang matang dan berwibawa (`6px` s.d. `10px`).
     * **Dilarang Ada Elemen Terpotong (*Zero Clipping*)**: Header modal, judul, tombol tutup (✕), tab navigasi, tabel angka, dan tombol aksi footer (seperti Tutup dan Hubungi WhatsApp) WAJIB utuh terlihat jelas di layar sempit 360px tanpa terpotong batas layar atau tersembunyi di bawah lipatan footer.
     * **Dilarang Scroll Menjulur Terlalu Panjang (*Zero Endless Scrolling*)**: Jangan menumpuk tabel atau blok data yang panjang secara vertikal ke bawah. Wajib menggunakan segmentasi kompak (segmented control / sub-tab interaktif per fase biaya / accordion) sehingga pengguna dapat beralih melihat rincian per tahap secara ringkas tanpa harus menggulir layar secara melelahkan di ponsel Samsung Galaxy A55 (360x800 px).


