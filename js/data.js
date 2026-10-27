/**
 * YTPAI RAUDLATUL MUTA'ALLIMIN LAMONGAN - REACTIVE DATABASE & STORE
 * Supports full browser persistence via localStorage and CRUD synchronization
 */

const DEFAULT_YAYASAN_DATA = {
  meta: {
    name: "YTPAI Raudlatul Muta'allimin Lamongan",
    legal: "Yayasan Taman Pendidikan Agama Islam Raudlatul Muta'allimin Lamongan",
    slogan: "#SEKOLAH UNGGULAN BERBASIS PESANTREN",
    history: "Didirikan pada tahun 1984 di Babat, Lamongan, YTPAI Raudlatul Muta’allimin telah berkiprah selama lebih dari empat dekade mencetak generasi muslim berilmu, berakhlak mulia, dan siap berkontribusi nyata bagi agama, bangsa, dan negara.",
    vision: "Menjadi lembaga dakwah dan pendidikan yang terkemuka dalam membentuk Generasi mukmin yang terampil, berbudi tinggi, dan berpengetahuan luas untuk mewujudkan kesejahteraan umat dan bangsa",
    missionList: [
      "Menyelenggarakan dan mengelola pendidikan secara profesional",
      "Membina dan mengembangkan dakwah dan pendidikan islam dalam arti seluas-luasnya dengan semangat amar ma’ruf dan nahi mungkar",
      "Menegakkan nilai-nilai kemanusiaan sesuai dengan nilai-nilai islam demi kesejahteran umat dan bangsa",
      "Meningkatkan kualitas sumber daya manusia melalui peningkatan IPTEK dan IMTAK untuk mewujudkan masyarakat yang beriman, berilmu, beramal, dan bertaqwa sesuai dengan Ahlussunnah Waljama’ah",
      "Mendorong tercapainya persatuan dan kesatuan umat untuk kesejahteraan seluruh masyarakat Indonesia."
    ],
    mission: "1. Menyelenggarakan dan mengelola pendidikan secara profesional\n2. Membina dan mengembangkan dakwah dan pendidikan islam dalam arti seluas-luasnya dengan semangat amar ma’ruf dan nahi mungkar\n3. Menegakkan nilai-nilai kemanusiaan sesuai dengan nilai-nilai islam demi kesejahteran umat dan bangsa\n4. Meningkatkan kualitas sumber daya manusia melalui peningkatan IPTEK dan IMTAK untuk mewujudkan masyarakat yang beriman, berilmu, beramal, dan bertaqwa sesuai dengan Ahlussunnah Waljama’ah\n5. Mendorong tercapainya persatuan dan kesatuan umat untuk kesejahteraan seluruh masyarakat Indonesia.",
    phone: "0856-4884-7070",
    phoneClean: "6285648847070",
    whatsapp: "+62 856-4884-7070",
    whatsappClean: "6285648847070",
    email: "sekretariat@ytpai-lamongan.sch.id",
    address: "Jalan Raya Babat - Surabaya, Dsn. Tegalrejo, Ds. Datinawong, Kec. Babat, Kab. Lamongan, Prov. Jawa Timur",
    mapsUrl: "https://maps.app.goo.gl/ePeaKwX8PnkgPYGy9",
    mapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.0438!2d112.2202677!3d-7.1029391!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e778d0048138027%3A0x144631bc49f71d65!2sYTPAI%20RAUDLATUL%20MUTA'ALLIMIN%20LAMONGAN!5e0!3m2!1sid!2sid!4v1710000000000!5m2!1sid!2sid",
    stats: {
      santri: "2.500+",
      teachers: "150+",
      units: "10 Jenjang Pendidikan",
      accreditation: "A (Unggul)"
    },
    serviceHours: "Sabtu – Kamis: 07.00 – 14.00 WIB (Jum'at Libur)",
    ponpesHours: "Buka Setiap Hari (24 Jam)",
    holiday: "Hari Jum'at",
    runningText: "⭐ Sistem Penerimaan Murid Baru (SPMB) T.A. 2027/2028 Telah Dibuka • 🎓 Pendaftaran Online 24 Jam via Portal Web Resmi & Sekretariat Yayasan • 📖 #SEKOLAH UNGGULAN BERBASIS PESANTREN • 🏫 Jenjang Pendidikan: KB, TK, MI, MTs, SMP, MA, SMA, MADIN, PONPES PA & PI • 📞 WhatsApp / Telepon: 0856-4884-7070",
    googleSheetWebhookUrl: "",
    gaId: "",
    geminiApiKey: "",
    geminiApiKeySecondary: "",
    groqApiKey: "",
    groqModel: "qwen/qwen3.8-27b",
    aiProvider: "hybrid",
    chatbotName: "RAUDLY",
    chatbotMascot: "assets/raudly_avatar_hd.png",
    chatbotModel: "gemini-3.5-flash-lite",
    kajianAlumni: [
      {
        id: "kajian-arbain",
        kitab: "Kitab Arba'in Nawawi",
        pengasuh: "KH. Miftahul Falah, S.Pd",
        role: "Ketua Dewan Pengasuh",
        jadwal: "Sabtu malam Minggu akhir bulan (Pukul 20.30 WIB / Setengah 9 Malam s.d. Selesai)",
        peserta: "Alumni santri & pengasuh",
        deskripsi: "Ngaji bulanan kajian hadits Kitab Arba'in Nawawi bersama para alumni di akhir bulan, dimulai pukul 20.30 WIB (setengah sembilan malam) s.d. selesai."
      },
      {
        id: "kajian-alhikam",
        kitab: "Kitab Al-Hikam (Tasawuf)",
        pengasuh: "Dr. KH. Ghozi, Lc., M.Fil.I",
        role: "Sekretaris Dewan Pengasuh",
        lokasi: "Ndalem KH. Moh. Ghozi",
        jadwal: "Setiap 2 minggu sekali (Pukul 20.30 WIB / Setengah 9 Malam s.d. Selesai)",
        peserta: "Santri jenjang SLTA (MA & SMA) dan para alumni",
        deskripsi: "Kajian tasawuf Kitab Al-Hikam setiap 2 minggu sekali di ndalem KH. Moh. Ghozi, dimulai pukul 20.30 WIB (setengah sembilan malam) s.d. selesai. Jika masyarakat umum ingin bergabung menimba ilmu sangat dipersilakan."
      }
    ]
  },

  // Konfigurasi Sistem Jadwal Pendaftaran SPMB (Indent, Gelombang 1, Gelombang 2)
  psbWaveConfig: {
    activeWave: 1, // 1 = Indent aktif, 2 = Gelombang 1 aktif, 3 = Gelombang 2 aktif, 0 = Ditutup
    academicYear: "T.A. 2027/2028",
    heroBackground: "assets/banner_ppdb_hero.jpg",
    slogan: "#SEKOLAH UNGGULAN BERBASIS PESANTREN",
    // Jalur Indent: 1 November 2026 - 6 Januari 2027
    indent: {
      name: "Jalur Indent (Pemesanan Kuota Awal)",
      shortName: "INDENT",
      dateRange: "01 Nov 2026 – 06 Jan 2027",
      status: "Segera Dibuka",
      isOpen: true,
      announcementText: "Jalur Indent SPMB T.A. 2027/2028: 01 November 2026 s/d 06 Januari 2027. Kuota asrama putra dan putri terbatas. Pendaftaran online buka 24 jam. Pelayanan tatap muka hadir ke Kantor Sekretariat Pusat SPMB YTPAI Lamongan atau Kantor Unit Formal (KB–SMA) buka Sabtu s.d. Kamis pukul 07.00 – 14.00 WIB (Hari Jum'at Libur Lembaga)."
    },
    // Gelombang 1: 7 Januari - 31 Maret 2027
    wave1: {
      name: "Gelombang 1 (Jalur Reguler Tahap I)",
      shortName: "GELOMBANG 1",
      dateRange: "07 Jan – 31 Mar 2027",
      status: "Tahap 1",
      isOpen: false,
      announcementText: "Periode Gelombang 1: 07 Januari s/d 31 Maret 2027. Kuota asrama putra dan putri tersedia. Pendaftaran online buka 24 jam via portal web resmi."
    },
    // Gelombang 2: 1 April - 8 Juli 2027
    wave2: {
      name: "Gelombang 2 (Jalur Reguler Tahap II)",
      shortName: "GELOMBANG 2",
      dateRange: "01 Apr – 08 Jul 2027",
      status: "Tahap 2",
      isOpen: false,
      announcementText: "Periode Gelombang 2: 01 April s/d 08 Juli 2027. Pengisian sisa kuota murid baru untuk seluruh jenjang pendidikan."
    },
    // Properti Kompatibilitas Legacy
    name: "Jalur Indent",
    dateRange: "01 Nov 2026 – 06 Jan 2027",
    status: "Segera Dibuka",
    isOpen: true,
    announcementText: "Jalur Indent SPMB T.A. 2027/2028: 01 November 2026 s/d 06 Januari 2027. Kuota asrama putra dan putri terbatas. Pendaftaran online buka 24 jam."
  },

  // Rincian Skema & Estimasi Biaya Pendidikan SPMB (Transparansi Biaya Terpadu & Terintegrasi Admin CMS)
  psbCosts: {
    sectionBadge: "Transparan & Terjangkau",
    sectionTitle: "Rincian Estimasi Biaya Pendidikan",
    sectionSubtitle: "Komitmen yayasan menyelenggarakan pendidikan Islam berkualitas dan terjangkau, memadukan kurikulum formal dan kepesantrenan tanpa biaya memberatkan.",
    scholarshipNote: "",
    cards: [
      {
        id: "cost-card-1",
        name: "Infaq Formulir & Seleksi",
        price: "Rp 140.000",
        period: "Sekali bayar saat registrasi awal",
        isPopular: false,
        popularBadge: "",
        btnText: "Pilih Jalur Reguler",
        btnLink: "#formulir",
        features: [
          "Nomor Registrasi Resmi & Akses Sistem SPMB",
          "Biaya Pelaksanaan Ujian Penempatan & Seleksi",
          "Tes Baca Al-Qur'an & Pemetaan Kamar Asrama",
          "Layanan Konsultasi & Orientasi Santri Baru"
        ]
      },
      {
        id: "cost-card-2",
        name: "Infaq Masuk & Seragam Lengkap",
        price: "Mulai Rp 1.236.000",
        period: "Sekali di awal masuk (Sudah Termasuk Seragam Lengkap)",
        isPopular: true,
        popularBadge: "Paling Populer",
        btnText: "Daftar Sekarang",
        btnLink: "#formulir",
        features: [
          "Biaya Awal Tahun Sekolah & Pondok Pesantren",
          "Paket Seragam Lengkap Resmi (Pondok & Sekolah)",
          "Hak Fasilitas Almari Santri Pribadi di Asrama",
          "Buku Rapor Sekolah & Buku Rapor Madin",
          "KTA Siswa / Smart Card Brizzi Digital & MOS"
        ]
      },
      {
        id: "cost-card-3",
        name: "Iuran SPP Bulanan Terpadu",
        price: "Mulai Rp 281.000",
        period: "Per bulan (Rp 281rb SLTP / Rp 330rb SLTA - Paket Mukim)",
        isPopular: false,
        popularBadge: "",
        btnText: "Buka Rincian Biaya Resmi",
        btnLink: "javascript:openOfficialCostsModal()",
        features: [
          "Infaq Pendidikan Madrasah / Sekolah Formal (12 Bulan)",
          "Syahriyah Pondok & Bimbingan Kitab Salaf 24 Jam",
          "Bebas Biaya Ujian PTS & PAS (2 Semester Penuh)",
          "Ujian Semester Madin, KKM & Perawatan Lembaga",
          "Layanan Kesehatan Santri Poskestren & HUT RI"
        ]
      }
    ]
  },

  // Konfigurasi Pop-Up Pengumuman & Informasi Website (Dikelola Penuh via Admin CMS)
  popupAnnouncement: {
    enabled: true,
    mode: "auto", // "auto": otomatis warta terbaru, "custom": kustom manual oleh admin
    badge: "INFORMASI & WARTA UTAMA",
    category: "Akademik",
    title: "Santri MA Raudlatul Muta'allimin Raih Medali Emas Olimpiade Sains Nasional 2026",
    date: "10 September 2026",
    image: "assets/berita_santri_prestasi.jpg",
    excerpt: "Prestasi gemilang diraih kontingen santri jurusan IPA dalam ajang kompetisi sains terintegrasi keagamaan tingkat nasional.",
    actionText: "Baca Selengkapnya",
    actionLink: "#berita",
    newsId: 1,
    tag1: "PSB 2026/2027 Terbuka",
    tag2: "Tahfidz & Sains Unggul"
  },

  // Tanya Jawab Resmi (FAQ) PSB & Pesantren (Dinamis & Terintegrasi Admin CRUD)
  psbFaq: [
    {
      id: "faq-1",
      order: 1,
      question: "Kapan pendaftaran santri & murid baru (PSB / SPMB) resmi dibuka?",
      answer: "Pendaftaran dibuka dalam 2 gelombang: <strong>Gelombang I</strong> dibuka tanggal <strong>{{WAVE_1_DATES}}</strong>. <strong>Gelombang II</strong> dibuka tanggal <strong>{{WAVE_2_DATES}}</strong> (hanya dibuka jika kuota kamar asrama dan rombel kelas masih tersedia)."
    },
    {
      id: "faq-2",
      order: 2,
      question: "Apakah pendaftaran dapat dilakukan secara online atau harus datang offline?",
      answer: `Pendaftaran santri baru dan siswa dapat dilakukan dengan <strong>2 pilihan fleksibel</strong>:
<div style="margin-top:10px; display:flex; flex-direction:column; gap:10px;">
  <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-left:4px solid #0F4C81; padding:10px 14px; border-radius:4px;">
    <strong style="color:#0A2540;">1. Pendaftaran Secara Online (24 Jam)</strong><br>
    Dapat dilakukan kapan saja dari rumah melalui formulir digital di portal resmi website ini. Anda akan langsung menerima <strong>Nomor Registrasi Resmi</strong> dan kuitansi pendaftaran digital.
  </div>
  <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-left:4px solid #C59B27; padding:10px 14px; border-radius:4px;">
    <strong style="color:#0A2540;">2. Pendaftaran Secara Offline (Hadir Langsung)</strong><br>
    Bagi orang tua/wali yang ingin berkonsultasi langsung dan menyerahkan berkas fisik (Fotokopi KK, Akta Kelahiran, KTP Orang Tua, dan NISN), dapat hadir langsung ke salah satu kantor berikut:
    <ul style="margin:6px 0 0 16px; padding-left:0; line-height:1.55;">
      <li style="margin-bottom:4px;">
        <strong>Kantor YTPAI RML:</strong><br>
        Jalan Raya Babat - Surabaya, Dsn. Tegalrejo, Ds. Datinawong, Kec. Babat, Kab. Lamongan, Prov. Jawa Timur (Buka Sabtu s.d. Kamis pukul 07.00 s.d. 14.00 WIB. Hari Jum'at Libur Lembaga).
      </li>
      <li>
        <strong>Kantor Pelayanan Unit Pendidikan Formal Pilihan Anda:</strong><br>
        Bisa langsung menuju ke kantor tata usaha masing-masing unit mulai dari jenjang <strong>KB, TK, MI, MTs, SMP, MA, hingga SMA Raudlatul Muta'allimin Lamongan</strong> di lingkungan kompleks yayasan pada jam pelayanan lembaga (Sabtu s.d. Kamis pukul 07.00 s.d. 14.00 WIB, Hari Jum'at Libur).
      </li>
    </ul>
  </div>
</div>
<p style="margin:10px 0 0; font-size:0.88rem; color:#64748B;">Panitia PSB di sekretariat pusat maupun di kantor unit formal siap melayani dan mendampingi proses pengisian formulir hingga tuntas.</p>`
    },
    {
      id: "faq-3",
      order: 3,
      question: "Apakah biaya SPP bulanan sudah termasuk makan dan fasilitas asrama?",
      answer: "<strong>Ya, sudah mencakup semuanya (All-in-One).</strong> SPP bulanan santri mukim telah mencakup biaya pendidikan sekolah/madrasah formal, pengajian kitab kuning, makan 2 kali sehari dengan gizi seimbang, fasilitas listrik dan air asrama, serta layanan kesehatan Poskestren."
    },
    {
      id: "faq-4",
      order: 4,
      question: "Apakah menerima santri mutasi / pindahan dari sekolah lain?",
      answer: "Ya, kami menerima santri pindahan untuk jenjang MI, MTs/SMP (di kelas VII & VIII awal semester), serta MA/SMA (di kelas X & XI awal semester) dengan syarat membawa Surat Mutasi resmi EMIS/Dapodik dari sekolah asal dan bersedia mengikuti tes pemetaan baca kitab/Al-Qur'an."
    },
    {
      id: "faq-5",
      order: 5,
      question: "Apakah diperbolehkan sekolah saja tanpa tinggal di asrama (santri non-mukim)?",
      answer: "<strong>Ya, santri/siswa diperbolehkan memilih sistem non-mukim (pulang-pergi) maupun mukim (menetap di asrama pondok pesantren).</strong> Fasilitas non-mukim terbuka bagi seluruh jenjang pendidikan formal (KB, TK, MI, MTs, SMP, MA, dan SMA) bagi santri yang berdomisili dekat atau memilih tinggal bersama keluarga di rumah. Bagi santri yang memilih menetap di asrama pondok pesantren putra maupun putri, santri mendapatkan bimbingan ibadah berjamaah, tahfidz, dan kajian kitab salaf 24 jam."
    },
    {
      id: "faq-6",
      order: 6,
      question: "Apa saja materi ujian seleksi masuk santri baru?",
      answer: "Materi seleksi terdiri dari: 1) Tes Baca Al-Qur'an (makhraj dan tajwid dasar), 2) Tes hafalan surat pendek, 3) Tes potensi akademik dasar (Matematika & Bahasa), dan 4) Wawancara komitmen orang tua serta kesiapan santri mandiri di asrama."
    },
    {
      id: "faq-7",
      order: 7,
      question: "Apakah lulusan santri mendapatkan ijazah resmi negara?",
      answer: "<strong>Tentu.</strong> Seluruh satuan pendidikan formal di bawah naungan YTPAI (MI, MTs, SMP, MA, dan SMA) terakreditasi resmi BAN-S/M dari Kementerian Agama RI dan Kemendikbudristek RI, sehingga para alumni berhak menerima ijazah negara dan dapat melanjutkan ke perguruan tinggi negeri ternama, universitas kedinasan, maupun universitas internasional di Timur Tengah."
    },
    {
      id: "faq-8",
      order: 8,
      question: "Kapan wali santri baru diperbolehkan berkunjung (sambangan)?",
      answer: "Bagi santri baru, masa adaptasi awal berlangsung selama <strong>40 hari pertama</strong> tanpa kunjungan agar santri dapat beradaptasi dan mandiri. Setelah masa orientasi selesai, jadwal sambangan wali santri dibuka rutin setiap 2 minggu sekali pada hari Ahad sesuai jadwal kloter yang ditentukan pengurus asrama."
    },
    {
      id: "faq-9",
      order: 9,
      question: "Apa saja fasilitas yang didapatkan oleh santri di dalam kamar asrama?",
      answer: "Setiap kamar asrama dilengkapi dengan kasur busa representatif, bantal, lemari pakaian pribadi santri berkunci, rak kitab/buku, kipas angin pendingin ruangan, ventilasi silang udara segar, serta pengawasan CCTV di lorong dan area publik pesantren demi keamanan 24 jam."
    },
    {
      id: "faq-10",
      order: 10,
      question: "Apakah biaya masuk pesantren boleh diangsur?",
      answer: "<strong>Ya, diperbolehkan.</strong> Biaya infaq pangkal/masuk dapat diangsur hingga 3 kali pembayaran sepanjang semester pertama atas konfirmasi tertulis kepada bagian bendahara keuangan yayasan."
    }
  ],

  // Teks & Konten Utama Beranda (Hero Content)
  hero: {
    badgeTag: "Akreditasi Unggul (A)",
    badgeSlogan: "Unggul dalam Prestasi, Berkarakter dalam Budaya",
    headline: "Pendidikan Terbaik untuk <span class=\"highlight\">Generasi Unggul</span> dan Berkarakter",
    description: "Yayasan Taman Pendidikan Agama Islam Raudlatul Muta'allimin Lamongan mengintegrasikan kurikulum nasional, keunggulan sains terapan, serta keluhuran tradisi kepesantrenan salaf dalam satu ekosistem pendidikan modern.",
    cta1Text: "Daftar Santri Baru (PSB Online)",
    cta1Link: "#pendaftaran",
    cta2Text: "Jelajahi 11 Satuan Pendidikan",
    cta2Link: "#unit",
    taglines: [
      {
        badgeTag: "Akreditasi Unggul (A)",
        badgeSlogan: "Santri Putra & Putri Belajar • Babat Lamongan",
        headline: "Pendidikan Terbaik untuk <span class=\"highlight\">Generasi Unggul</span> dan Berkarakter",
        description: "Yayasan Taman Pendidikan Agama Islam Raudlatul Muta'allimin Lamongan membina santri putra dan santriwati putri dengan memadukan kurikulum nasional, keunggulan sains terapan, dan keluhuran tradisi kepesantrenan salaf."
      },
      {
        badgeTag: "Pondasi Fitrah Anak Sejak Dini",
        badgeSlogan: "KB & TK Raudlatul Muta'allimin",
        headline: "Pendidikan Anak Usia Dini: <span class=\"highlight\">Ceria, Mandiri</span> & Berakhlak Mulia",
        description: "Menstimulasi motorik, kecerdasan sensorik, pengenalan huruf hijaiyah ceria, dan penanaman adab islami anak usia dini (PAUD & TK) dalam suasana belajar yang hangat dan ramah anak."
      },
      {
        badgeTag: "Jenjang Menengah Pertama",
        badgeSlogan: "SMP & MTs Raudlatul Muta'allimin",
        headline: "Pembelajaran SMP & MTs: <span class=\"highlight\">Aktif, Literat</span> & Berwawasan Luas",
        description: "Santri putra dan putri dibimbing secara interaktif menguasai ilmu pengetahuan sains, matematika, bahasa internasional, serta tahfidz dan nilai-nilai akhlakul karimah."
      },
      {
        badgeTag: "Jenjang Menengah Atas",
        badgeSlogan: "SMA & MA Raudlatul Muta'allimin",
        headline: "Pendidikan SMA & MA: <span class=\"highlight\">Kecakapan Digital</span>, Riset Sains & Turats Salaf",
        description: "Mempersiapkan santri unggul berdaya saing global dengan penguasaan riset sains modern, laboratorium CBT, serta kedalaman mudzakarah kitab kuning turats salafiyah."
      }
    ]
  },

  // Foto & Slide Utama Beranda (Hero Slideshow Resolusi Tinggi Bebas Pecah)
  heroSlides: [
    {
      id: "slide-1",
      image: "assets/hero_belajar_santri.jpg",
      title: "Santri Putra & Putri Belajar Bersama dalam Suasana Pesantren Terpadu",
      badge: "Santri Putra & Putri Belajar",
      tag: "Pesantren Putra & Putri"
    },
    {
      id: "slide-2",
      image: "assets/belajar_anak_paud.jpg",
      title: "Pendidikan Anak Usia Dini (PAUD & TK): Ceria, Beradab & Mengenal Hijaiyah",
      badge: "Pondasi Fitrah & Karakter Dini",
      tag: "PAUD & TK Islam"
    },
    {
      id: "slide-3",
      image: "assets/belajar_santri_smp.jpg",
      title: "Pembelajaran Santri SMP & MTs: Aktif, Literat & Berwawasan Luas",
      badge: "Sains Terpadu & Nilai Qur'ani",
      tag: "Jenjang SMP & MTs"
    },
    {
      id: "slide-4",
      image: "assets/belajar_santri_sma.jpg",
      title: "Pembelajaran Santri SMA & MA: Riset Sains, Kecakapan Digital & Turats Salaf",
      badge: "Riset Sains & Digital Skill",
      tag: "Jenjang SMA & MA"
    }
  ],

  // 4 Pilar Nilai Dasar Pesantren (Ref: Maskumambang Core Values)
  coreValues: [
    {
      id: "nilai-1",
      title: "Beraqidah Shohihah",
      subtitle: "Merujuk pada kemurnian tauhid & keyakinan yang lurus sesuai ajaran Al-Qur'an dan Sunnah Ahlussunnah Wal Jama'ah.",
      icon: "book",
      statNumber: "2.500+",
      statLabel: "Santri Mukim & Kalong"
    },
    {
      id: "nilai-2",
      title: "Beramal Sholeh",
      subtitle: "Mengaplikasikan ilmu syariat dalam rutinitas keseharian, pembiasaan sholat berjamaah, dan ibadah sunnah.",
      icon: "heart",
      statNumber: "150+",
      statLabel: "Asatidz & Dewan Guru"
    },
    {
      id: "nilai-3",
      title: "Berilmu Manfaat",
      subtitle: "Penguasaan kitab kuning salafiyah dipadu kurikulum sains modern yang berdaya guna bagi peradaban umat.",
      icon: "lightbulb",
      statNumber: "11 Unit",
      statLabel: "Lembaga Formal & Pesantren"
    },
    {
      id: "nilai-4",
      title: "Berakhlaq Karimah",
      subtitle: "Membentuk kepribadian santri yang berbudi pekerti luhur, beradab mulia, tawadhu', dan berjiwa khidmah.",
      icon: "star",
      statNumber: "100%",
      statLabel: "Komitmen Kelulusan & Sanad"
    }
  ],

  // Slide Foto Banner Pintu Pendaftaran Santri Baru (PPDB Gateway Slider)
  ppdbGatewaySlides: [
    {
      id: "ppdb-slide-1",
      image: "assets/banner_ppdb_slide1.jpg",
      title: "Pintu Utama Pendaftaran Santri Baru - Gerbang Pesantren",
      link: "psb.html"
    },
    {
      id: "ppdb-slide-2",
      image: "assets/banner_ppdb_slide2.jpg?v=smart_asisten_v3",
      title: "Kenalkan RAUDLY - Asisten Santri Digital Cerdas Pesantren",
      link: "psb.html"
    },
    {
      id: "ppdb-slide-3",
      image: "assets/banner_ppdb_slide3.jpg",
      title: "Kompleks Terpadu & Pendidikan Unggulan Pesantren",
      link: "psb.html"
    }
  ],

  // Agenda & Jadwal Kegiatan Pesantren (Ref: Maskumambang Academic & Event Calendar)
  agenda: [
    {
      id: "event-1",
      title: "Penerimaan Santri Baru (PSB) Gelombang 1",
      dateDay: "15",
      dateMonth: "Okt",
      dateYear: "2026",
      timeRange: "08:00 - 15:00 WIB",
      location: "Kantor Sekretariat PSB & Online",
      desc: "Pembukaan resmi pendaftaran santri baru dan santri mutasi tahun ajaran 2026/2027 seluruh jenjang formal dan pesantren.",
      category: "PSB",
      status: "Mendatang"
    },
    {
      id: "event-2",
      title: "Ujian Marhalah & Tasmi' Kitab Kuning",
      dateDay: "28",
      dateMonth: "Okt",
      dateYear: "2026",
      timeRange: "Ba'da Shubuh & Isya'",
      location: "Aula Utama & Mushola Pondok Pesantren Putra YTPAI",
      desc: "Ujian evaluasi penguasaan kitab Fathul Qorib, Imrithi, dan Alfiyah Ibnu Malik bagi seluruh marhalah santri diniyah.",
      category: "Akademik",
      status: "Mendatang"
    },
    {
      id: "event-3",
      title: "Peringatan Hari Santri Nasional (HSN 2026)",
      dateDay: "22",
      dateMonth: "Okt",
      dateYear: "2026",
      timeRange: "06:30 - 12:00 WIB",
      location: "Lapangan Utama Pesantren Babat",
      desc: "Upacara bendera peringatan Hari Santri Nasional, parade kreasi santri, dan orasi kebangsaan Masyayikh YTPAI.",
      category: "Kegiatan Pesantren",
      status: "Mendatang"
    },
    {
      id: "event-4",
      title: "Wisuda Tahfidz & Khotmil Qur'an Ke-24",
      dateDay: "12",
      dateMonth: "Nov",
      dateYear: "2026",
      timeRange: "08:00 - 13:00 WIB",
      location: "Gedung Serbaguna YTPAI Lamongan",
      desc: "Wisuda akbar santri tahfidz 30 juz bil ghoib dan syahadah sanad qira'ah Al-Qur'an disaksikan dewan masyayikh dan wali santri.",
      category: "Wisuda",
      status: "Mendatang"
    }
  ],

  // Video Showcase & Parallax Section (Ref: Al-Manar style)
  videoShowcase: {
    badge: "Wawasan & Kehidupan Santri",
    headline: "Ke YTPAI Raudlatul Muta'allimin Lamongan,<br><span class=\"highlight-gold\">Apa yang Kamu Cari?</span>",
    description: "Menemukan perpaduan mutiara tradisi salafiyah, kedalaman sains terapan, kecakapan bahasa internasional, dan keteladanan akhlaqul karimah dalam satu naungan yayasan dan pondok pesantren asri di Babat Lamongan.",
    videoTag: "Orientasi Santri Baru",
    videoTitle: "Mendidik Santri Berkarakter dengan Disiplin & Kasih Sayang",
    speakerName: "Masyayikh & Dewan Pengasuh Pesantren YTPAI",
    youtubeUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
    youtubeId: "M7lc1UVf-VE",
    ctaText: "Daftar Murid Baru (SPMB Online)",
  },

  // 7 Satuan Pendidikan Formal Mandiri di bawah naungan YTPAI Raudlatul Muta'allimin Lamongan
  units: [
    {
      id: "kb",
      name: "KB Raudlatul Muta'allimin",
      category: "PAUD / Kelompok Bermain",
      shortDesc: "Pendidikan anak usia dini berbasis stimulasi motorik, keceriaan, dan penanaman adab islami sejak usia dini.",
      fullDesc: "Kelompok Bermain (KB) Raudlatul Muta'allimin menyelenggarakan pendidikan anak usia dini yang ramah anak, merangsang kecerdasan kinestetik, afektif, dan pengenalan nilai-nilai akhlakul karimah dengan metode bermain sambil belajar yang menyenangkan.",
      image: "assets/belajar_anak_paud.jpg",
      programs: ["Stimulasi Sensorik & Motorik Anak", "Hafalan Doa & Hadits Harian Cilik", "Mengenal Huruf Hijaiyah Ceria", "Toilet Training & Kemandirian Adab"],
      accreditation: "Terakreditasi BAN-PAUD",
      leadershipTitle: "Kepala Kelompok Bermain",
      headmaster: "Ustadzah Siti Khodijah, S.Pd.I",
      headmasterPhoto: "assets/tutor_novin.jpg",
      headmasterSpeechTitle: "Merawat Fitrah, Menumbuhkan Kasih Sayang & Adab Sejak Dini",
      headmasterSpeech: `Bismillahirrohmaanirrohiim. Alhamdulillahi Rabbil 'Alamin.

Selamat datang di Kelompok Bermain (KB) Raudlatul Muta'allimin Lamongan. Kami meyakini bahwa usia dini adalah masa keemasan (golden age) di mana pondasi iman, adab, dan fitrah keingintahuan ananda sedang mekar dengan indahnya.

Melalui bimbingan penuh kasih sayang, pembiasaan doa harian, pengenalan huruf hijaiyah ceria, dan stimulasi sensori motorik yang ramah anak, kami mendampingi putra-putri tercinta bertumbuh menjadi anak sholeh-sholehah yang ceria, mandiri, dan berakhlak mulia. Semoga langkah awal di KB Raudlatul Muta'allimin ini menjadi permulaan barakah bagi perjalanan panjang masa depan ananda.`,
      quota: "3 Rombel (60 Siswa)",
      studyTime: "Pagi (07.30 - 10.30 WIB)",
      facilities: ["Ruang Bermain Edukatif AC", "Taman Sensori Motorik & Mandi Bola", "Pojok Dongeng Islami Ceria", "Toilet Training Khusus Anak", "UKS Cilik & Ruang Istirahat"],
      extracurriculars: ["Tari Kreasi Santri Cilik", "Mewarnai & Finger Painting", "Hafalan Doa Cilik", "Senam Irama Ceria"],
      gallery: [
        { src: "assets/belajar_anak_paud.jpg", caption: "Aktivitas Belajar & Bermain Ceria Santri Cilik KB" },
        { src: "assets/kampus_gedung.jpg", caption: "Bermain Ceria & Sosialisasi Adab Berkelompok" },
        { src: "assets/hero_belajar_santri.jpg", caption: "Mengenal Huruf Hijaiyah Ceria & Iqro' Dasar" },
        { src: "assets/pesantren_gedung.jpg", caption: "Pentas Seni & Kreasi Anak Soleh Penuh Senyum" }
      ]
    },
    {
      id: "tk",
      name: "TK Raudlatul Muta'allimin",
      category: "Taman Kanak-Kanak (TK)",
      shortDesc: "Persiapan matang menuju jenjang sekolah dasar dengan fondasi literasi, numerasi Qur'ani, dan akhlaqul karimah.",
      fullDesc: "Taman Kanak-Kanak (TK) Raudlatul Muta'allimin membimbing peserta didik usia 4-6 tahun untuk siap melangkah ke jenjang pendidikan dasar. Mengintegrasikan calistung ramah anak, metode tartil Qur'an Yanbu'a cilik, pembiasaan sholat dhuha berjamaah, dan pentas kreativitas seni.",
      image: "assets/unit_tk_photo.jpg",
      programs: ["Calistung Ceria & Ramah Anak", "Hafalan Surat Pendek Juz 'Amma", "Tartil Qur'an Metode Yanbu'a", "Pentas Kreativitas & Seni Santri Cilik"],
      accreditation: "Akreditasi A Unggul",
      leadershipTitle: "Kepala Taman Kanak-Kanak",
      headmaster: "Ustadzah Hj. Masluhah, S.Pd",
      headmasterPhoto: "assets/tutor_dinda.jpg",
      headmasterSpeechTitle: "Fondasi Literasi Qur'ani dan Karakter Ceria Menuju Generasi Emas",
      headmasterSpeech: `Assalamu'alaikum Warahmatullahi Wabarakatuh.

Puji syukur ke hadirat Allah SWT. Taman Kanak-Kanak (TK) Raudlatul Muta'allimin hadir memberikan ekosistem pembelajaran usia prasekolah yang menyeimbangkan antara kesiapan kognitif (calistung ramah anak), keluhuran budi pekerti, serta kecintaan mendalam kepada Al-Qur'an melalui metode Yanbu'a cilik.

Kami membina ananda dengan penuh kesabaran agar tumbuh percaya diri, santun bertutur kata, tekun beribadah dhuha bersama, dan siap melangkah dengan mantap menuju jenjang pendidikan dasar. Bersama para asatidzah berdedikasi, kami siap bermitra erat dengan Ayah dan Bunda demi masa depan putra-putri kita tercinta.`,
      quota: "4 Rombel (90 Siswa)",
      studyTime: "Pagi (07.30 - 11.00 WIB)",
      facilities: ["Kelas Multimedia Interaktif AC", "Laboratorium Calistung Qur'ani", "Arena Bermain Outbound Mini", "Musholla Cilik Yanbu'a", "Perpustakaan Mini Ceria"],
      extracurriculars: ["Tartil Yanbu'a Cilik", "Drumband Santri Cilik", "Pentas Dongeng & Teater Cilik", "Praktek Sholat Berjamaah"],
      gallery: [
        { src: "assets/unit_tk_photo.jpg", caption: "Persiapan Literasi Qur'ani & Calistung Santri TK Ceria" },
        { src: "assets/tahfidz_quran_pesantren.jpg", caption: "Bimbingan Tahfidz Yanbu'a Cilik Berkelanjutan" },
        { src: "assets/hero_belajar_santri.jpg", caption: "Pojok Literasi, Dongeng Islami & Akhlaq Mulia" },
        { src: "assets/mushola_utama.jpg", caption: "Praktik Ibadah Sholat Dhuha Berjamaah di Sekolah" }
      ]
    },
    {
      id: "mi",
      name: "MI Raudlatul Muta'allimin",
      category: "Madrasah Ibtidaiyah (MI)",
      shortDesc: "Fondasi keagamaan kokoh, program tahfidz juz 30 bersanad, dan kurikulum sains integratif madrasah unggul.",
      fullDesc: "Madrasah Ibtidaiyah (MI) Raudlatul Muta'allimin memadukan Kurikulum Merdeka Kemenag dengan muatan lokal kepesantrenan. Mendidik siswa menguasai literasi sains dasar, matematika terapan, bahasa Arab dasar, hafalan juz 30 bersanad, serta sholat dhuha dan dhuhur berjamaah.",
      image: "assets/unit_mi_photo.jpg",
      programs: ["Tahfidz Juz 30 Bersanad", "Klub Sains Cilik & Olimpiade Matematika", "Praktik Bahasa Arab & Inggris Dasar", "Tartil Metode Yanbu'a Bersertifikat"],
      accreditation: "Akreditasi A Unggul",
      leadershipTitle: "Kepala Madrasah Ibtida'iyah",
      headmaster: "Nur Afidah Y., S.Pd",
      headmasterPhoto: "assets/kepala_mi_nur_afidah.jpg",
      structural: {
        kurikulum: "Marfu'ah, S.Pd"
      },
      headmasterSpeechTitle: "Memadukan Kecerdasan Sains Dasar dengan Kemurnian Hafalan Al-Qur'an",
      headmasterSpeech: `Assalamu'alaikum Warahmatullahi Wabarakatuh.

Madrasah Ibtidaiyah (MI) Raudlatul Muta'allimin berkomitmen menghadirkan pendidikan dasar terpadu yang memadukan keunggulan Kurikulum Nasional Kemenag dengan ruh kepesantrenan. Target kami jelas: melahirkan peserta didik yang tangkas dalam literasi dan numerasi sains, fasih berbahasa, serta tuntas menghafal Juz 30 Al-Qur'an bersanad.

Pembiasaan sholat berjamaah, halaqah tahfidz yang nyaman, dan pembinaan karakter disiplin menjadi denyut nadi harian kami. Kami siap mengawal putra-putri bapak ibu menjadi generasi Qur'ani yang berprestasi tinggi dan berbakti kepada orang tua.`,
      quota: "4 Rombel (120 Siswa)",
      studyTime: "Full Day (07.00 - 14.30 WIB)",
      facilities: ["Ruang Kelas Multimedia Ber-AC", "Lab Sains Cilik & Matematika", "Halaqah Tahfidz Berkarpet Nyaman", "Lapangan Futsal & Badminton", "Kantin Sehat & Halal Mart"],
      extracurriculars: ["Tahfidzul Qur'an Juz 30 Bersanad", "Klub Sains Cilik & OSN", "Pramuka Gudep MI", "Hadrah Banjari Junior", "Klub Olahraga Santri (Futsal & Voli)"],
      gallery: [
        { src: "assets/unit_mi_photo.jpg", caption: "Pembelajaran Tahfidz & Sains Dasar Integratif MI" },
        { src: "assets/belajar_santri_smp.jpg", caption: "Eksplorasi Laboratorium Sains Dasar Ceria" },
        { src: "assets/tahfidz_quran_pesantren.jpg", caption: "Halaqah Tahfidz Juz 30 Bersanad dengan Ustadz" },
        { src: "assets/pesantren_gedung.jpg", caption: "Kompleks Gedung & Lapangan MI Terpadu" }
      ]
    },
    {
      id: "mts",
      name: "MTs Raudlatul Muta'allimin",
      category: "Madrasah Tsanawiyah (MTs)",
      shortDesc: "Pendidikan menengah pertama berciri khas madrasah memadukan riset sains, tahfidz intensif, dan kitab kuning dasar.",
      fullDesc: "Madrasah Tsanawiyah (MTs) Raudlatul Muta'allimin berada di bawah naungan Kemenag RI dengan keunggulan integrasi kurikulum nasional dan nilai salafiyah. Siswa digembleng dalam riset sains madrasah, penguasaan gramatika bahasa Arab (Nahwu-Shorof dasar), tahfidzul Qur'an, serta pembentukan akhlak mandiri.",
      image: "assets/unit_mts_photo.jpg",
      programs: ["Kelas Riset Sains & Olimpiade Madrasah", "Halaqah Tahfidzul Qur'an Intensif", "Kajian Kitab Kuning Dasar (Nahwu-Shorof)", "Bilingual Arabic & English Daily Atmosphere"],
      accreditation: "Akreditasi A Unggul",
      leadershipTitle: "Kepala Madrasah Tsanawiyah",
      headmaster: "Syaikhul Abid, S.Pd",
      headmasterPhoto: "assets/kepala_mts_syaikhul_abid.jpg",
      structural: {
        kurikulum: "Ida Rufaida, M.Pd",
        kesiswaan: "M. Ilham M., S.Pd",
        bk: "Afifah, S.Pd",
        humas: "Edi Dzulqornain, S.Pd"
      },
      headmasterSpeechTitle: "Mengokohkan Riset Madrasah, Tahfidz Al-Qur'an, dan Khazanah Salafiyah",
      headmasterSpeech: `Bismillahirrohmaanirrohiim. Assalamu'alaikum Warahmatullahi Wabarakatuh.

Di Madrasah Tsanawiyah (MTs) Raudlatul Muta'allimin, santri memasuki gerbang pendewasaan intelektual dan spiritual yang krusial. Kami memadukan dua pilar agung: penguasaan metodologi riset sains madrasah dan ketekunan mengkaji kaidah kitab kuning salaf (Nahwu-Shorof dasar serta fiqih ibadah).

Dengan pembiasaan lingkungan bilingual (Arab-Inggris) dan pengawasan asrama terpadu, kami mendidik santri menjadi pribadi yang tangguh secara mental, luas wawasan keilmuannya, dan kokoh dalam memegang teguh aqidah Ahlussunnah Wal Jama'ah an-Nahdliyyah.`,
      quota: "5 Rombel (160 Santri)",
      studyTime: "Pesantren Terpadu / Full Day",
      facilities: ["Laboratorium Riset IPA Terpadu", "Lab Komputer CBT Modern", "Perpustakaan Digital Madrasah", "Gedung Asrama Bertingkat", "Mushola Pondok Pesantren Putra (Utama)"],
      extracurriculars: ["Kelas Riset Ilmiah Remaja (KIR)", "Halaqah Tahfidz & Nahwu Shorof", "Pramuka Inti Garuda", "English & Arabic Club", "Seni Kaligrafi Al-Qur'an"],
      gallery: [
        { src: "assets/unit_mts_photo.jpg", caption: "Praktikum Riset Sains Madrasah & Laboratorium IPA MTs" },
        { src: "assets/hero_belajar_santri.jpg", caption: "Kajian Nahwu Shorof & Fiqih Salafiyah Santri MTs" },
        { src: "assets/tahfidz_quran_pesantren.jpg", caption: "Setoran Tahfidz Al-Qur'an Santri MTs Bersanad" },
        { src: "assets/pesantren_gedung.jpg", caption: "Santri MTs Berprestasi & Upacara Hari Santri" }
      ]
    },
    {
      id: "smp",
      name: "SMP Raudlatul Muta'allimin",
      category: "Sekolah Menengah Pertama (SMP)",
      shortDesc: "Sekolah menengah pertama berstandar nasional yang memadukan IPTEK, kepemimpinan karakter, dan nilai islami.",
      fullDesc: "Sekolah Menengah Pertama (SMP) Raudlatul Muta'allimin berada di bawah naungan Kemendikbudristek dengan orientasi keunggulan teknologi informasi, sains modern, dan karakter kepemimpinan. Dilengkapi laboratorium komputer canggih, bimbingan olimpiade sains nasional, serta pembinaan akhlak mulia.",
      image: "assets/belajar_santri_smp.jpg",
      programs: ["Laboratorium Komputer & Literasi Digital", "Praktikum Sains & Eksperimen IPA Terpadu", "Pramuka Inti & Olahraga Prestasi", "Bina Karakter Kepemimpinan Pelajar Beradab"],
      accreditation: "Akreditasi A Unggul",
      leadershipTitle: "Kepala Sekolah Menengah Pertama",
      headmaster: "Faishol Amir, S.Pd",
      headmasterPhoto: "assets/kepala_smp_faishol_amir.jpg",
      structural: {
        kurikulum: "Nur Faizah., S.Pd",
        kesiswaan: "Fellicya Dian R., S.Pd",
        bk: "Febrian Putri E., S.Pd",
        humas: "Mokammad Syafi'i, S.H"
      },
      headmasterSpeechTitle: "Pelopor Literasi Digital, Teknologi Modern, dan Kepemimpinan Beradab",
      headmasterSpeech: `Assalamu'alaikum Warahmatullahi Wabarakatuh.

Menghadapi era disrupsi digital dan kecerdasan buatan, SMP Raudlatul Muta'allimin hadir menjawab tantangan zaman dengan membekali siswa literasi teknologi, laboratorium komputer koding, dan penguatan praktikum IPA terstandar, tanpa pernah meninggalkan keluhuran adab islami.

Kami menanamkan kepemimpinan pelajar, kedisiplinan organisasi, serta kejujuran moral. Siswa kami bimbing untuk tidak hanya menjadi konsumen teknologi, melainkan kreator inovatif yang berakhlak karimah dan siap bersaing di kancah nasional.`,
      quota: "4 Rombel (130 Siswa)",
      studyTime: "Full Day & Boarding",
      facilities: ["Studio Komputer & Koding Modern", "Laboratorium Bahasa Digital", "Laboratorium Robotika Pelajar", "Lapangan Basket & Futsal", "UKS & Klinik Kesehatan Pesantren"],
      extracurriculars: ["Robotika & Pemrograman Dasar", "Olimpiade Sains Nasional (OSN)", "Pramuka Pasukan Khusus", "Bulu Tangkis & Sepak Bola", "Jurnalistik & Desain Grafis"],
      gallery: [
        { src: "assets/belajar_santri_smp.jpg", caption: "Laboratorium Komputer, Koding & Praktikum Sains SMP" },
        { src: "assets/unit_sma_photo.jpg", caption: "Praktikum IPA, Matematika & Robotika Berprestasi" },
        { src: "assets/hero_belajar_santri.jpg", caption: "Latihan Dasar Kepemimpinan Santri (LDKS)" },
        { src: "assets/pesantren_gedung.jpg", caption: "Sarana Olahraga & Lapangan Futsal Terpadu" }
      ]
    },
    {
      id: "ma",
      name: "MA Raudlatul Muta'allimin",
      category: "Madrasah Aliyah (MA)",
      shortDesc: "Pendidikan menengah atas berciri Islam dengan peminatan Keagamaan/Bahasa, IPA, dan IPS berorientasi kuliah dalam & luar negeri.",
      fullDesc: "Madrasah Aliyah (MA) Raudlatul Muta'allimin mencetak kader ulama intelektual dan saintis muslim. Menyediakan peminatan Keagamaan (Tafsir, Hadits, Fiqih Turats), Bahasa, serta IPA/IPS. Memiliki rekam jejak meluluskan santri ke Universitas Al-Azhar Kairo, Timur Tengah, dan UIN ternama.",
      image: "assets/unit_ma_photo.jpg",
      programs: ["Peminatan Keagamaan & Kajian Kitab Turats Salaf", "Program Khusus Sukses Beasiswa Al-Azhar Mesir & Timur Tengah", "Bahasa Arab Aktif (Muhadatsah & Munadhoroh)", "Halaqah Mudzakarah Ilmiah & Bahsul Masail"],
      accreditation: "Akreditasi A Unggul",
      leadershipTitle: "Kepala Madrasah Aliyah",
      headmaster: "Shollahudin, M.Pd",
      headmasterPhoto: "assets/kepala_ma_shollahudin.jpg",
      structural: {
        kurikulum: "Ahmad Syadad, S.Hi",
        kesiswaan: "Zaini Abidin, S.Kom",
        bk: "Aderika Nur F, S.Pd",
        humas: "Nur Ali, S.Pd"
      },
      headmasterSpeechTitle: "Mencetak Kader Ulama Intelektual Siap Berkiprah di Kancah Global",
      headmasterSpeech: `Assalamu'alaikum Warahmatullahi Wabarakatuh.

Madrasah Aliyah (MA) Raudlatul Muta'allimin mengemban amanah suci sebagai kawah penggemblengan kader ulama, fuqaha', dan saintis muslim. Dengan kekayaan kurikulum peminatan keagamaan turats salaf, muhadatsah bahasa Arab aktif, dan pembinaan riset ilmiah, santri kami persiapkan menembus perguruan tinggi terkemuka dunia.

Alhamdulillah, rekam jejak lulusan kami yang menembus Universitas Al-Azhar Kairo Mesir serta UIN ternama menjadi bukti nyata mutu pembinaan kami. Kami senantiasa menyambut para santri yang bertekad kuat mendalami agama dan mengharumkan umat.`,
      quota: "5 Rombel (160 Santri)",
      studyTime: "Mukim Asrama Pesantren (24 Jam)",
      facilities: ["Halaqah Turats & Bahtsul Masail", "Studio Siaran Bahasa Arab-Inggris", "Perpustakaan Kitab Salaf Lengkap", "Laboratorium Komputer Ujian Mandiri", "Asrama Representatif 3 Lantai"],
      extracurriculars: ["Mudzakarah Fiqih Turats & Falak", "Persiapan Beasiswa Al-Azhar Mesir", "Debat Bahasa Arab & Inggris", "Seni Kaligrafi Tsuluts & Diwani", "Banjari Syauqul Musthofa"],
      gallery: [
        { src: "assets/unit_ma_photo.jpg", caption: "Mudzakarah Kitab Turats, Riset Sains & Kajian Santri MA" },
        { src: "assets/hero_belajar_santri.jpg", caption: "Kajian Kitab Kuning & Halaqah Al-Qur'an Bersanad" },
        { src: "assets/unit_sma_photo.jpg", caption: "Bimbingan Seleksi Beasiswa Al-Azhar Mesir & SNBT" },
        { src: "assets/pesantren_gedung.jpg", caption: "Wisudawan & Kader Ulama MA Raudlatul Muta'allimin" }
      ]
    },
    {
      id: "sma",
      name: "SMA Raudlatul Muta'allimin",
      category: "Sekolah Menengah Atas (SMA)",
      shortDesc: "Sekolah menengah atas umum dengan kurikulum riset sains, teknologi digital, dan persiapan sukses tembus PTN & Kedinasan.",
      fullDesc: "Sekolah Menengah Atas (SMA) Raudlatul Muta'allimin berfokus mencetak generasi mukmin cendekia yang berdaya saing tinggi di tingkat nasional dan global. Menyelenggarakan jurusan MIPA (kedokteran, teknik, sains terapan) dan IPS (ekonomi syariah, bisnis & sosiologi) dengan target lolos 90% PTN Favorit dan sekolah kedinasan.",
      image: "assets/unit_sma_photo.jpg",
      programs: ["Peminatan MIPA: Laboratorium Riset & Kedokteran", "Peminatan IPS: Syariah Entrepreneurship & Bisnis", "Bimbingan Intensif Sukses SNBT & Kedinasan", "Studio Multimedia, Desain Grafis & Coding"],
      accreditation: "Akreditasi A Unggul",
      leadershipTitle: "Kepala Sekolah Menengah Atas",
      headmaster: "Khoirul Umam, M.Pd",
      headmasterPhoto: "assets/kepala_sma_khoirul_umam.jpg",
      structural: {
        kurikulum: "Rizal Abdi K., S.Pd",
        kesiswaan: "Juhar Manik, S.Pd",
        bk: "Habibatul A., S.Pd",
        humas: "Ferdi Arianto, S.Pd"
      },
      headmasterSpeechTitle: "Riset Sains Terpadu, Inkubasi PTN Favorit, dan Ketahanan Karakter Santri",
      headmasterSpeech: `Bismillahirrohmaanirrohiim. Assalamu'alaikum Warahmatullahi Wabarakatuh.

SMA Raudlatul Muta'allimin mendedikasikan diri untuk melahirkan generasi mukmin cendekia yang berdaya saing global. Melalui kurikulum MIPA riset kedokteran dan IPS entrepreneurship syariah yang terintegrasi bimbingan intensif SNBT-CBT, target kami adalah menghantarkan santri lolos ke PTN favorit dan sekolah kedinasan impian.

Prestasi akademik sains dan teknologi kami padukan selaras dengan sholat berjamaah, tahfidz, dan adab kepesantrenan, sehingga lulusan SMA Raudlatul Muta'allimin tampil sebagai saintis dan profesional muslim yang berintegritas tinggi.`,
      quota: "5 Rombel (160 Siswa)",
      studyTime: "Reguler & Mukim Asrama",
      facilities: ["Laboratorium MIPA Terstandar Nasional", "Studio Riset Sains & Inkubator PTN", "Pusat CBT UTBK-SNBT Mandiri", "Studio Podcast & Multimedia 4K", "Sport Center & Lapangan Terpadu"],
      extracurriculars: ["Bimbel Intensif Lolos PTN & Kedinasan", "Karya Ilmiah Remaja Terapan (KIR)", "Santri Media Club & Sinematografi", "English Public Speaking Club", "Futsal Liga Pelajar"],
      gallery: [
        { src: "assets/unit_sma_photo.jpg", caption: "Praktikum Sains & Riset MIPA Persiapan PTN Favorit" },
        { src: "assets/belajar_santri_sma.jpg", caption: "Laboratorium Komputer, Koding & Literasi Digital SMA" },
        { src: "assets/lbb_bimbel_intensif.jpg", caption: "Simulasi Ujian UTBK-SNBT & Tryout CBT Laboratorium" },
        { src: "assets/hero_belajar_santri.jpg", caption: "Klub Debat, Karya Ilmiah Remaja & Kepemimpinan" }
      ]
    }
  ],

  // 2 Sayap Asrama Kepesantrenan (Pondok Pesantren Putra & Putri)
  boardingWings: [
    {
      id: "ponpes-putra",
      name: "Pondok Pesantren Putra Raudlatul Muta'allimin",
      category: "Asrama Santri Putra (Mukim)",
      shortDesc: "Asrama santri putra dengan pembinaan disiplin 24 jam, tahfidzul Qur'an bersanad, dan kajian kitab kuning salaf.",
      fullDesc: "Kompleks Pondok Pesantren Khusus Putra yang menaungi santri dari berbagai penjuru daerah. Diasuh langsung oleh Masyayikh dan Dewan Asatidz dengan sistem asrama 24 jam yang tertib dan mandiri. Menyelenggarakan program tahfidzul Qur'an, mudzakarah kitab kuning turats salafiyah, pembiasaan sholat fardhu berjamaah di Mushola Pondok Pesantren Putra (mushola utama pesantren & pusat ngaji bersama alumni), bahasa Arab aktif, serta pembentukan karakter kepemimpinan muslim tangguh.",
      image: "assets/asrama_putra_landscape.jpg",
      programs: ["Tahfidzul Qur'an 30 Juz Bersanad", "Kajian Kitab Kuning Turats Salaf", "Asrama Disiplin 24 Jam Mandiri", "Halaqah Mudzakarah & Bahsul Masail"],
      accreditation: "Pondok Pesantren Mu'adalah Kemenag",
      headmaster: "Ust. M. Anis Fuad, S.Ag & Tim Dewan Musyrif",
      musyrif: "Ust. M. Anis Fuad, S.Ag & Tim Dewan Musyrif (Pendampingan & Pengasuhan 24 Jam)",
      headmasterPhoto: "assets/pembimbing_baqir.jpg",
      headmasterSpeechTitle: "Menempa Kemandirian, Disiplin Ibadah 24 Jam, dan Penguasaan Turats Ulama Salaf",
      headmasterSpeech: `Bismillahirrohmaanirrohiim. Alhamdulillahi Rabbil 'Alamin, wassholatu wassalamu 'ala Asyrofil Anbiya'i wal Mursalin, Sayyidina Muhammadin wa 'ala alihi wasohbihi ajma'in. Amma ba'du.

Ahlan wa sahlan bihudhurikum di Pondok Pesantren Putra Raudlatul Muta'allimin, Babat, Lamongan.

Pesantren bukan sekadar tempat menuntut ilmu fiqih atau menghafal Al-Qur'an secara tekstual, melainkan kawah candradimuka tempat penempaan adab, akhlaqul karimah, keteguhan hati, serta pembentukan karakter kepemimpinan muslim yang mandiri dan bertanggung jawab.

Melalui sistem asrama mukim 24 jam dengan bimbingan intensif para Masyayikh dan Tim Dewan Musyrif, setiap santri putra dibiasakan mendirikan sholat fardhu berjamaah di Mushola Pondok Pesantren Putra (mushola utama pesantren), mengkaji kitab kuning turats salafiyah dengan sanad muttashil, melatih kedisiplinan hidup berjamaah, serta memadukan kecerdasan spiritual dengan wawasan kemajuan zaman.

Pintu pengasuhan asrama senantiasa terbuka untuk membimbing, mendampingi, dan mengawal ananda menjadi generasi sholih yang berbakti kepada orang tua, agama, dan bangsa.`,
      quota: "Kapasitas 1.500 Santri Mukim",
      studyTime: "Pondok Pesantren 24 Jam",
      facilities: ["Gedung Asrama Putra Bertingkat", "Mushola Pondok Pesantren Putra (Utama)", "Dapur Umum & Katering Bersih", "Klinik Pratama Santri 24 Jam", "Kantin & Koperasi Pondok"],
      extracurriculars: ["Kajian Ba'da Subuh & Maghrib", "Tahfidz 30 Juz Bersanad", "Latihan Khitobah 3 Bahasa", "Ro'an Kebersihan & Bakti Lingkungan", "Klub Olahraga Santri (Futsal & Voli)"],
      gallery: [
        { src: "assets/asrama_putra_landscape.jpg", caption: "Halaqah Sorogan Santri Putra di Serambi Mushola Pondok Putra" },
        { src: "assets/hero_santri.jpg", caption: "Kehidupan Disiplin Belajar Santri Pondok Putra" },
        { src: "assets/program_4_kitab.jpg", caption: "Mudzakarah Kitab Salaf Ba'da Subuh" },
        { src: "assets/mushola_utama.jpg", caption: "Sholat Berjamaah di Mushola Pondok Pesantren Putra" }
      ]
    },
    {
      id: "ponpes-putri",
      name: "Pondok Pesantren Putri Raudlatul Muta'allimin",
      category: "Asrama Santriwati Putri (Mukim)",
      shortDesc: "Asrama santriwati aman, nyaman, dan terjaga syar'i. Fokus pada tahfidzul Qur'an, fiqih wanita (nisaiyyah), dan adab salaf.",
      fullDesc: "Kompleks Pondok Pesantren Khusus Putri yang dirancang khusus dengan tata ruang asri, aman, dan privasi tertutup (syar'i) dengan penjagaan 24 jam. Dilengkapi sarana ibadah Mushola Pondok Pesantren Putri yang bersifat eksklusif khusus santriwati mukim. Diasuh oleh Ibu Nyai dan Dewan Asatidzah berkompeten dalam mencetak santriwati hafidzah Al-Qur'an, mutafaqqihah fiddin, menguasai fiqih wanita (nisaiyyah), berakhlaqul karimah, serta memiliki keterampilan tata boga dan seni keputrian.",
      image: "assets/asrama_putri_landscape.jpg",
      programs: ["Tahfidzatil Qur'an Khusus Putri", "Kajian Fiqih Wanita (Nisaiyyah)", "Pembinaan Adab & Karakter Muslimah", "Klub Seni Hadrah Banjari & Tata Boga"],
      accreditation: "Pondok Pesantren Mu'adalah Kemenag",
      headmaster: "Ustdzh. Hj. Masluhah, S.Pd & Tim Dewan Musyrifah",
      musyrif: "Ustdzh. Hj. Masluhah, S.Pd & Tim Dewan Musyrifah (Pendampingan & Pengasuhan 24 Jam)",
      headmasterPhoto: "assets/pembimbing_rodhiyah.jpg",
      headmasterSpeechTitle: "Mendidik Generasi Hafidzah, Mutafaqqihah Fiddin, dan Berakhlaqul Karimah",
      headmasterSpeech: `Bismillahirrohmaanirrohiim. Assalamu'alaikum Warahmatullahi Wabarakatuh.

Selamat datang di Kompleks Pondok Pesantren Putri Raudlatul Muta'allimin Lamongan.

Lingkungan asrama santriwati kami rancang secara khusus dengan prinsip aman, nyaman, asri, dan terjaga privasi syar'i secara penuh 24 jam. Kami berikhtiar sekuat tenaga bersama Ibu Nyai dan segenap Dewan Musyrifah untuk menghadirkan suasana asrama yang penuh kekeluargaan, kasih sayang, dan ketertiban ibadah.

Di sini, para santriwati dibimbing menata niat untuk menghafalkan kalam Ilahi (Tahfidzatil Qur'an), memperdalam pemahaman fiqih wanita (nisaiyyah), membiasakan busana dan adab santun, serta mengasah keterampilan hidup seperti tata boga, muhadatsah bahasa, dan kepemimpinan muslimah yang tangguh.

Semoga setiap tetes ikhtiar belajar ananda di pondok pesantren ini menjadi jariyah pahala bagi kedua orang tua dan bekal kemuliaan hidup di masa depan.`,
      quota: "Kapasitas 1.000 Santriwati Mukim",
      studyTime: "Pondok Pesantren Putri 24 Jam",
      facilities: ["Kompleks Asrama Putri Terjaga Syar'i", "Mushola Pondok Pesantren Putri (Eksklusif)", "Dapur Higienis & Ruang Tata Boga", "Taman Asri & Area Jemur Tertutup", "Poskestren Khusus Santriwati"],
      extracurriculars: ["Tahfidzatil Qur'an Khusus Putri", "Fiqih Wanita & Bimbingan Keputrian", "Seni Hadrah Banjari Santriwati", "Kursus Tata Boga & Kerajinan Tangan", "Klub Muhadatsah Arab-Inggris"],
      gallery: [
        { src: "assets/asrama_putri_landscape.jpg", caption: "Halaqah Tahfidzatil Qur'an Asri Santriwati Putri" },
        { src: "assets/program_1_tahfidz.jpg", caption: "Bimbingan Tahsin & Qiro'ah Santriwati" },
        { src: "assets/program_3_bahasa.jpg", caption: "Pekan Muhadatsah Bahasa Arab-Inggris Santriwati" },
        { src: "assets/program_5_pengabdian.jpg", caption: "Pelatihan Keterampilan & Fiqih Nisaiyyah" }
      ]
    }
  ],

  // 4 Unit Pendidikan Non-Formal & Lembaga Penunjang Yayasan
  nonFormalUnits: [
    {
      id: "madin",
      name: "Madrasah Diniyah Takmiliyah (MDT)",
      category: "Non-Formal (Sub Ula & Wustho)",
      shortDesc: "Pusat pendalaman ilmu fiqih, tafsir, hadits, dan gramatika bahasa Arab (Nahwu-Shorof) berjenjang sub Ula dan Wustho.",
      fullDesc: "Madrasah Diniyah Takmiliyah (MDT) Raudlatul Muta'allimin menyelenggarakan pendidikan keagamaan Islam non-formal berjenjang sub Ula dan Wustho sebagai pelengkap dan penguatan pendidikan santri. Santri dibimbing mengkaji teks klasik muktabarah karya ulama salafus sholih dengan sanad keilmuan yang bersambung.",
      image: "assets/program_4_kitab.jpg",
      programs: ["Jenjang MDT Ula & MDT Wustho", "Kajian Matan Jurumiyah & Imrithi", "Fathul Qorib & Bidayatul Hidayah", "Mudzakarah Masail Diniyah Santri"],
      accreditation: "Terdaftar Kemenag RI (MDT)",
      headmaster: "Ust. M. Anis Fuad, S.Ag",
      headmasterPhoto: "assets/pembimbing_baqir.jpg",
      headmasterSpeechTitle: "Menyambung Mata Rantai Sanad Keilmuan Turats Ulama Salafiyah",
      headmasterSpeech: `Bismillahirrohmaanirrohiim. Assalamu'alaikum Warahmatullahi Wabarakatuh.

Madrasah Diniyah Takmiliyah (MDT) Raudlatul Muta'allimin hadir sebagai pilar pengokoh tradisi keilmuan Islam klasik. Melalui jenjang marhalah sub Ula dan Wustho, kami membimbing santri memahami teks-teks mu'tabarah warisan ulama salaf secara terstruktur—mulai dari kaidah gramatika bahasa Arab (Nahwu-Shorof), aqidah Ahlussunnah wal Jama'ah an-Nahdliyyah, hingga fiqih madzhab Syafi'i.

Keilmuan yang dipelajari tidak berhenti pada hafalan matan, melainkan dihidupkan melalui forum mudzakarah, sorogan, dan bahtsul masail santri, sehingga lahir pribadi-pribadi yang kokoh agamanya dan luhur pekertinya.`,
      quota: "Seluruh Santri Mukim & Kalong",
      studyTime: "Sore (14.00 - 17.00 WIB)",
      facilities: ["Ruang Klasikal Berjenjang", "Koleksi Kitab Kuning Maktabah", "Papan Tulis Hijaiyah Gantung", "Ruang Ujian Marhalah", "Majelis Mudzakarah Asatidz"],
      extracurriculars: ["Musabaqoh Qiro'atil Kutub (MQK)", "Lomba Lalaran Alfiyah & Imrithi", "Latihan Bahtsul Masail Santri", "Peringatan Maulid Nabi Saw."],
      gallery: [
        { src: "assets/program_4_kitab.jpg", caption: "Kajian Matan Jurumiyah, Imrithi & Alfiyah" },
        { src: "assets/program_1_tahfidz.jpg", caption: "Kajian Fathul Qorib & Fiqih Madzhab Syafi'i" },
        { src: "assets/hero_santri.jpg", caption: "Mudzakarah & Debat Ilmiah Santri Diniyah" },
        { src: "assets/pesantren_gedung.jpg", caption: "Majelis Ta'lim & Kajian Rutin Diniyah" }
      ]
    },
    {
      id: "lpba",
      name: "LPBA (Lembaga Pengembangan Bahasa Asing)",
      category: "Unit Penunjang (Kampung Bahasa Santri)",
      shortDesc: "Pusat akselerasi percakapan aktif bahasa Arab dan bahasa Inggris santri berbasis lingkungan bilingual.",
      fullDesc: "LPBA Raudlatul Muta'allimin memfasilitasi santri dan siswa dalam menguasai keterampilan berbahasa aktif (Muhadatsah & Daily English Speaking). Menerapkan bi'ah lughawiyyah (lingkungan berbahasa), TOEFL/TOAFL preparation, public speaking, dan pidato 3 bahasa.",
      image: "assets/program_3_bahasa.jpg",
      programs: ["Bi'ah Lughawiyyah (Zona Wajib Berbahasa)", "Muhadatsah & Daily Conversation", "Pelatihan TOAFL & TOEFL Santri", "Public Speaking & Khitobah 3 Bahasa"],
      accreditation: "Pusat Sertifikasi Bahasa Pesantren",
      headmaster: "Ust. M. Rifqi Firdaus, M.A.",
      quota: "Terbuka untuk Seluruh Santri",
      studyTime: "Pagi (05.30 - 06.30) & Malam (20.00 - 21.00)",
      facilities: ["Zona Wajib Berbahasa (Bi'ah)", "Laboratorium Bahasa Digital Audio", "Pojok Baca Buku Asing", "Panggung Khitobah 3 Bahasa", "Audio Listening Corner"],
      extracurriculars: ["Daily English & Arabic Speaking Club", "Drama Bahasa & Pidato 3 Bahasa", "Bedah Film Edukasi Berbahasa Asing", "Pelatihan TOAFL & TOEFL Santri"],
      gallery: [
        { src: "assets/hero_belajar_santri.jpg", caption: "Bi'ah Lughawiyyah & English-Arabic Daily Atmosphere" },
        { src: "assets/belajar_santri_sma.jpg", caption: "Laboratorium Bahasa & Simulasi TOAFL/TOEFL" },
        { src: "assets/belajar_santri_smp.jpg", caption: "Panggung Pidato 3 Bahasa Santri (Khitobah)" },
        { src: "assets/berita_santri_prestasi.jpg", caption: "Duta Bahasa Pesantren & Prestasi Pidato" }
      ]
    },
    {
      id: "lbb",
      name: "LBB Raudlatul Muta'allimin",
      fullName: "Lembaga Bimbingan Belajar (LBB) Raudlatul Muta'allimin",
      category: "Bimbingan Belajar Terbuka (Siswa Luar & Santri Internal)",
      shortDesc: "Lembaga bimbingan belajar terakreditasi yang terbuka untuk santri internal maupun siswa/santri dari sekolah luar (SMA/SMK/MA) persiapan tembus PTN, Kedinasan, dan Beasiswa.",
      fullDesc: "LBB Raudlatul Muta'allimin merupakan unit bimbingan belajar profesional yang melayani pembinaan intensif bagi santri internal pesantren maupun siswa dari sekolah luar (SMA, MA, SMK). Menghadirkan tentor berpengalaman, bank soal ter-update, simulasi CBT berkala, pendampingan seleksi SNBT/UTBK, Sekolah Kedinasan, SPAN-PTKIN, serta beasiswa Al-Azhar Kairo dengan rekam jejak kelulusan tinggi.",
      image: "assets/lbb_bimbel_intensif.jpg",
      programs: [
        "Drilling Soal SNBT & UTBK Berbasis CBT Berkala",
        "Bimbingan Khusus Masuk Sekolah Kedinasan (STAN, IPDN, STIS, dll.)",
        "Persiapan SPAN-PTKIN & Ujian Mandiri Perguruan Tinggi Negeri",
        "Asistensi Seleksi Beasiswa Al-Azhar Kairo & Timur Tengah",
        "Kelas Reguler & Karantina Terbuka untuk Siswa dari Sekolah Luar",
        "Konseling Minat Bakat, Analisis Rasionalisasi Skor & Jurusan Kuliah"
      ],
      accreditation: "Mitra Konsorsium Pendidikan Tinggi",
      isStandalone: true,
      openForExternal: true,
      coordinator: "Novin Mayang Arum, S.Pd",
      headmaster: "Novin Mayang Arum, S.Pd",
      headmasterPhoto: "assets/tutor_novin.jpg",
      role: "Ketua LBB Raudlatul Muta'allimin",
      headmasterSpeechTitle: "Menemani Proses, Menguatkan Potensi, Mengantarkan Prestasi",
      headmasterSpeech: `Assalamu’alaikum warahmatullahi wabarakatuh.

Setiap anak memiliki potensi untuk tumbuh dan berprestasi. Namun, potensi membutuhkan arah, proses membutuhkan pendampingan, dan sebuah cita-cita membutuhkan perjuangan yang konsisten.

Atas dasar itulah Lembaga Bimbingan Belajar hadir.

Kami tidak sekadar menghadirkan tambahan pembelajaran, tetapi berupaya membangun sebuah ruang belajar yang mendorong peserta didik untuk mengenali potensi dirinya, berani menghadapi tantangan, dan memiliki kesiapan untuk melangkah menuju masa depan.

Melalui berbagai program, mulai dari persiapan masuk Perguruan Tinggi Negeri (PTN), persiapan TKA jenjang SLTP dan SLTA, hingga bimbingan Olimpiade dan pengembangan prestasi, kami berkomitmen memberikan pendampingan yang terarah, profesional, dan relevan dengan kebutuhan peserta didik.

Kami meyakini bahwa keberhasilan bukan hanya tentang mendapatkan hasil terbaik, tetapi juga tentang bagaimana seseorang belajar, berproses, membangun karakter, dan tidak berhenti berusaha ketika menghadapi kesulitan.

Karena itu, mari kita jadikan setiap proses belajar sebagai langkah menuju masa depan. Bersama guru, tentor, orang tua, dan seluruh pihak yang mendukung pendidikan, kita hadir untuk mendampingi generasi muda agar tumbuh menjadi pribadi yang berilmu, berprestasi, percaya diri, dan berakhlak mulia.

Kami hadir untuk mendampingi prosesnya, menguatkan potensinya, dan bersama-sama mengantarkan mereka menuju cita-cita.

Terima kasih atas kepercayaan yang diberikan kepada Lembaga Bimbingan Belajar.

Wassalamu’alaikum warahmatullahi wabarakatuh.`,
      whatsapp: "+62 813-5789-2244",
      whatsappClean: "6281357892244",
      phone: "0856-4884-7070",
      office: "Gedung Pusat Pembelajaran Digital & LBB Raudlatul Muta'allimin (Kompleks Pusat YTPAI)",
      serviceHours: "Sabtu – Kamis: 07.00 – 14.00 WIB (Hari Jum'at Libur) • Sesi Belajar: 13.40 – Ashar",
      quota: "Terbuka Siswa Luar & Santri Internal",
      studyTime: "Setelah Pulang Sekolah (Pulang 13.20, Mulai 13.40 – Ashar)",
      facilities: ["Ruang Kelas AC & Smart TV", "Laboratorium CBT Simulasi Tryout", "Modul Bank Soal Superlengkap", "Ruang Konseling Jurusan & Karir", "Akses Wifi Cepat Ujian Online"],
      extracurriculars: ["Simulasi UTBK Skala Nasional", "Bedah Trik Cepat Rumus 'The King'", "Webinar Strategi Lolos PTN/Kedinasan", "Sharing Session Bersama Alumni Lolos"],
      gallery: [
        { src: "assets/lbb_bimbel_intensif.jpg", caption: "Simulasi Ujian SNBT & Kedinasan Berbasis CBT" },
        { src: "assets/belajar_santri_sma.jpg", caption: "Kelas Bimbingan Belajar Siswa Luar & Santri" },
        { src: "assets/hero_belajar_santri.jpg", caption: "Siswa Bimbingan Belajar Lolos PTN Impian" },
        { src: "assets/pesantren_gedung.jpg", caption: "Gedung Pusat Belajar & Laboratorium Digital LBB" }
      ]
    },
    {
      id: "kbihu",
      name: "KBIHU Raudlatul Muta'allimin",
      fullName: "Kelompok Bimbingan Ibadah Haji & Umrah (KBIHU) Raudlatul Muta'allimin Lamongan",
      category: "Layanan Bimbingan Calon Jamaah Haji & Umrah",
      shortDesc: "Layanan bimbingan ibadah di bawah naungan YTPAI khusus membina, mendampingi, dan melatih calon jamaah haji dan umrah secara profesional, mabrur, dan sesuai sunnah.",
      fullDesc: "KBIHU Raudlatul Muta'allimin merupakan pusat bimbingan ibadah yang didirikan khusus untuk membina dan melayani calon jamaah haji serta umrah. Dengan izin operasional resmi Kementerian Agama RI dan bimbingan langsung para Masyayikh berpengalaman, KBIHU menyediakan manasik teori intensif, simulasi miniatur Ka'bah di pesantren, pembinaan fiqih ibadah, hingga pengawalan ibadah penuh di Makkah dan Madinah.",
      image: "assets/pesantren_gedung.jpg",
      programs: [
        "Bimbingan Manasik Intensif (Teori & Praktik Miniatur Ka'bah)",
        "Pendampingan Ibadah Langsung oleh Para Masyayikh & Pembimbing Bersertifikat",
        "Klinik Fiqih Haji-Umrah & Bimbingan Khusus Fiqih Wanita (Nisaiyyah)",
        "Pemeriksaan Kesehatan Berkala & Senam Kebugaran Jamaah Lansia",
        "Pengawalan Petugas Khusus Sejak Asrama Haji Sukolilo hingga Makkah-Madinah",
        "Keluarga Besar & Ikatan Silaturahmi Alumni Jamaah Haji/Umrah"
      ],
      accreditation: "Izin Operasional Resmi Kemenag RI",
      isStandalone: true,
      coordinator: "Ust. Yusuf Afif Rifa'i",
      headmaster: "Ust. Yusuf Afif Rifa'i",
      role: "Koordinator Pelayanan & Pendaftaran Calon Jamaah",
      whatsapp: "+62 856-0630-7911",
      whatsappClean: "6285606307911",
      phone: "0856-4884-7070",
      office: "Gedung Pusat Manasik & Sekretariat KBIHU (Sayap Timur Mushola Pondok Pesantren Putra YTPAI)",
      serviceHours: "Sabtu – Kamis: 07.00 – 14.00 WIB (Jum'at Libur) • Konsultasi Manasik: Ahad Pagi",
      quota: "Terbuka Calon Jamaah Haji & Umrah",
      studyTime: "Ahad Pagi & Jadwal Manasik Terstruktur",
      facilities: ["Miniatur Ka'bah Ukuran Proporsional", "Lintasan Sa'i Shofa-Marwah", "Replika Tenda Mina & Arafah", "Gedung Audiovisual Manasik", "Ruang Bimbingan Fiqih Haji-Umrah"],
      extracurriculars: ["Praktik Thawaf & Sa'i Berkelompok", "Bimbingan Doa Mustajab Tanah Suci", "Klinik Fiqih Jamaah Lanjut Usia", "Pemberangkatan & Penjemputan Jamaah"],
      gallery: [
        { src: "assets/pesantren_gedung.jpg", caption: "Miniatur Ka'bah & Area Manasik Haji Komprehensif" },
        { src: "assets/program_4_kitab.jpg", caption: "Bimbingan Fiqih Ibadah Haji & Manasik Teori" },
        { src: "assets/program_5_pengabdian.jpg", caption: "Pemberangkatan & Pengawalan Jamaah Haji/Umrah" },
        { src: "assets/hero_santri.jpg", caption: "Silaturahmi Jamaah Haji & Alumni Bimbingan Mabrur" }
      ]
    },
    {
      id: "poskestren",
      name: "Poskestren Raudlatul Muta'allimin",
      fullName: "Pos Kesehatan Pesantren (Poskestren) Raudlatul Muta'allimin Lamongan",
      category: "Layanan Kesehatan & Klinik Santri",
      shortDesc: "Pusat penanganan medis pertama dan rawat kesehatan bagi santri mukim maupun siswa yang sakit, dilengkapi ruang istirahat observasi dan koordinasi rujukan faskes.",
      fullDesc: "Pos Kesehatan Pesantren (Poskestren) Raudlatul Muta'allimin merupakan unit layanan kesehatan terpadu yayasan yang siaga melayani santri mukim, siswa sekolah, asatidz, dan warga pesantren. Apabila ada anak atau santri yang sakit, Poskestren menjadi tempat pertama penanganan medis, pemeriksaan fisik dasar, pemberian obat berizin, serta observasi di ranjang rawat istirahat terpisah (putra dan putri). Bekerja sama dengan Puskesmas dan fasilitas kesehatan daerah untuk pemantauan berkala dan rujukan darurat 24 jam.",
      image: "assets/fasilitas_poskestren.jpg",
      programs: [
        "Penanganan Pertama & Rawat Santri Sakit (P3K & Observasi Medis)",
        "Ruang Rawat Istirahat Khusus Terpisah Santri Putra & Santri Putri",
        "Pemeriksaan Kesehatan Berkala & Skrining PHBS (Perilaku Hidup Bersih & Sehat)",
        "Pemberian Obat-Obatan Esensial & Vitamin Terstandar Dinas Kesehatan",
        "Konseling Kesehatan Santri & Edukasi Higiene Kebersihan Asrama",
        "Layanan Rujukan Cepat Faskes & Komunikasi Terpadu dengan Wali Santri"
      ],
      accreditation: "Binaan Dinas Kesehatan & Puskesmas Setempat",
      isStandalone: true,
      coordinator: "Tim Medis & Pengelola Poskestren",
      headmaster: "Ustdzh. Siti Aminah, A.Md.Keb",
      role: "Penanggung Jawab Medis Poskestren",
      whatsapp: "+62 856-4884-7070",
      whatsappClean: "6285648847070",
      phone: "0856-4884-7070",
      office: "Gedung Layanan Santri & Poskestren Kompleks Pusat YTPAI (Dekat Asrama)",
      serviceHours: "Siaga 24 Jam Santri Sakit • Pelayanan Harian: 07.00 – 21.00 WIB",
      quota: "Seluruh Santri, Siswa & Warga Pesantren",
      studyTime: "Layanan Siaga Penanganan Santri Sakit 24 Jam",
      facilities: ["Ranjang Rawat Observasi Putra & Putri", "Peralatan Medis Dasar (Tensi, Termometer, Nebulizer)", "Apotek Mini & Kotak P3K Lengkap", "Ruang Konsultasi Tenaga Kesehatan", "Ambulance Siaga Rujukan Darurat"],
      extracurriculars: ["PMR (Palang Merah Remaja) Santri", "Pelatihan Kader Kesehatan Santri Husada", "Senam Kebugaran & Olahraga Sehat", "Penyuluhan Gizi & Kebersihan Lingkungan"],
      leadershipTitle: "Penanggung Jawab Medis",
      gallery: [
        { src: "assets/fasilitas_poskestren.jpg", caption: "Ruang Konsultasi & Observasi Pasien Poskestren" },
        { src: "assets/pesantren_gedung.jpg", caption: "Gedung Kompleks Layanan Kesehatan & Asrama Pesantren" },
        { src: "assets/hero_santri.jpg", caption: "Santri Sehat, Bugar, dan Nyaman Beraktivitas Belajar" }
      ]
    }
  ],

  // Data Gerbang Cepat Hero (Hero Gateway Dock)
  heroGateway: {
    kbihu: {
      name: "KBIHU Haji & Umrah",
      tag: "Izin Kemenag",
      desc: "Bimbingan Manasik Teori & Praktik Miniatur Ka'bah",
      url: "kbihu.html"
    },
    lbb: {
      name: "LBB Sukses PTN",
      tag: "Terbuka Siswa Luar",
      desc: "Bimbel UTBK, SNBT & Simulasi CBT Laboratorium",
      url: "lbb.html"
    }
  },

  // Data Khusus KBIHU (Calon Jamaah Haji & Umrah)
  kbihuInfo: {
    name: "KBIHU Raudlatul Muta'allimin",
    officialName: "Kelompok Bimbingan Ibadah Haji & Umrah (KBIHU) Raudlatul Muta'allimin Lamongan",
    skKemenag: "Izin Resmi Kemenag RI No. Kd.13.06/4/HJ.00/1984/2019",
    tagline: "Membina Calon Jamaah Menuju Ibadah Haji & Umrah Mabrur Sesuai Sunnah",
    shortDesc: "Layanan bimbingan ibadah di bawah naungan YTPAI khusus membina, mendampingi, dan melatih calon jamaah haji dan umrah secara profesional dan amanah.",
    fullDesc: "KBIHU Raudlatul Muta'allimin berfokus penuh melayani dan membina calon jamaah haji serta umrah masyarakat luas. Dengan pendampingan langsung oleh para Masyayikh dan pembimbing bersertifikat nasional Kemenag RI, calon jamaah dibekali manasik teori komprehensif, latihan fisik/kebugaran, simulasi manasik di miniatur Ka'bah pesantren, hingga pengawalan ibadah penuh di tanah suci Makkah dan Madinah.",
    image: "assets/pesantren_gedung.jpg",
    coordinator: "Ust. Yusuf Afif Rifa'i",
    role: "Koordinator Pelayanan & Pendaftaran Calon Jamaah KBIHU",
    whatsapp: "+62 856-0630-7911",
    whatsappClean: "6285606307911",
    phone: "0856-4884-7070",
    email: "kbihu@ytpai-lamongan.sch.id",
    office: "Gedung Pusat Manasik & Sekretariat KBIHU (Sayap Timur Mushola Pondok Pesantren Putra YTPAI)",
    address: "Jalan Raya Babat - Surabaya, Dsn. Tegalrejo, Ds. Datinawong, Kec. Babat, Kab. Lamongan, Prov. Jawa Timur",
    serviceHours: "Sabtu – Kamis: 07.00 – 14.00 WIB (Hari Jum'at Libur)",
    hero: {
      badge: "LAYANAN KHIDMAH KEUMATAN • IZIN RESMI KEMENAG RI",
      title: "Membina Calon Tamu Allah Menuju <span class=\"highlight-gold\">Haji & Umrah Mabrur</span> Sesuai Sunnah",
      desc: "Pusat bimbingan ibadah haji dan umrah terakreditasi resmi Kemenag RI di bawah asuhan Masyayikh pesantren. Dilengkapi sarana miniatur Ka'bah mandiri, pendalaman fiqih Syafi'iyah, kelas khusus wanita bersama Ibu Nyai, hingga pendampingan total di Tanah Suci.",
      statusBadge: "STATUS PEMBINAAN CALON JAMAAH",
      seasonText: "Musim 1447 H / 2026 M",
      cardTitle: "Pendaftaran Bimbingan Manasik Dibuka",
      cardDesc: "Calon jamaah haji estimasi keberangkatan & calon jamaah umrah keluarga dapat mendaftar pembinaan berkala di Sekretariat KBIHU.",
      features: [
        { label: "Legalitas SK", value: "Kemenag RI" },
        { label: "Simulasi Lapangan", value: "Miniatur Ka'bah" },
        { label: "Bimbingan Fiqih", value: "Madzhab Syafi'i" },
        { label: "Pengawalan Ibadah", value: "Hingga Makkah" }
      ],
      checkPorsiText: "Cek Nomor Porsi & Jadwal Manasik ↗",
      checkPorsiUrl: "https://wa.me/6285606307911?text=Assalamu'alaikum.%20Saya%20ingin%20mengecek%20nomor%20porsi%20haji%20dan%20jadwal%20manasik%20KBIHU%20Raudlatul%20Muta'allimin.",
      pillars: [
        { title: "Legalitas Resmi", subtitle: "Izin Kemenag RI" },
        { title: "Sarana Praktik", subtitle: "Miniatur Ka'bah Pesantren" },
        { title: "Dewan Asatidz", subtitle: "Masyayikh Berlisensi" },
        { title: "Layanan Khidmah", subtitle: "Fiqih & Medis Jamaah" }
      ]
    },
    highlights: [
      { title: "Miniatur Ka'bah & Lintasan Sa'i", desc: "Fasilitas simulasi manasik proporsional untuk kemantapan rukun dan wajib haji" },
      { title: "Bimbingan Langsung KH. Miftahul Falah", desc: "Kajian fiqih haji bersanad madzhab Syafi'i, bimbingan manasik intensif, dan pengawalan ibadah mabrur" },
      { title: "Layanan Konsultasi & Pendaftaran", desc: "Narahubung: Ust. Yusuf Afif Rifa'i — Kontak WA: +62 856-0630-7911" }
    ],
    programs: [
      "Bimbingan Manasik Intensif (Teori & Praktik Miniatur Ka'bah)",
      "Pendampingan Ibadah Langsung oleh Para Masyayikh & Pembimbing Bersertifikat",
      "Klinik Fiqih Haji-Umrah & Bimbingan Khusus Fiqih Wanita (Nisaiyyah)",
      "Pemeriksaan Kesehatan Berkala & Senam Kebugaran Jamaah Lansia",
      "Pengawalan Petugas Khusus Sejak Asrama Haji Sukolilo hingga Makkah-Madinah",
      "Keluarga Besar & Ikatan Silaturahmi Alumni Jamaah Haji/Umrah"
    ],
    gallery: [
      { src: "assets/pesantren_gedung.jpg", caption: "Miniatur Ka'bah & Area Manasik Haji Komprehensif" },
      { src: "assets/program_4_kitab.jpg", caption: "Bimbingan Fiqih Ibadah Haji & Manasik Teori" },
      { src: "assets/program_5_pengabdian.jpg", caption: "Pemberangkatan & Pengawalan Jamaah Haji/Umrah" },
      { src: "assets/hero_santri.jpg", caption: "Silaturahmi Jamaah Haji & Alumni Bimbingan Mabrur" }
    ]
  },

  // Dewan Pembina & Pembimbing Ibadah KBIHU (Saat ini dibimbing langsung oleh KH. Miftahul Falah)
  kbihuPembimbing: [
    {
      id: "pembimbing-1",
      name: "KH. Miftahul Falah, S.Pd",
      role: "Pembimbing Utama Ibadah Haji & Umrah",
      desc: "Ketua Dewan Pengasuh Pondok Pesantren Raudlatul Muta'allimin Tegalrejo • Lisensi Pembimbing Resmi Kemenag RI",
      tag: "Kajian Fiqih Manasik Syafi'iyah",
      photo: "assets/pengasuh_miftahul_falah.jpg?v=seimbang"
    }
  ],

  // Data Khusus LBB (Lembaga Bimbingan Belajar - Terbuka Santri & Siswa Sekolah Luar)
  lbbInfo: {
    name: "LBB Raudlatul Muta'allimin",
    officialName: "Lembaga Bimbingan Belajar (LBB) Raudlatul Muta'allimin",
    tagline: "Gerbang Sukses Tembus PTN Favorit, Kedinasan & Beasiswa Internasional",
    targetAudience: "Terbuka Siswa Luar & Santri",
    shortDesc: "Pusat bimbingan belajar intensif dan terakreditasi yang terbuka bagi santri internal maupun siswa dari sekolah luar untuk persiapan tembus UTBK-SNBT, Sekolah Kedinasan, SPAN-PTKIN, dan Beasiswa Al-Azhar Kairo.",
    fullDesc: "LBB Raudlatul Muta'allimin hadir sebagai kawah candradimuka akademik unggulan. Dirancang presisi tepat setelah jam pulang sekolah (pulang 13.20, mulai 13.40 – Ashar), program ini menyambut hangat siswa/santri dari berbagai sekolah negeri dan swasta di luar pesantren maupun santri mukim. Dilengkapi modul drilling soal eksklusif, simulasi CBT berkala, analisis rasionalisasi jurusan, dan bimbingan langsung tentor master lulusan perguruan tinggi terkemuka.",
    image: "assets/lbb_bimbel_intensif.jpg",
    coordinator: "Ust. M. Wildan Pratama, M.Pd.",
    role: "Koordinator Pelayanan & Pendaftaran Siswa LBB",
    whatsapp: "+62 813-5789-2244",
    whatsappClean: "6281357892244",
    phone: "0856-4884-7070",
    email: "lbb@ytpai-lamongan.sch.id",
    office: "Gedung Pusat Pembelajaran Digital & LBB Raudlatul Muta'allimin (Kompleks Pusat YTPAI)",
    address: "Jalan Raya Babat - Surabaya, Dsn. Tegalrejo, Ds. Datinawong, Kec. Babat, Kab. Lamongan, Prov. Jawa Timur",
    serviceHours: "Sabtu – Kamis: 07.00 – 14.00 WIB (Hari Jum'at Libur) • Sesi Belajar LBB: 13.40 – Ashar",
    highlights: [
      { title: "Laboratorium CBT & Tryout Terjadwal", desc: "Simulasi ujian komputer berstandar nasional dengan analisis skor dan ranking instan" },
      { title: "Sesi Belajar Setelah Jam Pulang Sekolah", desc: "Jadwal presisi (13.40 – Ashar) tidak menyita waktu malam dan dibimbing tentor master alumni PTN terbaik" },
      { title: "Layanan Informasi & Pendaftaran Siswa", desc: "Narahubung: Ust. M. Wildan Pratama, M.Pd. — Kontak WA: +62 813-5789-2244" }
    ],
    programs: [
      "Drilling Soal SNBT & UTBK Berbasis CBT Berkala",
      "Bimbingan Khusus Masuk Sekolah Kedinasan (STAN, IPDN, STIS, dll.)",
      "Persiapan SPAN-PTKIN & Ujian Mandiri Perguruan Tinggi Negeri",
      "Asistensi Seleksi Beasiswa Al-Azhar Kairo & Timur Tengah",
      "Sesi Belajar Tepat Setelah Pulang Sekolah (13.40 – Ashar) untuk Siswa Luar & Santri",
      "Konseling Minat Bakat, Analisis Rasionalisasi Skor & Jurusan Kuliah"
    ],
    gallery: [
      { src: "assets/lbb_bimbel_intensif.jpg", caption: "Suasana Bimbingan Intensif & Bedah Soal UTBK-SNBT" },
      { src: "assets/belajar_santri_sma.jpg", caption: "Laboratorium Komputer CBT Berstandar Nasional" },
      { src: "assets/hero_belajar_santri.jpg", caption: "Konseling Minat Bakat & Pemetaan Jurusan PTN" },
      { src: "assets/pesantren_gedung.jpg", caption: "Gedung Pusat Belajar & Laboratorium Digital LBB" }
    ]
  },

  // Majelis Muassis & Masyayikh Pendiri Pondok Pesantren (1984)
  muassis: [
    {
      id: "muassis-1",
      name: "KH. Sholeh Al-Ayyubi",
      honorific: "Muassis Pesantren",
      role: "Perintis & Sesepuh Pendiri (1984)",
      photo: "assets/muassis_sholeh_ayyubi.png",
      period: "Perintis 1984",
      desc: "Salah satu ulama sesepuh perintis peletakan batu pertama berdirinya pondok pesantren di Dusun Tegalrejo, Babat, Lamongan."
    },
    {
      id: "muassis-2",
      name: "KH. Sufyan",
      honorific: "Muassis Pesantren",
      role: "Perintis & Sesepuh Pendiri (1984)",
      photo: "assets/muassis_sufyan.png",
      period: "Perintis 1984",
      desc: "Tokoh ulama sesepuh pendiri yang memperkokoh pondasi keilmuan syariat, tradisi kitab turats, dan kelembagaan awal pesantren."
    },
    {
      id: "muassis-3",
      name: "KH. Moh Farhan Saa.",
      honorific: "Muassis Pesantren",
      role: "Perintis & Sesepuh Pendiri (1984)",
      photo: "assets/muassis_farhan_saa.png",
      period: "Perintis 1984",
      desc: "Tokoh perintis yang mendedikasikan perjuangan dalam pembentukan madrasah, dakwah keumatan, dan kaderisasi santri."
    },
    {
      id: "muassis-4",
      name: "KH. Mas'ud Lathief",
      honorific: "Al-Maghfurlah",
      role: "Muassis & Masyayikh Sepuh Pesantren",
      photo: "assets/muassis_masud_lathief.png",
      period: "Masyayikh Sepuh",
      desc: "Ulama kharismatik yang menorehkan keteladanan spiritual luhur, sanad keilmuan, dan untaian doa bagi kemaslahatan santri."
    }
  ],

  // 4 Pimpinan (Ketua Yayasan & 3 Tokoh Dewan Pengasuh)
  leadership: [
    {
      id: "ketua-yayasan",
      name: "Abdus Shomad, M.Pd",
      role: "Ketua Yayasan YTPAI",
      specialty: "Kebijakan & Transformasi Pendidikan",
      photo: "assets/leader_ketua.jpg?v=flag",
      photoScale: 1.0,
      photoOffsetY: 0,
      rating: "Ketua Yayasan",
      speechTitle: "Membina Generasi Emas Berjiwa Santri dan Berdaya Saing Global",
      speechContent: `Bismillahirrohmaanirrohiim. Alhamdulillahi Rabbil 'Alamin.

Selamat datang di Portal Resmi Yayasan Taman Pendidikan Agama Islam (YTPAI) Raudlatul Muta'allimin Lamongan. Yayasan kami didirikan atas tekad luhur para ulama dan sesepuh untuk menghadirkan oase pendidikan yang tidak sekadar mentransfer pengetahuan kognitif, melainkan menumbuhkan akhlaqul karimah serta memperkuat ketahanan tauhid para santri di era disrupsi informasi.

Melalui integrasi 7 satuan pendidikan formal dan 4 unit penunjang, kami berkomitmen mencetak kader pemimpin umat yang unggul dalam prestasi akademik dan kokoh dalam budaya kepesantrenan. Semoga portal digital ini menjadi jendela transparansi dan silaturahmi yang membawa barakah bagi kita semua.`,
      digitalSign: "Abdus Shomad, M.Pd"
    },
    {
      id: "pengasuh-ketua",
      name: "KH. Miftahul Falah, S.Pd",
      role: "Ketua Dewan Pengasuh",
      specialty: "Pengasuhan & Tradisi Salaf Aswaja",
      photo: "assets/pengasuh_miftahul_falah.jpg?v=seimbang",
      photoScale: 1.0,
      photoOffsetY: 0,
      rating: "Ketua Dewan Pengasuh",
      speechTitle: "Menjaga Kemurnian Sanad Keilmuan dan Akhlak Salafus Sholih",
      speechContent: `Assalamu'alaikum Warahmatullahi Wabarakatuh.

Pondasi utama pendidikan pondok pesantren adalah keberkahan sanad keilmuan dan ketulusan niat (ikhlas). Di Pondok Pesantren Raudlatul Muta'allimin Tegalrejo, bimbingan para santri berpusat pada pengkajian kitab-kitab turats salaf yang diimbangi pembiasaan ibadah istiqomah serta adab tholabul ilmi.

Kami berpesan kepada seluruh santri untuk senantiasa taat kepada asatidz, menjaga sholat berjamaah, dan menghidupkan nilai-nilai Ahlussunnah Wal Jama'ah an-Nahdliyyah demi keberkahan hidup di dunia dan akhirat.`,
      digitalSign: "KH. Miftahul Falah, S.Pd"
    },
    {
      id: "pengasuh-sekretaris",
      name: "Dr. KH. Ghozi, Lc., M.Fil.I",
      role: "Sekretaris Dewan Pengasuh",
      specialty: "Studi Syariah & Bahasa Arab",
      photo: "assets/pengasuh_ghozi.jpg?v=flag",
      photoScale: 1.0,
      photoOffsetY: 0,
      rating: "Sekretaris Dewan Pengasuh",
      speechTitle: "Adab dan Keilmuan: Mahkota Hakiki Generasi Qur'ani",
      speechContent: `Assalamu'alaikum Warahmatullahi Wabarakatuh.

Ilmu syariat dan ketajaman intelektual adalah amanah agung yang harus senantiasa dihiasi akhlaqul karimah. Di era modern ini, penguasaan literatur klasik turats serta bahasa Arab dan sains merupakan instrumen penting bagi santri untuk menjawab tantangan zaman tanpa kehilangan jati diri kepesantrenan.

Semoga para santri senantiasa bersemangat menuntut ilmu, tekun bermutala'ah, dan siap berkhidmah untuk agama, masyarakat, dan bangsa.`,
      digitalSign: "Dr. KH. Ghozi, Lc., M.Fil.I"
    },
    {
      id: "pengasuh-bendahara",
      name: "KH. M. Nuschul Ibad, M.S",
      role: "Bendahara Dewan Pengasuh",
      specialty: "Kemandirian Santri & Tata Kelola Pesantren",
      photo: "assets/pengasuh_nuschul_ibad.jpg?v=flag",
      photoScale: 1.0,
      photoOffsetY: 0,
      rating: "Bendahara Dewan Pengasuh",
      speechTitle: "Santri Mandiri, Berdaya, dan Berjiwa Khidmah",
      speechContent: `Assalamu'alaikum Warahmatullahi Wabarakatuh.

Pesantren bukan sekadar tempat menuntut ilmu fiqih dan tauhid, melainkan wadah penggemblengan karakter kemandirian, kedisiplinan, dan tanggung jawab sosial. Pengelolaan sarana ibadah dan asrama yang tertib menghadirkan ekosistem belajar yang nyaman dan kondusif bagi para santri.

Mari kita rawat bersama tradisi gotong royong dan khidmah tulus ini agar pesantren senantiasa menjadi benteng moral dan pilar kemajuan umat.`,
      digitalSign: "KH. M. Nuschul Ibad, M.S"
    }
  ],

  // 6 Program Unggulan, Khidmah & Kepemimpinan Santri
  programs: [
    {
      id: "prog-tahfidz",
      title: "Program Unggulan Tahfidz MI RM",
      badge: "Juz 3 / 30 Juz",
      tag: "Beasiswa Tahfidz 30 Juz",
      category: "Tahfidz & Beasiswa",
      target: "MI, MTs, SMP, MA, dan SMA",
      image: "assets/program_1_tahfidz.jpg",
      desc: "Program unggulan tahfidz sekolah/madrasah adalah program unggulan menghafal Al Qur'an 30 Juz berbeasiswa yang ditawarkan kepada siswa-siswi unit pendidikan formal dari unit MI, MTs, SMP, MA, dan SMA.",
      features: [
        "Beasiswa penuh santri tahfidz berprestasi",
        "Setoran hafalan bersanad dan teruji",
        "Terbuka untuk jenjang MI, MTs, SMP, MA, dan SMA"
      ]
    },
    {
      id: "prog-pkms",
      title: "Program Khidmah Madrasah/Sekolah (PKMS)",
      badge: "Metode Annahdliyah",
      tag: "Guru TPQ Annahdliyah",
      category: "Khidmah & Keguruan",
      target: "Siswa Kelas Akhir SLTA (MA & SMA)",
      image: "assets/program_2_pkms.jpg",
      desc: "PKMS adalah program mengajar Al-Qur'an untuk siswa-siswi kelas akhir SLTA Raudlatul Muta'allimin yang telah lulus dalam program Pelatihan Guru TPQ Metode Annahdliyah. Program ini dilaksanakan pada awal tahun ajaran hingga selesainya tahun ajaran.",
      features: [
        "Sertifikasi Pelatihan Guru TPQ Annahdliyah",
        "Praktik mengajar Al-Qur'an nyata sepanjang tahun",
        "Pembentukan karakter pendidik berakhlak mulia"
      ]
    },
    {
      id: "prog-bahasa",
      title: "Program Bahasa Asing",
      badge: "Bilingual Aktif",
      tag: "Arab & Inggris Intensif",
      category: "Bahasa Internasional",
      target: "Sekolah, Madrasah & Madrasah Diniyah",
      image: "assets/program_3_bahasa.jpg",
      desc: "Program Pengembangan Bahasa Asing adalah program pendalaman bahasa Arab dan inggris secara aktif baik lisan maupun tulisan sebagai program tambahan materi-materi Bahasa Arab dan inggris di sekolah/madrasah dan Madrasah Diniyah.",
      features: [
        "Pendalaman aktif lisan maupun tulisan",
        "Integrasi materi kurikulum madrasah & diniyah",
        "Lingkungan asrama pembiasaan bahasa harian"
      ]
    },
    {
      id: "prog-kitab",
      title: "Program Khusus Pendalaman Kitab",
      badge: "Kajian Turats Salaf",
      tag: "Berbeasiswa Prestasi",
      category: "Keilmuan Turats",
      target: "Santri Berprestasi Madrasah Diniyah",
      image: "assets/program_4_kitab.jpg",
      desc: "Adalah program unggulan berbeasiswa yang ditawarkan kepada santri berprestasi Madrasah Diniyah di Raudlatul Muta'allimin.",
      features: [
        "Beasiswa prestasi khusus santri berdedikasi",
        "Kajian kitab kuning (Fathul Qorib, Jurumiyah, Imrithi)",
        "Bimbingan talaqqi langsung asatidz senior"
      ]
    },
    {
      id: "prog-masyarakat",
      title: "Program Khidmah Masyarakat",
      badge: "Pengabdian Ramadhan",
      tag: "Dakwah & Syiar Sosial",
      category: "Pengabdian Umat",
      target: "Siswa Kelas Akhir Utusan MA & SMA",
      image: "assets/program_5_pengabdian.jpg",
      desc: "Adalah Program Khidmah Mengajar Al Qur'an dan pelajaran yang dilaksanakan oleh siswa-siswi kelas akhir utusan dari MA dan SMA Raudlatul Muta'allimin pada masyarakat dan sekolah/madrasah mitra YTPAI Raudlatul Muta'allimin. Kegiatan ini dilaksanakan pada bulan Ramadhan sebelum kepulangan santri libur Idul Fitri.",
      features: [
        "Mengajar Al-Qur'an dan pelajaran di masyarakat mitra",
        "Pelaksanaan intensif di bulan suci Ramadhan",
        "Menumbuhkan kepedulian sosial santri di tengah umat"
      ]
    },
    {
      id: "prog-pengurus-putra",
      title: "Pengurus Pondok Putra",
      badge: "Leadership & Manajerial",
      tag: "Kepemimpinan Santriawan",
      category: "Kepemimpinan Santri",
      target: "Siswa SLTA Kelas Akhir Mukim",
      image: "assets/hero_santri.jpg",
      desc: "Kegiatan untuk melatih kepemimpinan, kedisiplinan, dan manajerial santri dalam bentuk penugasan khidmah pada siswa SLTA kelas akhir yang mukim di asrama pesantren putra.",
      features: [
        "Pelatihan manajemen organisasi, tata tertib, dan asrama",
        "Penugasan kepemimpinan riil di lingkungan santriwan",
        "Membentuk calon muslim dan pemimpin tangguh yang berintegritas"
      ]
    },
    {
      id: "prog-pengurus-putri",
      title: "Pengurus Pondok Putri",
      badge: "Leadership & Manajerial",
      tag: "Kepemimpinan Santriwati",
      category: "Kepemimpinan Santri",
      target: "Siswi SLTA Kelas Akhir Mukim",
      image: "assets/program_6_kepemimpinan.jpg",
      desc: "Kegiatan untuk melatih kepemimpinan dan manajerial santri dalam bentuk penugasan pada siswi SLTA kelas akhir yang tinggal di pesantren.",
      features: [
        "Pelatihan manajemen organisasi dan asrama",
        "Penugasan kepemimpinan riil di lingkungan santriwati",
        "Membentuk calon muslimah tangguh dan mandiri"
      ]
    }
  ],

  // Fasilitas Yayasan & Pesantren (Data Autentik & Bebas Hiperbola Sesuai Kenyataan Riil)
  facilities: [
    {
      id: "fac-1",
      name: "Mushola Pondok Pesantren Putra (Utama)",
      category: "Pusat Ibadah & Kajian Alumni",
      capacity: "Kapasitas Jamaah Santri & Alumni",
      target: "Santri Putra, Dewan Asatidz, Masyayikh & Alumni Pesantren",
      operational: "24 Jam Penuh (Sholat Maktubah, Qiyamul Lail, Mudzakarah & Ngaji Alumni)",
      desc: "Pusat peribadatan utama berkubah emas di asrama putra, tempat sholat fardhu berjamaah 5 waktu santri, qiyamul lail, serta pusat kegiatan ngaji rutin bersama para alumni.",
      fullDesc: "Mushola Pondok Pesantren Putra adalah pusat peribadatan utama di lingkungan YTPAI Raudlatul Muta'allimin. Berdiri megah di poros utama asrama putra dengan arsitektur kubah emas khas dan pilar lengkung berwibawa, mushola ini menjadi pusat pelaksanaan sholat fardhu berjamaah 5 waktu santri putra, qiyamul lail, halaqah tahfidzul Qur'an 30 juz bersanad, serta pengajian wetonan kitab kuning salaf oleh para Masyayikh. Mushola utama ini juga menjadi tempat terselenggaranya kegiatan ngaji bersama para alumni yang rutin berkumpul menimba ilmu.",
      features: [
        "Kubah emas berarsitektur islami megah dengan sirkulasi udara alami dan sejuk",
        "Serambi dan pilar melengkung elegan untuk ruang halaqah santri & temu alumni",
        "Pusat sholat fardhu 5 waktu berjamaah, mudzakarah kitab kuning & pengajian alumni",
        "Tempat wudhu luas, bersih, dengan pasokan air melimpah"
      ],
      image: "assets/mushola_utama.jpg"
    },
    {
      id: "fac-mushola-putri",
      name: "Mushola Pondok Pesantren Putri",
      category: "Sarana Ibadah Eksklusif Santriwati",
      capacity: "Khusus Santriwati Mukim",
      target: "Khusus Santriwati Putri, Ibu Nyai & Dewan Asatidzah",
      operational: "24 Jam Penuh (Sholat Maktubah, Halaqah Tahfidz & Fiqih Nisaiyyah)",
      desc: "Sarana ibadah eksklusif di dalam kompleks asrama santriwati, dirancang dengan privasi tinggi dan lingkungan tertutup (syar'i) untuk ketenangan ibadah santriwati.",
      fullDesc: "Mushola Pondok Pesantren Putri adalah sarana peribadatan yang bersifat eksklusif di dalam kompleks Asrama Santriwati Raudlatul Muta'allimin. Mushola ini tertutup dari akses umum guna menjaga privasi, kenyamanan, dan adab syar'i santriwati selama beribadah. Menjadi pusat pelaksanaan sholat fardhu berjamaah, muroja'ah hafalan Qur'an, tasmik bil ghoib, serta pengajian fiqih wanita (nisaiyyah) bersama Ibu Nyai dan Dewan Asatidzah.",
      features: [
        "Lingkungan eksklusif, tertutup dan terlindung syar'i di dalam kompleks asrama putri",
        "Ruang sholat berjamaah yang hening, nyaman, dan berhawa sejuk",
        "Pusat muroja'ah tahfidzatil Qur'an intensif dan halaqah Al-Qur'an santriwati",
        "Fasilitas wudhu dan sanitasi privat terintegrasi langsung dengan bilik asrama"
      ],
      image: "assets/asrama_putri_landscape.jpg"
    },
    {
      id: "fac-2",
      name: "Laboratorium Komputer & Asesmen Digital Paperless",
      category: "Sarana TIK & Ujian Digital",
      capacity: "Lab Komputer Tiap Unit & Mobile CBT",
      target: "Siswa-Santri MTs, SMP, MA, dan SMA",
      operational: "07.00 - 16.00 WIB (Pembelajaran TIK, ANBK & Ujian Sumatif)",
      desc: "Fasilitas laboratorium komputer di setiap unit sekolah/madrasah untuk pembelajaran TIK, ANBK resmi, dan pelaksanaan ujian sumatif berbasis digital paperless ramah lingkungan.",
      fullDesc: "Masing-masing unit pendidikan di bawah naungan YTPAI (MTs, SMP, MA, dan SMA) dilengkapi ruang laboratorium komputer untuk mendukung literasi teknologi santri. Menjadi pusat pelaksanaan Asesmen Nasional Berbasis Komputer (ANBK) resmi Kemendikbudristek & Kemenag serta Asesmen Madrasah. Penilaian sumatif semester kini telah beralih ke format digital (paperless) ramah lingkungan yang dijalankan secara terpadu melalui komputer laboratorium dan perangkat digital/smartphone santri secara tertib di bawah pengawasan dewan guru.",
      features: [
        "Laboratorium komputer mandiri di setiap unit jenjang MTs, SMP, MA, dan SMA",
        "Pelaksanaan resmi ANBK (Asesmen Nasional Berbasis Komputer) & Ujian Madrasah",
        "Penerapan Asesmen Sumatif Paperless ramah lingkungan berbasis CBT komputer & mobile",
        "Pembekalan literasi komputer, pengetikan tugas sekolah, dan etika teknologi santri"
      ],
      image: "assets/kegiatan_multimedia_santri.jpg"
    },
    {
      id: "fac-3",
      name: "Perpustakaan Madrasah & Ruang Baca Santri",
      category: "Sumber Belajar & Literasi",
      capacity: "Buku Kurikulum Nasional & Literatur Keislaman",
      target: "Santri, Siswa MTs, SMP, MA, SMA & Dewan Guru",
      operational: "07.00 - 16.30 WIB (Peminjaman Buku & Belajar Mandiri)",
      desc: "Pusat literasi madrasah dan sekolah yang menyediakan buku paket kurikulum nasional lengkap seluruh jenjang, buku penunjang wawasan umum, serta kitab keislaman.",
      fullDesc: "Perpustakaan madrasah dan sekolah hadir sebagai ruang belajar mandiri yang nyaman bagi seluruh siswa dan santri. Menyediakan layanan sirkulasi peminjaman buku paket kurikulum nasional untuk seluruh jenjang (MTs, SMP, MA, dan SMA), ensiklopedia, kamus bahasa Arab-Inggris, hingga buku-buku penunjang keislaman. Ruang baca yang tenang menjadi tempat santri memperdalam materi pelajaran sekolah, mengerjakan tugas kelompok, serta memupuk budaya literasi positif.",
      features: [
        "Penyediaan buku paket kurikulum nasional lengkap untuk seluruh unit jenjang",
        "Koleksi literatur keislaman, sejarah nabi, ensiklopedia, dan kamus bahasa",
        "Ruang baca yang tenang dan kondusif untuk belajar mandiri serta kerja kelompok",
        "Layanan peminjaman buku pelajaran yang tertib dipandu pengelola perpustakaan"
      ],
      image: "assets/hero_belajar_santri.jpg"
    },
    {
      id: "fac-asrama",
      name: "Kompleks Asrama Pondok Pesantren (Putra & Putri)",
      category: "Kemandirian & Masa Adaptasi",
      capacity: "Asrama Putra Salaf & Asrama Putri (VIP & Reguler)",
      target: "Santri Mukim Pondok Pesantren Putra & Putri",
      operational: "24 Jam Penuh (Bimbingan Musyrif & Musyrifah Asrama)",
      desc: "Asrama Putra menerapkan konsep salaf bersahaja (lesehan beralas kasur lantai), sedangkan Asrama Putri menyediakan Kamar VIP (ranjang & kamar mandi dalam) untuk adaptasi santriwati baru sebelum beralih ke kamar reguler.",
      fullDesc: "Kompleks asrama dirancang dengan pendekatan kepengasuhan yang bijak dan berjenjang. Di Asrama Putra, santri dididik dalam tradisi kesederhanaan pesantren salaf beralaskan kasur lantai/matras (lesehan) yang menumbuhkan jiwa mandiri, guyub, dan ketawadhu'an. Di Asrama Putri, tersedia Kamar VIP berfasilitas ranjang tidur dan kamar mandi di dalam kamar yang dikhususkan bagi santriwati kelas awal (fase adaptasi santriwati baru agar tidak kaget). Setelah memasuki jenjang kelas berikutnya, santriwati bertransisi ke kamar reguler untuk mempererat persaudaraan, kebersamaan, dan ukhuwah islamiyah.",
      features: [
        "Asrama Putra: Konsep lesehan salaf yang bersahaja, memupuk kebersamaan dan kemandirian",
        "Asrama Putri VIP: Kamar adaptasi santriwati baru dengan fasilitas ranjang dan kamar mandi dalam",
        "Asrama Putri Reguler: Kamar kebersamaan untuk santriwati madya/lanjutan guna memupuk ukhuwah",
        "Pengawasan dan pengasuhan penuh 24 jam oleh Musyrif dan Musyrifah asrama"
      ],
      image: "assets/asrama_putra_landscape.jpg"
    },
    {
      id: "fac-halaman",
      name: "Halaman Utama Kompleks Yayasan",
      category: "Area Terbuka & Olahraga",
      capacity: "Halaman Terbuka Serbaguna Yayasan",
      target: "Seluruh Siswa-Santri, Dewan Guru, & Wali Santri",
      operational: "06.00 - 17.30 WIB (Upacara, Olahraga & Perhelatan Akbar)",
      desc: "Area terbuka serbaguna untuk upacara bendera, sarana olahraga santri (futsal & voli), serta arena perhelatan acara akbar (Haflah Akhir Sanah & wisuda). Pertemuan wali murid difasilitasi di gedung unit masing-masing.",
      fullDesc: "Halaman utama di poros kompleks yayasan merupakan ruang terbuka multifungsi yang asri. Difungsikan rutin untuk upacara bendera setiap hari Senin, senam kesegaran jasmani, latihan kepanduan Pramuka, serta sarana olahraga santri seperti futsal dan bola voli. Ketika yayasan menyelenggarakan perhelatan akbar seperti Haflah Akhir Sanah, wisuda santri, dan pengajian umum, halaman ini ditata dengan panggung dan tratag terbuka. Adapun untuk pertemuan silaturahmi dengan wali murid berkala, yayasan memfasilitasinya secara langsung dan hangat di ruang pertemuan gedung unit pendidikan masing-masing.",
      features: [
        "Lapangan multifungsi untuk upacara bendera dan latihan kepramukaan",
        "Sarana olahraga kebugaran santri: futsal, bola voli, dan badminton",
        "Arena terbuka untuk panggung Haflah Akhir Sanah, wisuda akbar & tabligh akbar",
        "Pertemuan berkala wali murid difasilitasi langsung di gedung unit madrasah/sekolah"
      ],
      image: "assets/pesantren_gedung.jpg"
    },
    {
      id: "fac-poskestren",
      name: "Pos Kesehatan Pesantren (Poskestren)",
      category: "Layanan Kesehatan & Klinik Santri",
      capacity: "Ranjang Rawat Observasi Terpisah Putra & Putri",
      target: "Santri Mukim, Siswa Sekolah & Warga Pesantren",
      operational: "Siaga 24 Jam Santri Sakit & Faskes Primer",
      desc: "Fasilitas layanan kesehatan terpadu dan pertolongan pertama (P3K) santri sakit di lingkungan yayasan, dilengkapi ranjang rawat observasi terpisah putra-putri, stok obat berizin, serta pendampingan rujukan darurat 24 jam.",
      fullDesc: "Pos Kesehatan Pesantren (Poskestren) Raudlatul Muta'allimin merupakan fasilitas sarana kesehatan primer terpadu yayasan yang siaga melayani santri mukim, siswa sekolah/madrasah, dewan asatidz, dan seluruh warga pesantren. Apabila terdapat santri yang sakit, Poskestren menjadi tempat pertama penanganan medis, pemeriksaan fisik dasar, pemberian obat berizin, serta istirahat observasi di ranjang rawat terpisah (putra dan putri). Bekerja sama secara resmi dengan Dinas Kesehatan dan Puskesmas setempat untuk pemantauan kesehatan berkala, imunisasi/skrining PHBS (Perilaku Hidup Bersih & Sehat), serta rujukan darurat cepat 24 jam ke faskes lanjutan/rumah sakit bila diperlukan.",
      features: [
        "Ranjang rawat observasi istirahat terpisah antara santri putra dan santri putri",
        "Pemeriksaan tanda vital dasar, tensi darah, suhu tubuh, dan kotak P3K lengkap",
        "Penyediaan obat-obatan esensial berizin dan perawatan santri demam/sakit ringan",
        "Kerja sama pembinaan faskes dengan Puskesmas setempat & ambulans siaga 24 jam"
      ],
      image: "assets/fasilitas_poskestren.jpg"
    }
  ],

  // Warta & Berita Terpadu (Lengkap dengan Konten Naratif & Estimasi Baca)
  news: [
    {
      id: 1,
      title: "Santri MA Raudlatul Muta'allimin Raih Medali Emas Olimpiade Sains Nasional 2026",
      category: "Akademik",
      date: "10 September 2026",
      author: "Humas MA",
      readTime: "3 Menit Baca",
      image: "assets/berita_santri_prestasi.jpg",
      excerpt: "Prestasi gemilang diraih kontingen santri jurusan IPA dalam ajang kompetisi sains terintegrasi keagamaan tingkat nasional.",
      content: "Keluarga besar Yayasan Taman Pendidikan Agama Islam (YTPAI) Raudlatul Muta'allimin Lamongan kembali menorehkan tinta emas di kancah nasional. Kontingen santri dari Madrasah Aliyah (MA) Raudlatul Muta'allimin sukses memboyong Medali Emas pada ajang Olimpiade Sains dan Integrasi Keagamaan Nasional (OSIKN) 2026 di Jakarta.\n\nDalam kompetisi bergengsi yang diikuti lebih dari 1.200 peserta dari berbagai madrasah dan pondok pesantren ternama di seluruh Indonesia, ananda Muhammad Rizky Fauzan (Kelas XII IPA) menampilkan karya riset aplikatif bio-sains berbasis kearifan lokal yang dipadukan dengan dalil-dalil sains dalam Al-Qur'an. Presentasi dan pengujian laboratorium yang dipaparkannya berhasil memukau dewan juri ahli dari berbagai perguruan tinggi negeri terkemuka.\n\nKepala MA Raudlatul Muta'allimin menyampaikan rasa syukur mendalam: 'Prestasi ini membuktikan bahwa santri tidak hanya mendalami kitab kuning dan tradisi salaf, tetapi juga mampu berdiri tegak memimpin inovasi sains modern. Kunci keberhasilan santri kami adalah disiplin asrama, doa mustajab para asatidz, serta fasilitas riset laboratorium sains yang terus kami modernisasi.'\n\nAtas pencapaian ini, ananda Rizky berhak atas beasiswa pendidikan penuh dan tiket delegasi untuk mewakili Indonesia dalam olimpiade sains pelajar Islam internasional yang akan diselenggarakan di Doha, Qatar pada akhir tahun ini."
    },
    {
      id: 2,
      title: "Peringatan Maulid Nabi SAW dan Khotmil Qur'an Bil Ghoib 30 Juz Berlangsung Khidmat",
      category: "Kegiatan Yayasan",
      date: "04 September 2026",
      author: "Redaksi Media",
      readTime: "4 Menit Baca",
      image: "assets/tahfidz_quran_pesantren.jpg",
      excerpt: "Ratusan santri dan wali santri tumpah ruah dalam lantunan sholawat dan doa bersama di Mushola Pondok Pesantren Putra.",
      content: "Suasana haru dan penuh keberkahan menyelimuti Mushola Pondok Pesantren Putra Raudlatul Muta'allimin Lamongan pada peringatan Maulid Nabi Muhammad SAW yang dirangkai dengan Wisuda Khotmil Qur'an Bil Ghoib 30 Juz Santri Putri dan Putra.\n\nAcara yang dihadiri oleh jajaran Pengurus Yayasan, Majelis Pengasuh, para alim ulama se-Kabupaten Lamongan, serta ratusan wali santri ini menjadi momentum syiar keluhuran akhlak nabawi. Sebanyak 42 santri resmi dikukuhkan sebagai hafidz dan hafidzah setelah menyelesaikan tasmi' sekali duduk 30 juz di hadapan para penguji sanad tahfidz.\n\nDalam Mau'idhoh Hasanah-nya, Ketua Dewan Pembina Yayasan berpesan: 'Al-Qur'an adalah cahaya hidup. Menghafalnya adalah anugerah, mengamalkannya adalah kewajiban seumur hidup. Kami berharap para penghafal Al-Qur'an dari Raudlatul Muta'allimin menjadi lentera peradaban yang berakhlak mulia di tengah masyarakat modern.'\n\nKegiatan ditutup dengan mahalul qiyam yang dipimpin oleh grup shalawat santri Syauqul Musthofa, dilanjutkan dengan ramah tamah dan makan bersama secara berjamaah (talam) yang mempererat ukhuwah islamiyah antar santri, asatidz, dan wali santri."
    },
    {
      id: 3,
      title: "LPBA Luncurkan English & Arabic Intensive Camp untuk Santri Baru Angkatan 2026",
      category: "Bahasa",
      date: "28 Agustus 2026",
      author: "Tim LPBA",
      readTime: "3 Menit Baca",
      image: "assets/lbb_bimbel_intensif.jpg",
      excerpt: "Program akselerasi bahasa asing menghadirkan native speaker untuk mengasah kemampuan komunikasi internasional santri.",
      content: "Lembaga Pengembangan Bahasa Asing (LPBA) YTPAI Raudlatul Muta'allimin resmi membuka English & Arabic Intensive Camp bagi seluruh santri baru tahun ajaran 2026/2027. Program akselerasi ini dirancang khusus untuk membangun fondasi bilingual aktif santri sejak dini.\n\nSelama 40 hari penuh, para santri ditempatkan dalam lingkungan berasrama khusus (Language Dormitory) dengan pembiasaan 'Total Immersion Zone'—di mana percakapan harian menggunakan bahasa Arab fusha dan bahasa Inggris. Untuk menjaga kualitas pelafalan dan pemahaman budaya, LPBA bekerjasama dengan tenaga pendidik native speaker dari Al-Azhar Kairo dan universitas mitra di luar negeri.\n\nDirektur LPBA menjelaskan bahwa penguasaan bahasa internasional merupakan instrumen vital bagi santri di era global: 'Santri kita disiapkan untuk menjadi duta Islam rahmatan lil 'alamin di panggung dunia. Dengan fasih berbahasa Arab dan Inggris, mereka siap membaca literatur turats klasik sekaligus mengarungi jurnal ilmiah internasional.'\n\nDi akhir program camp, santri akan menampilkan unjuk kebolehan dalam Public Speaking Contest, Drama Teatrikal Bahasa Asing, serta Debat Ilmiah Internasional."
    },
    {
      id: 4,
      title: "Penerimaan Santri & Murid Baru (PSB / SPMB) Gelombang I Tahun Ajaran 2026/2027 Resmi Dibuka",
      category: "Info PSB",
      date: "20 Agustus 2026",
      author: "Panitia PSB",
      readTime: "3 Menit Baca",
      image: "assets/kbihu_manasik_haji.jpg",
      excerpt: "Pendaftaran online dapat diakses melalui portal resmi yayasan dengan beasiswa khusus bagi santri tahfidz dan berprestasi.",
      content: "Panitia Penerimaan Santri & Murid Baru (PSB / SPMB) Terpadu YTPAI Raudlatul Muta'allimin Lamongan secara resmi mengumumkan pembukaan Gelombang I Pendaftaran Santri Baru untuk tahun ajaran 2026/2027. Pendaftaran mencakup seluruh jenjang mulai dari PAUD/TK, MI, MTs, SMP, MA, SMA, SMK, hingga Pendidikan Diniyah Formal dan Asrama Kepesantrenan.\n\nPada gelombang pertama ini, Yayasan menyediakan kuota Beasiswa Santri Unggul untuk 3 kategori utama:\n1. Beasiswa Tahfidzul Qur'an (Bebas biaya pendidikan bagi hafalan minimal 5 juz).\n2. Beasiswa Prestasi Sains & Olahraga (Tingkat Kabupaten/Provinsi/Nasional).\n3. Beasiswa Asatidz & Dhuafa Berprestasi.\n\nKetua Panitia PSB mengingatkan calon wali santri untuk memanfaatkan sistem pendaftaran digital: 'Seluruh proses pendaftaran, unggah berkas akta lahir, kartu keluarga, dan rapor kini dapat dilakukan 100% secara daring melalui situs resmi ini. Wali santri dapat langsung mengisi formulir, mencetak bukti registrasi, dan berkonsultasi via WhatsApp panitia.'\n\nGelombang I dibuka hingga 30 November 2026, dan akan ditutup lebih awal apabila kuota asrama di masing-masing unit pendidikan telah terpenuhi."
    },
    {
      id: 5,
      title: "Kunjungan Silaturahmi Akademik Delegasi Alumni Al-Azhar Mesir & Penguatan Sanad Hadits",
      category: "Kegiatan Yayasan",
      date: "14 Agustus 2026",
      author: "Biro Humas Yayasan",
      readTime: "3 Menit Baca",
      image: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=800&q=80",
      excerpt: "Rangkaian daurah ilmiah talaqqi kitab Shahih Al-Bukhari memperkuat mata rantai keilmuan kepesantrenan santri.",
      content: "Pesantren Raudlatul Muta'allimin menerima kunjungan istimewa delegasi Ikatan Alumni Universitas Al-Azhar (OIAA) Cabang Indonesia dan masyaikh dari Timur Tengah. Kunjungan ini berfokus pada penguatan sanad keilmuan dan kerjasama beasiswa kuliah lanjutan ke luar negeri bagi lulusan MA dan SMA Raudlatul Muta'allimin.\n\nDalam kunjungan yang berlangsung selama 3 hari tersebut, diselenggarakan Daurah Ilmiah Hadits Nabawi dan Talaqqi Kitab Arbain Nawawiyah bersanad muttashil. Sebanyak 150 santri tingkat 'Ulya dan asatidz senior berkesempatan membacakan matan hadits dan menerima ijazah sanad langsung.\n\nKetua Yayasan menegaskan komitmen pesantren dalam menjaga orisinalitas keilmuan salaf: 'Sanad adalah bagian integral dari agama Islam. Kerjasama ini memastikan bahwa kurikulum diniyah pesantren kita senantiasa bersambung mata rantainya hingga ke Rasulullah SAW, sekaligus membuka jalan lapang bagi santri yang berkeinginan melanjutkan studi ke Universitas Al-Azhar Kairo.'"
    },
    {
      id: 6,
      title: "Peresmian Laboratorium Komputer Modern & Studio Multimedia Santri Mandiri",
      category: "Akademik",
      date: "02 Agustus 2026",
      author: "Tim IT & Media",
      readTime: "3 Menit Baca",
      image: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=800&q=80",
      excerpt: "Fasilitas 80 unit PC berkecepatan tinggi dan studio podcast untuk membekali santri keahlian teknologi digital.",
      content: "YTPAI Raudlatul Muta'allimin Lamongan meresmikan Gedung Laboratorium Komputer Baru dan Studio Multimedia Santri yang berlokasi di Sayap Barat Kompleks Yayasan. Fasilitas ini dilengkapi dengan 80 unit komputer high-performance, koneksi serat optik gigabit terdedikasi, serta perlengkapan studio rekaman audio-video profesional.\n\nFasilitas mutakhir ini akan dimanfaatkan untuk pembelajaran coding dan pemrograman dasar, desain grafis, riset digital, serta pelatihan content creator dakwah Islam moderat melalui santri media club.\n\n'Di era kecerdasan buatan (AI) dan transformasi digital, santri tidak boleh hanya menjadi konsumen teknologi, melainkan harus menjadi produsen gagasan dan kreator konten bernilai positif. Fasilitas ini didedikasikan untuk mewujudkan santri yang melek digital, berjiwa entrepreneur, dan berakhlak Qur'ani,' tutur Koordinator IT Yayasan."
    }
  ],

  // Prestasi Santri & Guru (Ref: Maskumambang Style Showcase)
  achievements: [
    {
      id: "ach-1",
      title: "Membanggakan! Kontingen Pramuka Gudep Pesantren Raih Juara Umum Jambore Daerah",
      winner: "Kontingen Pramuka MTs & MA",
      unit: "MTs & MA Raudlatul Muta'allimin",
      category: "Kepanduan",
      year: "2026",
      image: "assets/kegiatan_pramuka_santri.jpg",
      desc: "Kontingen Pramuka Gugus Depan Pondok Pesantren Raudlatul Muta'allimin sukses menorehkan prestasi gemilang sebagai Juara Umum Jambore Daerah se-Jawa Timur. Keberhasilan ini diraih berkat kedisiplinan tinggi, kekompakan regu santri, serta penguasaan teknik kepanduan seperti pioneering menara pandang, navigasi kompas medan terbuka, morse sandi, dan ketangkasan survival lapangan yang dipadukan dengan kepribadian berakhlakul karimah."
    },
    {
      id: "ach-2",
      title: "Kembali Ukir Prestasi! Juara 1 MTQ Nasional Cabang Tilawah Remaja Putra",
      winner: "Ahmad Fauzi (Santri MA)",
      unit: "Madrasah Aliyah",
      category: "Seni Islami",
      year: "2026",
      image: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=800&q=80",
      desc: "Santri Madrasah Aliyah Raudlatul Muta'allimin, Ahmad Fauzi, berhasil meraih Juara 1 Musabaqah Tilawatil Qur'an (MTQ) Tingkat Nasional cabang Tilawah Remaja Putra. Prestasi bergengsi ini merupakan buah pembinaan intensif Lembaga Pengembangan Tilawatil Qur'an (LPTQ) pesantren di bawah asuhan qari nasional, melatih ketepatan kaidah tajwid, fashahah, dan keindahan variasi nagham lagu Al-Qur'an (Bayati, Shoba, Hijaz, dan Rast)."
    },
    {
      id: "ach-3",
      title: "16 Prestasi Olimpiade Bahasa Arab (OBA) IX Jadi Bukti Kuatnya Pembinaan Bahasa Asing",
      winner: "Tim Delegasi Santri MTs & MA",
      unit: "LPBA / MTs & MA",
      category: "Bahasa",
      year: "2026",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
      desc: "Delegasi santri MTs dan MA Raudlatul Muta'allimin memborong 16 penghargaan dan medali pada Olimpiade Bahasa Arab (OBA) IX tingkat wilayah dan Jawa Timur. Prestasi ini menegaskan keunggulan pembiasaan bilingual 'Arabic-English Daily Speaking Environment' di lingkungan pesantren serta kurikulum penguasaan gramatika nahwu-sharaf terstruktur binaan Lembaga Pengembangan Bahasa Asing (LPBA)."
    },
    {
      id: "ach-4",
      title: "Medali Emas Olimpiade Sains & Kimia Terapan Tingkat Provinsi Jawa Timur",
      winner: "Nurul Izzah (Santri SMA IPA)",
      unit: "SMA Raudlatul Muta'allimin",
      category: "Akademik",
      year: "2026",
      image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
      desc: "Nurul Izzah, siswi kelas XI SMA Raudlatul Muta'allimin, sukses menyabet Medali Emas pada Olimpiade Sains & Kimia Terapan tingkat Provinsi Jawa Timur. Proyek penelitiannya mengenai ekstraksi senyawa bioaktif ramah lingkungan dari limbah pertanian lokal di laboratorium sains terpadu pesantren mendapat apresiasi tinggi dari dewan juri akademisi universitas ternama."
    },
    {
      id: "ach-5",
      title: "Juara Umum Festival Shalawat Banjari Syauqul Musthofa Tingkat Jawa Timur",
      winner: "Tim Hadrah Santri Salaf",
      unit: "Madrasah Diniyah",
      category: "Seni Islami",
      year: "2025",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
      desc: "Grup Hadrah Santri Salaf Raudlatul Muta'allimin dinobatkan sebagai Juara Umum Festival Shalawat Al-Banjari se-Jawa Timur. Menampilkan harmonisasi ketukan terbang khas salafiyah dengan vokal solois yang khusyuk dan fasih, tim hadrah ini sukses memukau dewan juri dan ratusan hadirin, sekaligus memperkokoh syiar shalawat di kalangan generasi muda santri."
    },
    {
      id: "ach-6",
      title: "Juara 1 Turnamen Olahraga Futsal & Voli Pelajar Santri Lamongan",
      winner: "Tim Olahraga Santri YTPAI",
      unit: "SMP & MTs Raudlatul Muta'allimin",
      category: "Olahraga",
      year: "2025",
      image: "assets/kegiatan_olahraga_santri.jpg",
      desc: "Tim santri Raudlatul Muta'allimin berhasil meraih Juara 1 pada Turnamen Olahraga Santri Pelajar se-Kabupaten Lamongan. Melalui latihan fisik dan teknik rutin di halaman terbuka yayasan setiap sore dan akhir pekan, santri membuktikan stamina prima, kekompakan tim, serta sportivitas islami yang membanggakan."
    },
    {
      id: "ach-7",
      title: "Delegasi Santri Indonesia pada International Arabic & Islamic Studies Forum",
      winner: "Fathur Rohman (Santri MA)",
      unit: "Madrasah Aliyah",
      category: "Internasional",
      year: "2026",
      image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80",
      desc: "Fathur Rohman terpilih mewakili santri muda Indonesia dalam forum ilmiah internasional studi Islam dan bahasa Arab. Karya ilmiah yang dipaparkannya mengenai kontribusi ulama nusantara dalam transmisi turats keislaman dan pemikiran wasathiyah berhasil menarik perhatian delegasi lintas negara, mencerminkan wawasan global santri Raudlatul Muta'allimin."
    },
    {
      id: "ach-8",
      title: "Juara 1 Musabaqah Qira'atil Kutub (MQK) Fathul Qorib Tingkat Wilayah",
      winner: "Tim MDT Wustho",
      unit: "Madrasah Diniyah Takmiliyah",
      category: "Kitab Kuning",
      year: "2026",
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
      desc: "Tim Madrasah Diniyah Takmiliyah (MDT) Wustho meraih Juara 1 dalam ajang Musabaqah Qira'atil Kutub (MQK) bidang Fiqih kitab Fathul Qorib Al-Mujib. Para santri diuji ketepatan i'rab nahwu-sharaf, kefasihan membaca naskah klasik tanpa harakat, serta kedalaman argumentasi pengambilan istinbath hukum fiqih sesuai ta'bir para fuqaha mu'tabar."
    }
  ],

  // 9.B Rekam Jejak Ujian Tasmik 5 Juz Santri Tahfidz (Program Unggulan)
  tasmikRecords: [
    {
      id: "tasmik-1",
      name: "Muhammad Nabil Al-Faruq",
      unit: "MTs Raudlatul Muta'allimin • Pondok Putra",
      juz: "Juz 1 – 5 Bil Ghaib",
      juzRange: "1-5",
      accompaniment: "parent",
      accompanimentLabel: "Didampingi Orang Tua",
      parentInfo: "Bpk. H. Sukardi & Ibu Siti Aminah",
      tester: "Ustadz H. Ahmad Muzammil, Al-Hafidz",
      predicate: "Mumtaz (Istimewa)",
      date: "14 September 2026",
      image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80",
      notes: "Alhamdulillah berhasil menyelesaikan setoran hafalan 5 Juz sekali duduk dengan lancar dan khusyuk disaksikan langsung oleh kedua orang tua. Momen penyerahan syahadah diwarnai rasa haru dan sujud syukur bersama keluarga di aula utama pesantren."
    },
    {
      id: "tasmik-2",
      name: "Aisyah Putri Nur Haliza",
      unit: "Madrasah Aliyah • Asrama Tahfidz Putri",
      juz: "Juz 1 – 5 Bil Ghaib",
      juzRange: "1-5",
      accompaniment: "independent",
      accompanimentLabel: "Mandiri (Santri Asrama)",
      parentInfo: "Didampingi Musyrifah Asrama & Pembina Tahfidz Putri",
      tester: "Ustadzah Hj. Maryam, Al-Hafidzah",
      predicate: "Mumtaz (Istimewa)",
      date: "08 September 2026",
      image: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=800&q=80",
      notes: "Berjuang mandiri jauh dari kampung halaman, Aisyah menuntaskan hafalan 5 juz sekali duduk dengan fashahah dan tajwid sempurna di hadapan dewan penguji asrama putri. Doa restu orang tua menyertai penuh berkah dari kejauhan."
    },
    {
      id: "tasmik-3",
      name: "Ahmad Zayan Al-Ghifari",
      unit: "SMP Raudlatul Muta'allimin • Pondok Putra",
      juz: "Juz 6 – 10 Bil Ghaib",
      juzRange: "6-10",
      accompaniment: "parent",
      accompanimentLabel: "Didampingi Orang Tua",
      parentInfo: "Bpk. Supriyanto & Ibu Sri Wahyuni",
      tester: "Dr. KH. Ghozi, Lc., M.Fil.I & Tim Huffadz",
      predicate: "Jayyid Jiddan",
      date: "01 September 2026",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
      notes: "Setoran maraton Juz 6 hingga 10 dalam satu majelis berlangsung khidmat selama 4 jam penuh. Ayahanda turut menyimak mushaf secara langsung dengan mata berkaca-kaca bangga atas keteguhan santri muda ini."
    },
    {
      id: "tasmik-4",
      name: "Muhammad Ilham Ramadhan",
      unit: "SMA Raudlatul Muta'allimin • Pondok Putra",
      juz: "Juz 1 – 5 Bil Ghaib",
      juzRange: "1-5",
      accompaniment: "independent",
      accompanimentLabel: "Mandiri (Santri Asrama)",
      parentInfo: "Didampingi Wali Kamar & Pengasuh Santri Mukim",
      tester: "KH. Miftahul Falah, S.Pd",
      predicate: "Mumtaz (Istimewa)",
      date: "25 Agustus 2026",
      image: "assets/tahfidz_quran_pesantren.jpg",
      notes: "Disimak langsung oleh Ketua Dewan Pengasuh Pondok Pesantren, Ilham menunjukkan ketenangan dan mutqin tinggi. Dedikasi muraja'ah ba'da Shubuh dan tahajjud di asrama berbuah manis kelulusan tasmik 5 juz bersanad."
    },
    {
      id: "tasmik-5",
      name: "Fatimah Az-Zahra",
      unit: "MTs Raudlatul Muta'allimin • Asrama Putri",
      juz: "Juz 1 – 5 Bil Ghaib",
      juzRange: "1-5",
      accompaniment: "parent",
      accompanimentLabel: "Didampingi Orang Tua",
      parentInfo: "Bpk. H. Ridwan & Ibu Nur Hayati",
      tester: "Ustadzah Fatimatuz Zahro, Al-Hafidzah",
      predicate: "Mumtaz (Istimewa)",
      date: "18 Agustus 2026",
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
      notes: "Kehadiran ibunda tercinta yang duduk di samping meja setoran memberikan dorongan ketenangan spiritual yang luar biasa. Kelulusan tasmik 5 juz ini dihadiahkan Fatimah sebagai baktinya kepada kedua orang tua tercinta."
    },
    {
      id: "tasmik-6",
      name: "Rayhan Rizqullah",
      unit: "Madrasah Aliyah • Pondok Putra",
      juz: "Juz 11 – 15 Bil Ghaib",
      juzRange: "11-15",
      accompaniment: "independent",
      accompanimentLabel: "Mandiri (Santri Asrama)",
      parentInfo: "Didampingi Pengasuh Asrama Salafiyah",
      tester: "Ustadz M. Syamsul Huda, Al-Hafidz",
      predicate: "Jayyid Jiddan",
      date: "10 Agustus 2026",
      image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
      notes: "Santri senior MA ini berhasil menuntaskan etape kedua tasmik juz 11 s.d. 15 bil-ghaib tanpa jeda. Menjadi teladan bagi adik-adik kelas santri baru dalam ketekunan menjaga dawamul wudhu dan muraja'ah Al-Qur'an."
    }
  ],

  // 10. Ruang Karya & Kreativitas Santri (Media, Film, Musik, Sastra, Seni)
  studentWorks: [
    {
      id: "karya-1",
      title: "Cahaya Di Balik Tabir (Short Movie Santri)",
      category: "Film",
      categoryLabel: "Film Pendek & Sinema",
      creator: "Tim Sinematografi Santri MA & SMA",
      unit: "Pondok Pesantren Putra & Putri",
      date: "Agustus 2026",
      duration: "12:45 Menit",
      likes: 342,
      thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80",
      mediaUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      synopsis: "Film pendek inspiratif karya santri tentang seorang santri baru yang bergulat dengan rasa rindu rumah, hingga menemukan ketenangan dan persaudaraan sejati di bilik asrama pesantren.",
      crew: "Sutradara: M. Farhan (Santri MA) • Sinematografer: Dimas Pratama • Naskah: Tim Teater Santri",
      tags: ["Film Pendek", "Sinematografi", "Inspirasi", "Pesantren"],
      content: ""
    },
    {
      id: "karya-2",
      title: "Cover Sholawat Mughrom (Acoustic Nuance)",
      category: "Musik",
      categoryLabel: "Cover Lagu & Musik",
      creator: "Vokal: Siti Nur Aisyah & Grup Akustik Putri",
      unit: "Pondok Pesantren Putri",
      date: "Juli 2026",
      duration: "04:20 Menit",
      likes: 495,
      thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
      mediaUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      synopsis: "Aransemen sholawat akustik syahdu dengan perpaduan gitar lembut, darbuka, dan vokal merdu santriwati yang menghangatkan hati pendengar.",
      crew: "Vokal Utama: Siti Nur Aisyah • Gitar Akustik: Rina Amelia • Perkusi: Tim Hadrah Putri",
      tags: ["Cover Sholawat", "Akustik", "Santriwati", "Musik Religi"],
      content: "مُغْرَمْ… قَلْبِيْ بِحُبِّكَ مُغْرَمْ\nيَا رَسُوْلَ اللهِ حَبِيْبِيْ يَا خَيْرَ الْأَنَامْ\n\nWahai Baginda Nabi junjungan semesta,\nDalam hening asrama namamu senantiasa terucap,\nMembimbing langkah kami meniti ilmu dan takwa."
    },
    {
      id: "karya-3",
      title: "Menatap Langit Babat: Catatan Hati Penuntut Ilmu",
      category: "Tulisan",
      categoryLabel: "Esai & Refleksi Santri",
      creator: "Ahmad Zainal Muttaqin (Santri Kelas XII MA)",
      unit: "Pondok Pesantren Putra",
      date: "September 2026",
      duration: "4 Menit Baca",
      likes: 218,
      thumbnail: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
      mediaUrl: "",
      synopsis: "Refleksi filosofis tentang perjalanan menuntut ilmu di kota Babat Lamongan: bagaimana kedalaman lembaran kitab kuning mendidik kerendahhatian di tengah modernitas.",
      crew: "Penulis: Ahmad Zainal Muttaqin • Editor: Tim Redaksi Majalah Dinding Santri",
      tags: ["Esai", "Refleksi", "Kitab Kuning", "Sastra Santri"],
      content: "Di bawah temaram lampu serambi asrama, aroma kertas kitab kuning yang khas menyeruak bersama sepoi angin malam bantaran Bengawan Solo di Babat. Menjadi santri bukanlah pelarian dari hiruk-pikuk dunia, melainkan perjalanan pulang menuju hakikat diri yang sejati.\n\nDalam kitab Ta'limul Muta'allim, Syaikh Az-Zarnuji mengingatkan bahwa tidak ada ilmu yang meresap tanpa bejana kesabaran dan ketawadhu'an. Di YTPAI Raudlatul Muta'allimin, kami dididik bahwa rumus-rumus sains modern dan bait-bait Alfiyyah Ibnu Malik tidaklah saling meniadakan; keduanya adalah instrumen akal untuk mengagumi keagungan Sang Pencipta.\n\nKetika fajar menyingsing dan suara adzan berkumandang dari Mushola Pondok Pesantren Putra, ribuan santri bergegas merapatkan shaf. Di sanalah kami menyadari bahwa masa depan umat tidak dibangun oleh mereka yang banyak bicara, melainkan oleh jiwa-jiwa mukmin yang sujud khusyuk di hadapan Allah dan bangkit membawa karya nyata bagi kemaslahatan bangsa."
    },
    {
      id: "karya-4",
      title: "Jejak Langkah di Lorong Asrama (Puisi Religi)",
      category: "Tulisan",
      categoryLabel: "Puisi & Nadzom",
      creator: "Fathimah Az-Zahra (Siswi MTs Terpadu)",
      unit: "Pondok Pesantren Putri",
      date: "Agustus 2026",
      duration: "2 Menit Baca",
      likes: 184,
      thumbnail: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80",
      mediaUrl: "",
      synopsis: "Untaian sajak puitis tentang ketulusan menuntut ilmu, kerinduan hangat pada kedua orang tua, dan indahnya persaudaraan ukhuwah fillah di asrama santriwati.",
      crew: "Karya: Fathimah Az-Zahra • Pembina Bahasa: Ustadzah Nurul Hidayah",
      tags: ["Puisi", "Sastra Santri", "Rindu Ibu", "Mahabbah"],
      content: "Sajadah usang saksi bisu malam,\nKala bulir tasbih bergulir pelan dalam diam.\nAyah bunda di kejauhan kampung halaman,\nKutitipkan rindu pada tiap harokat dan hafalan.\n\nKitab-kitab terbuka di haribaan,\nMenuntun jiwa merengkuh kedamaian.\nWahai lorong asrama yang bersahaja,\nDi sinilah cita-cita kami memeluk cakrawala."
    },
    {
      id: "karya-5",
      title: "Harmoni Deen Assalam (Vocal Group & Kolaborasi Alat Musik)",
      category: "Musik",
      categoryLabel: "Kolaborasi Musik Religi",
      creator: "Grup Vokal Santri Putra & Paduan Suara SMP",
      unit: "Pondok Pesantren Putra & SMP",
      date: "Juni 2026",
      duration: "05:15 Menit",
      likes: 562,
      thumbnail: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80",
      mediaUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      synopsis: "Kolaborasi kreatif membawakan Deen Assalam dengan sentuhan alat musik gambus, suling bambu, dan keyboard santri dalam menyuarakan pesan damai rahmatan lil 'alamin.",
      crew: "Aransemen: Ustadz M. Ridwan • Vokalis Utama: M. Ilham & Paduan Suara Santri",
      tags: ["Nasyid", "Deen Assalam", "Harmoni", "Musik Positif"],
      content: "Kala hati terpaut pada ketulusan,\nSebarkan salam dan cinta bagi semesta alam.\nIslam adalah cahaya kelembutan,\nMenebar damai di bumi Nusantara."
    },
    {
      id: "karya-6",
      title: "Kaligrafi Kontemporer: Khot Tsuluts Surah Al-Alaq",
      category: "Seni",
      categoryLabel: "Kaligrafi & Seni Rupa",
      creator: "Muhammad Rizqi (Santri Jurusan Keagamaan MA)",
      unit: "Pondok Pesantren Putra",
      date: "Mei 2026",
      duration: "Karya Visual (120x80 cm)",
      likes: 412,
      thumbnail: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
      mediaUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1600&q=85",
      synopsis: "Lukisan kaligrafi kanvas dengan Khot Tsuluts Jali berlatar gradasi akrilik modern terinspirasi wahyu pertama Iqra'. Memadukan kaidah klasik khatat salaf dengan estetika visual masa kini.",
      crew: "Pelukis: Muhammad Rizqi • Pembimbing: Ustadz H. Basyiruddin (Kaligrafer Nasional)",
      tags: ["Kaligrafi", "Seni Rupa", "Khot Tsuluts", "Juara Provinsi"],
      content: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ\nKarya ini dilukis selama 3 pekan menggunakan teknik kuas akrilik dan tinta cina di atas kanvas berserat tebal. Menggambarkan cahaya ilmu yang membelah kegelapan kebodohan."
    },
    {
      id: "karya-7",
      title: "Santri Tech: Smart Water Monitoring Pesantren",
      category: "Film",
      categoryLabel: "Video Riset & Teknologi",
      creator: "Klub Robotika & IoT Santri SMA",
      unit: "SMA Raudlatul Muta'allimin",
      date: "September 2026",
      duration: "08:10 Menit",
      likes: 295,
      thumbnail: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      mediaUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      synopsis: "Dokumentasi video proyek rekayasa sains santri membuat sistem sensor pemantau debit dan kejernihan air wudhu otomatis berbasis ESP32 microcontroller dan internet of things.",
      crew: "Lead Programmer: Dani Ramadhan • Circuit Designer: Zaky Mubarok • Mentor: Tim IT Yayasan",
      tags: ["Teknologi", "IoT", "Sains Santri", "Inovasi"],
      content: ""
    }
  ],

  // Ekstrakurikuler & Pembinaan Bakat Santri (PRD 5.2 H)
  extracurriculars: [
    {
      id: "ekskul-pramuka",
      name: "Gerakan Pramuka Gudep Pesantren",
      category: "Kepanduan & Karakter",
      badge: "Karakter Mandiri",
      pembina: "Kak M. Syaifuddin, S.Pd (Kwarda Jatim)",
      schedule: "Setiap Sabtu Sore (15.30 - 17.00 WIB)",
      desc: "Membentuk jiwa santri mandiri, disiplin ksatria, cinta tanah air, dan terampil dalam pioneering, survival alam terbuka, serta bakti sosial masyarakat.",
      features: ["Pioneering & Tali-Temali", "Jelajah Alam & Kemah Akbar", "Kader Tanggap Bencana"],
      image: "assets/kegiatan_pramuka_santri.jpg"
    },
    {
      id: "ekskul-banjari",
      name: "Seni Shalawat Banjari Syauqul Musthofa",
      category: "Seni Musik Islami",
      badge: "Juara Provinsi Jatim",
      pembina: "Ustadz M. Ridwan & Tim Hadrah Salaf",
      schedule: "Malam Jumat & Selasa Malam (Ba'da Isya)",
      desc: "Pelatihan teknik pukulan terbang klasik banjari, ketukan al-banjari kontemporer, olah vokal sholawat nabi bersanad, dan pembiasaan mahabbaturrasul.",
      features: ["Grup Hadrah Putra & Putri", "Teknik Pukulan Terompah Cepat", "Sering Tampil di Event Akbar"],
      image: "assets/kegiatan_hadrah_santri.jpg"
    },
    {
      id: "ekskul-olahraga",
      name: "Klub Olahraga Santri (Futsal & Bola Voli)",
      category: "Keolahragaan Santri",
      badge: "Kebugaran & Sportivitas",
      pembina: "Ustadz H. Wahyudi & Pembina Olahraga Santri",
      schedule: "Jumat Pagi (06.00 - 07.30) & Sore Rutin",
      desc: "Pembinaan kebugaran jasmani, ketangkasan motorik, dan kekompakan tim melalui olahraga futsal dan bola voli di halaman serbaguna yayasan dengan menjunjung tinggi nilai sportivitas dan ukhuwah islamiyah.",
      features: ["Latihan Futsal & Bola Voli Santri", "Senam Kebugaran Jasmani Rutin", "Turnamen Persahabatan Antar-Madrasah"],
      image: "assets/kegiatan_olahraga_santri.jpg"
    },
    {
      id: "ekskul-qiroah",
      name: "Seni Baca Al-Qur'an (Qira'ah / MTQ)",
      category: "Tilawah & Nagham Qur'an",
      badge: "Nagham 7 Maqam",
      pembina: "Ustadz H. M. Basyir (Qari' Tingkat Nasional)",
      schedule: "Senin & Kamis Sore (16.00 - 17.30 WIB)",
      desc: "Bimbingan lagu tilawah Al-Qur'an tartil dan nagham bersanad (Bayyati, Shoba, Hijaz, Nahawand, Rast, Sika, Jiharkah) untuk persiapan duta MTQ madrasah.",
      features: ["Talaqqi Nagham Bersanad", "Bimbingan Vokal Nafas Panjang", "Duta MTQ Kabupaten & Jatim"],
      image: "assets/kegiatan_qiroah_santri.jpg"
    },
    {
      id: "ekskul-multimedia",
      name: "Santri Media Club & Desain Grafis",
      category: "Teknologi & Dakwah Kreatif",
      badge: "Lab Komputer CBT & Multimedia",
      pembina: "Tim Biro Humas & IT Yayasan",
      schedule: "Rabu Sore & Praktik Studio Sabtu Malam",
      desc: "Pelatihan sinematografi film pendek santri, editing video reels dakwah, fotografi jurnalistik, desain poster dakwah Adobe & Canva, serta penulisan artikel warta.",
      features: ["Produksi Short Movie Santri", "Live Streaming Pengajian Akbar", "Kreator Konten Islami Moderat"],
      image: "assets/kegiatan_multimedia_santri.jpg"
    },
    {
      id: "ekskul-roan",
      name: "Ro'an & Budaya Khidmah Asrama",
      category: "Karakter & Kebersihan Pesantren",
      badge: "Kebersihan Sebagian dari Iman",
      pembina: "Lurah Pondok & Dewan Asatidz Pembina Asrama",
      schedule: "Setiap Jumat Pagi & Ahad Bersih (06.30 - 08.00 WIB)",
      desc: "Pembiasaan gotong royong merawat mushola, asrama, dan taman pesantren sebagai sarana riyadhah batin, menumbuhkan jiwa tawadhu', dan persaudaraan santri.",
      features: ["Gotong Royong Asrama Sehat", "Taman Asri & Penghijauan", "Riyadhah Keikhlasan Berkhidmah"],
      image: "assets/kegiatan_roan_santri.jpg"
    }
  ],

  // Kotak Pesan Masuk / Contact Inquiries (PRD 5.2 K & 6.2 Modul 8)
  contactMessages: [
    {
      id: "msg-101",
      date: "11 Sep 2026, 10:15",
      name: "H. Abdullah Shodiq",
      whatsapp: "081234567891",
      email: "abdullah.shodiq@gmail.com",
      unit: "KBIHU Haji & Umrah",
      subject: "Informasi Pendaftaran Manasik Haji Reguler 2027",
      message: "Assalamu'alaikum, mohon info jadwal pendaftaran bimbingan manasik haji KBIHU Raudlatul Muta'allimin untuk pemberangkatan 2027 dan rincian pertemuannya. Terima kasih.",
      status: "Baru"
    },
    {
      id: "msg-102",
      date: "10 Sep 2026, 16:30",
      name: "Ibu Siti Marhamah",
      whatsapp: "085678901234",
      email: "marhamah.siti@yahoo.com",
      unit: "MA Raudlatul Muta'allimin",
      subject: "Konsultasi Asrama Santriwati Putri & Program Beasiswa",
      message: "Bismillah, putri kami lulusan MTs di Tuban dan memiliki hafalan 8 juz. Apakah di MA tersedia kuota beasiswa tahfidz dan bagaimana prosedur survei asrama putrinya?",
      status: "Dihubungi"
    }
  ],

  // Testimoni Santri, Alumni & Wali (Terverifikasi & Termoderasi)
  testimonials: [
    {
      id: "test-1",
      name: "Muhammad Ilham Pratama, S.Ked",
      role: "Alumni SMA IPA (2021) - Dokter Muda FK Unair",
      category: "alumni",
      verifiedText: "Terverifikasi Alumni SMA",
      whatsapp: "081234567890",
      rating: 5,
      quote: "Belajar di Raudlatul Muta'allimin memberikan bekal spiritual yang menenangkan sekaligus persiapan akademik sains yang sangat matang untuk bersaing di fakultas kedokteran favorit.",
      avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80",
      status: "approved",
      submittedAt: "10 Agustus 2026, 14:15"
    },
    {
      id: "test-2",
      name: "Ustzh. Siti Halimah, Lc",
      role: "Alumni MA (2020) - Lulusan Universitas Al-Azhar Kairo",
      category: "alumni",
      verifiedText: "Terverifikasi Alumni MA",
      whatsapp: "081298765432",
      rating: 5,
      quote: "Penggemblengan Nahwu Shorof di Madin dan bimbingan LPBA sangat membantu saya saat tes beasiswa ke Mesir. Sanad keilmuan yang diajarkan para asatidz begitu kokoh.",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
      status: "approved",
      submittedAt: "15 Agustus 2026, 09:30"
    },
    {
      id: "test-3",
      name: "Drs. H. Bambang Sudarsono",
      role: "Wali Santri MTs & MA (Surabaya)",
      category: "wali",
      verifiedText: "Terverifikasi Wali Santri",
      whatsapp: "081345678901",
      rating: 5,
      quote: "Sebagai orang tua, kami merasa sangat tenang. Anak kami mandiri, adabnya santun kepada orang tua, dan hafalannya terus bertambah setiap semester. Fasilitas asramanya juga sangat bersih.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
      status: "approved",
      submittedAt: "28 Agustus 2026, 16:45"
    }
  ],

  // Leads & Pendaftaran Calon Santri Baru (PPDB)
  leads: [
    {
      regNumber: "REG-2026-0101",
      date: "11 Sep 2026, 14:20",
      fullName: "Ahmad Rayhan Al-Ghifari",
      gender: "Laki-laki",
      birthPlaceDate: "Lamongan, 12 Mei 2011",
      parentName: "Bpk. Hendra Gunawan",
      whatsapp: "081388992211",
      email: "hendra.g@gmail.com",
      unit: "MA (Madrasah Aliyah) Raudlatul Muta'allimin",
      isBoarding: true,
      boardingStatus: "Mondok (Santri Mukim)",
      boardingWing: "Pondok Pesantren Putra",
      program: "Kombinasi Tahfidz & Penguatan Sains/Akademik",
      address: "Babat, Lamongan",
      status: "Baru",
      notes: "Siswa berprestasi juara olimpiade sains SMP.",
      documents: {
        pasfoto: { name: "Pasfoto_Ahmad_Rayhan.jpg", type: "image/jpeg", size: 184500, dataUrl: "assets/pasfoto_ahmad_rayhan.jpg", uploadedAt: "11 Sep 2026, 14:22" },
        kk: { name: "KK_Hendra_Gunawan.svg", type: "image/svg+xml", size: 245000, dataUrl: "assets/sample_dokumen_kk.svg", uploadedAt: "11 Sep 2026, 14:23" },
        akta: { name: "Akta_Kelahiran_Ahmad_Rayhan.svg", type: "image/svg+xml", size: 215000, dataUrl: "assets/sample_dokumen_akta.svg", uploadedAt: "11 Sep 2026, 14:24" },
        ktp: { name: "KTP_Hendra_Gunawan.svg", type: "image/svg+xml", size: 165000, dataUrl: "assets/sample_dokumen_ktp.svg", uploadedAt: "11 Sep 2026, 14:25" },
        ijazah: { name: "Ijazah_SMP_Ahmad_Rayhan.svg", type: "image/svg+xml", size: 285000, dataUrl: "assets/sample_dokumen_ijazah.svg", uploadedAt: "11 Sep 2026, 14:26" }
      }
    },
    {
      regNumber: "REG-2026-0102",
      date: "10 Sep 2026, 09:15",
      fullName: "Naila Salsabila",
      gender: "Perempuan",
      birthPlaceDate: "Tuban, 20 Agustus 2019",
      parentName: "Ibu Rahmawati",
      whatsapp: "085711223344",
      email: "rahma.wati@yahoo.com",
      unit: "MI (Madrasah Ibtidaiyah) Raudlatul Muta'allimin",
      isBoarding: false,
      boardingStatus: "Tidak Mondok (Siswa Non-Mukim)",
      boardingWing: "-",
      program: "Siswa Non-Mukim",
      address: "Widang, Tuban",
      status: "Diverifikasi",
      notes: "Sudah hafal juz 'Amma saat di TK. Menggunakan antar-jemput.",
      documents: {
        pasfoto: { name: "Pasfoto_Naila_Salsabila.jpg", type: "image/jpeg", size: 172000, dataUrl: "assets/pasfoto_naila_salsabila.jpg", uploadedAt: "10 Sep 2026, 09:18" },
        kk: { name: "KK_Rahmawati.svg", type: "image/svg+xml", size: 245000, dataUrl: "assets/sample_dokumen_kk.svg", uploadedAt: "10 Sep 2026, 09:19" },
        akta: { name: "Akta_Naila_Salsabila.svg", type: "image/svg+xml", size: 215000, dataUrl: "assets/sample_dokumen_akta.svg", uploadedAt: "10 Sep 2026, 09:20" },
        ktp: { name: "KTP_Ibu_Rahmawati.svg", type: "image/svg+xml", size: 165000, dataUrl: "assets/sample_dokumen_ktp.svg", uploadedAt: "10 Sep 2026, 09:21" },
        ijazah: { name: "Ijazah_TK_Naila.svg", type: "image/svg+xml", size: 285000, dataUrl: "assets/sample_dokumen_ijazah.svg", uploadedAt: "10 Sep 2026, 09:22" }
      }
    },
    {
      regNumber: "REG-2026-0103",
      date: "09 Sep 2026, 16:45",
      fullName: "Muhammad Fikri Pratama",
      gender: "Laki-laki",
      birthPlaceDate: "Bojonegoro, 05 Maret 2014",
      parentName: "H. Mustofa Kamal",
      whatsapp: "082144556677",
      email: "mustofa.kamal@gmail.com",
      unit: "MTs (Madrasah Tsanawiyah) Raudlatul Muta'allimin",
      isBoarding: true,
      boardingStatus: "Mondok (Santri Mukim)",
      boardingWing: "Pondok Pesantren Putra",
      program: "Kajian Kitab Kuning Turats Salafiyah (Nahwu, Shorof & Fiqih)",
      address: "Baureno, Bojonegoro",
      status: "Diterima",
      notes: "Telah menyelesaikan verifikasi berkas dan tes baca Al-Qur'an.",
      documents: {
        pasfoto: { name: "Pasfoto_Fikri_Pratama.jpg", type: "image/jpeg", size: 168000, dataUrl: "assets/pasfoto_fikri_pratama.jpg", uploadedAt: "09 Sep 2026, 16:48" },
        kk: { name: "KK_Mustofa_Kamal.svg", type: "image/svg+xml", size: 245000, dataUrl: "assets/sample_dokumen_kk.svg", uploadedAt: "09 Sep 2026, 16:49" },
        akta: { name: "Akta_Fikri_Pratama.svg", type: "image/svg+xml", size: 215000, dataUrl: "assets/sample_dokumen_akta.svg", uploadedAt: "09 Sep 2026, 16:50" },
        ktp: { name: "KTP_Mustofa_Kamal.svg", type: "image/svg+xml", size: 165000, dataUrl: "assets/sample_dokumen_ktp.svg", uploadedAt: "09 Sep 2026, 16:51" },
        ijazah: { name: "Ijazah_SD_Fikri.svg", type: "image/svg+xml", size: 285000, dataUrl: "assets/sample_dokumen_ijazah.svg", uploadedAt: "09 Sep 2026, 16:52" }
      }
    }
  ],

  // 19. DAFTAR AKUN PENGELOLA & HAK AKSES (ROLE-BASED ACCESS CONTROL / RBAC)
  adminUsers: [
    {
      id: "usr-superadmin",
      username: "admin",
      password: "admin123",
      name: "Pimpinan Yayasan (Super Admin)",
      role: "superadmin",
      roleName: "Super Admin (Penuh)",
      status: "active",
      avatar: "👑",
      unitId: null,
      email: "sekretariat@ytpai-lamongan.sch.id",
      createdAt: "2026-09-01"
    },
    {
      id: "usr-kbihu",
      username: "adminkbihu",
      password: "kbihu123",
      name: "Pengelola KBIHU Haji & Umrah",
      role: "kbihu",
      roleName: "Admin KBIHU",
      status: "active",
      avatar: "🕋",
      unitId: "kbihu",
      email: "kbihu@ytpai-lamongan.sch.id",
      createdAt: "2026-09-01"
    },
    {
      id: "usr-lbb",
      username: "adminlbb",
      password: "lbb123",
      name: "Pengelola LBB & Bimbingan TKA",
      role: "lbb",
      roleName: "Admin LBB",
      status: "active",
      avatar: "🚀",
      unitId: "lbb",
      email: "lbb@ytpai-lamongan.sch.id",
      createdAt: "2026-09-01"
    },
    {
      id: "usr-mts",
      username: "admin_mts",
      password: "mts123",
      name: "Tata Usaha MTs Raudlatul Muta'allimin",
      role: "unit_mts",
      roleName: "Admin MTs",
      status: "active",
      avatar: "📖",
      unitId: "mts",
      email: "mts@ytpai-lamongan.sch.id",
      createdAt: "2026-09-01"
    },
    {
      id: "usr-smp",
      username: "admin_smp",
      password: "smp123",
      name: "Tata Usaha SMP Raudlatul Muta'allimin",
      role: "unit_smp",
      roleName: "Admin SMP",
      status: "active",
      avatar: "🔬",
      unitId: "smp",
      email: "smp@ytpai-lamongan.sch.id",
      createdAt: "2026-09-01"
    },
    {
      id: "usr-ma",
      username: "admin_ma",
      password: "ma123",
      name: "Tata Usaha MA Raudlatul Muta'allimin",
      role: "unit_ma",
      roleName: "Admin MA",
      status: "active",
      avatar: "🕌",
      unitId: "ma",
      email: "ma@ytpai-lamongan.sch.id",
      createdAt: "2026-09-01"
    },
    {
      id: "usr-sma",
      username: "admin_sma",
      password: "sma123",
      name: "Tata Usaha SMA Raudlatul Muta'allimin",
      role: "unit_sma",
      roleName: "Admin SMA",
      status: "active",
      avatar: "🎓",
      unitId: "sma",
      email: "sma@ytpai-lamongan.sch.id",
      createdAt: "2026-09-01"
    },
    {
      id: "usr-mi",
      username: "admin_mi",
      password: "mi123",
      name: "Tata Usaha MI Raudlatul Muta'allimin",
      role: "unit_mi",
      roleName: "Admin MI",
      status: "active",
      avatar: "🎒",
      unitId: "mi",
      email: "mi@ytpai-lamongan.sch.id",
      createdAt: "2026-09-01"
    },
    {
      id: "usr-tk",
      username: "admin_tk",
      password: "tk123",
      name: "Pengelola TK Raudlatul Muta'allimin",
      role: "unit_tk",
      roleName: "Admin TK",
      status: "active",
      avatar: "🎈",
      unitId: "tk",
      email: "tk@ytpai-lamongan.sch.id",
      createdAt: "2026-09-01"
    },
    {
      id: "usr-kb",
      username: "admin_kb",
      password: "kb123",
      name: "Pengelola KB Raudlatul Muta'allimin",
      role: "unit_kb",
      roleName: "Admin KB",
      status: "active",
      avatar: "👶",
      unitId: "kb",
      email: "kb@ytpai-lamongan.sch.id",
      createdAt: "2026-09-01"
    },
    {
      id: "usr-madin",
      username: "admin_madin",
      password: "madin123",
      name: "Pengurus Madrasah Diniyah Takmiliyah",
      role: "unit_madin",
      roleName: "Admin Madin",
      status: "active",
      avatar: "📜",
      unitId: "madin",
      email: "madin@ytpai-lamongan.sch.id",
      createdAt: "2026-09-01"
    },
    {
      id: "usr-lpba",
      username: "admin_lpba",
      password: "lpba123",
      name: "Pengurus LPBA Bahasa Asing",
      role: "unit_lpba",
      roleName: "Admin LPBA",
      status: "active",
      avatar: "🌐",
      unitId: "lpba",
      email: "lpba@ytpai-lamongan.sch.id",
      createdAt: "2026-09-01"
    },
    {
      id: "usr-ponpes",
      username: "admin_ponpes",
      password: "ponpes123",
      name: "Pengurus Pondok Pesantren & Asrama",
      role: "unit_boarding",
      roleName: "Admin Pondok Pesantren",
      status: "active",
      avatar: "🏰",
      unitId: "boarding",
      email: "ponpes@ytpai-lamongan.sch.id",
      createdAt: "2026-09-01"
    }
  ],

  // 20. PUSAT PERENCANAAN & PENAMBAHAN FITUR (FEATURE ROADMAP & MAINTENANCE)
  featureRoadmap: [
    {
      id: "feat-01",
      title: "Notifikasi Otomatis WhatsApp PSB",
      category: "PSB & Kesiswaan",
      status: "Aktif",
      priority: "Tinggi",
      description: "Pesan konfirmasi langsung ke nomor WA pendaftar dan notifikasi ke HP panitia setelah santri baru mengisi formulir.",
      updatedAt: "18 Sep 2026"
    },
    {
      id: "feat-02",
      title: "Cetak Kartu Ujian & Formulir Registrasi",
      category: "Akademik",
      status: "Siap Digunakan",
      priority: "Tinggi",
      description: "Fasilitas cetak bukti formulir pendaftaran dan kartu tes santri baru dengan kop resmi yayasan beresolusi tinggi.",
      updatedAt: "18 Sep 2026"
    },
    {
      id: "feat-03",
      title: "Mode Ramah HP Jadul (Ultra Lightweight Mobile)",
      category: "Performa & Mobile",
      status: "Optimal",
      priority: "Sedang",
      description: "Kompresi aset visual dan tata letak responsif adaptif khusus layar smartphone dengan konsumsi data minim.",
      updatedAt: "18 Sep 2026"
    },
    {
      id: "feat-04",
      title: "Sinkronisasi Cloud Backup Google Drive / Spreadsheet",
      category: "Sistem & Keamanan",
      status: "Dalam Perencanaan",
      priority: "Sedang",
      description: "Integrasi pencadangan otomatis data santri dan berita ke Google Sheet cloud backup secara berkala.",
      updatedAt: "18 Sep 2026"
    }
  ],

  // 19. ANALITIK TRAFIK KUNJUNGAN & ASAL WILAYAH PENGUNJUNG
  analytics: {
    totalViews: 12480,
    uniqueVisitors: 6820,
    todayViews: 142,
    todayUnique: 98,
    devices: {
      mobile: 82,
      desktop: 15,
      tablet: 3
    },
    sources: [
      { name: "WhatsApp PSB", count: 5420, percent: 43.4, icon: "💬", color: "#10B981" },
      { name: "Direct / Ketik URL", count: 3120, percent: 25.0, icon: "🌐", color: "#3B82F6" },
      { name: "Google Pencarian", count: 2360, percent: 18.9, icon: "🔍", color: "#F59E0B" },
      { name: "Instagram & Sosmed", count: 1580, percent: 12.7, icon: "📸", color: "#EC4899" }
    ],
    cities: [
      { name: "Lamongan & Babat", region: "Jawa Timur", count: 5240, percent: 42.0, isLocal: true },
      { name: "Tuban", region: "Jawa Timur", count: 2860, percent: 22.9, isLocal: false },
      { name: "Bojonegoro", region: "Jawa Timur", count: 1840, percent: 14.7, isLocal: false },
      { name: "Gresik", region: "Jawa Timur", count: 980, percent: 7.9, isLocal: false },
      { name: "Surabaya & Sidoarjo", region: "Jawa Timur", count: 820, percent: 6.6, isLocal: false },
      { name: "Jabodetabek / Luar Jatim", region: "Nasional", count: 740, percent: 5.9, isLocal: false }
    ],
    pages: [
      { path: "psb.html", title: "Pendaftaran Santri Baru (PSB Online)", views: 4320 },
      { path: "index.html", title: "Beranda Utama Yayasan", views: 3890 },
      { path: "index.html#pesantren", title: "Pondok Pesantren Putra & Putri", views: 1650 },
      { path: "lbb.html", title: "LBB Sukses PTN & Laboratorium CBT", views: 1340 },
      { path: "kbihu.html", title: "Bimbingan Haji & Umrah KBIHU", views: 780 },
      { path: "prestasi.html", title: "Etalase Prestasi Santri", views: 500 }
    ],
    recentLogs: [
      { timestamp: "2026-09-18 07:35:12", page: "Pendaftaran Santri Baru (PSB)", city: "Babat, Lamongan", device: "Mobile (Android)", source: "WhatsApp PSB" },
      { timestamp: "2026-09-18 07:22:45", page: "Beranda Utama", city: "Tuban Kota", device: "Mobile (iPhone)", source: "Google Search" },
      { timestamp: "2026-09-18 07:14:02", page: "Pondok Pesantren Putra", city: "Bojonegoro", device: "Mobile (Android)", source: "Instagram" },
      { timestamp: "2026-09-18 06:58:30", page: "LBB Sukses PTN", city: "Lamongan Kota", device: "Desktop (Windows)", source: "Direct Link" },
      { timestamp: "2026-09-18 06:40:18", page: "Pendaftaran Santri Baru (PSB)", city: "Gresik", device: "Mobile (Android)", source: "WhatsApp PSB" }
    ]
  },

  // Galeri Kehormatan Tasmik 5 Juz Al-Qur'an (Didampingi Orang Tua & Mandiri Asrama)
  tasmikRecords: [
    {
      id: "tasmik-1",
      name: "Muhammad Nabil Al-Faruq",
      unit: "MTs Raudlatul Muta'allimin • Pondok Putra",
      juz: "Juz 1 – 5 Bil Ghaib",
      juzRange: "1-5",
      accompaniment: "parent",
      accompanimentLabel: "Didampingi Orang Tua",
      parentInfo: "Bpk. H. Sukardi & Ibu Hj. Siti Aminah",
      tester: "Ustadz H. Ahmad Muzammil, Al-Hafidz",
      predicate: "Mumtaz (Istimewa)",
      date: "14 September 2026",
      image: "assets/tahfidz_quran_pesantren.jpg",
      notes: "Ujian Tasmik 5 Juz sekali duduk selama 3 jam dengan fashohah dan tajwid makharijul huruf yang sangat baik. Dihadiri langsung oleh kedua orang tua yang menyematkan syahadah tahfidz."
    },
    {
      id: "tasmik-2",
      name: "Aisyah Nur Ramadhani",
      unit: "SMP Raudlatul Muta'allimin • Pondok Putri",
      juz: "Juz 1 – 5 Bil Ghaib",
      juzRange: "1-5",
      accompaniment: "parent",
      accompanimentLabel: "Didampingi Orang Tua",
      parentInfo: "Bpk. Drs. H. Bambang Irawan & Ibu Farida, S.Pd",
      tester: "Ustadzah Hj. Nurul Hidayati, Al-Hafidzah",
      predicate: "Mumtaz (Istimewa)",
      date: "10 September 2026",
      image: "assets/hero_santri.jpg",
      notes: "Mampu melantunkan ayat suci Juz 1-5 dengan nada bayyati dan nahawand yang tartil. Kedua orang tua terharu meneteskan air mata bahagia saat prosesi penyerahan syahadah."
    },
    {
      id: "tasmik-3",
      name: "Ahmad Zainal Arifin",
      unit: "MA Raudlatul Muta'allimin • Pondok Putra",
      juz: "Juz 26 – 30 Bil Ghaib",
      juzRange: "26-30",
      accompaniment: "independent",
      accompanimentLabel: "Mandiri (Santri Asrama)",
      parentInfo: "Wali Santri di Luar Pulau (Didampingi Musyrif Asrama)",
      tester: "Ustadz M. Shodiq, S.Pd.I, Al-Hafidz",
      predicate: "Jayyid Jiddan (Sangat Baik)",
      date: "05 September 2026",
      image: "assets/berita_santri_prestasi.jpg",
      notes: "Santri mukim asal Kalimantan Barat yang berjuang mandiri di asrama pondok. Didampingi jajaran asatidz asrama dan pengasuh pondok putra saat kelulusan tasmik 5 juz bil-ghaib."
    },
    {
      id: "tasmik-4",
      name: "Fathimah Az-Zahra",
      unit: "SMA Raudlatul Muta'allimin • Pondok Putri",
      juz: "Juz 6 – 10 Bil Ghaib",
      juzRange: "6-10",
      accompaniment: "parent",
      accompanimentLabel: "Didampingi Orang Tua",
      parentInfo: "Bpk. H. Masruri & Ibu Hj. Khodijah",
      tester: "Ustadzah Siti Fatimah, M.Ag, Al-Hafidzah",
      predicate: "Mumtaz (Istimewa)",
      date: "28 Agustus 2026",
      image: "assets/tahfidz_quran_pesantren.jpg",
      notes: "Setoran 5 Juz lanjutan (Juz 6-10) sekali duduk tanpa keliru harakat. Ayahanda dan Ibunda mendampingi sepanjang sesi tasmik di Mushola Pondok Pesantren Putri."
    },
    {
      id: "tasmik-5",
      name: "Muhammad Rayhan Pratama",
      unit: "SMP Raudlatul Muta'allimin • Pondok Putra",
      juz: "Juz 1 – 5 Bil Ghaib",
      juzRange: "1-5",
      accompaniment: "independent",
      accompanimentLabel: "Mandiri (Santri Asrama)",
      parentInfo: "Keluarga Perantau (Didampingi Pembina Halaqah)",
      tester: "Ustadz H. Ahmad Muzammil, Al-Hafidz",
      predicate: "Mumtaz (Istimewa)",
      date: "22 Agustus 2026",
      image: "assets/hero_santri.jpg",
      notes: "Meskipun orang tua bekerja di perantauan dan berhalangan hadir secara fisik, ananda membuktikan keteguhan santri asrama dengan menuntaskan 5 juz mutqin didampingi pembina halaqah."
    },
    {
      id: "tasmik-6",
      name: "Nabila Syarifah Khairunnisa",
      unit: "MTs Raudlatul Muta'allimin • Pondok Putri",
      juz: "Juz 1 – 5 Bil Ghaib",
      juzRange: "1-5",
      accompaniment: "parent",
      accompanimentLabel: "Didampingi Orang Tua",
      parentInfo: "Bpk. M. Ridwan & Ibu Tri Wahyuni",
      tester: "Ustadzah Hj. Nurul Hidayati, Al-Hafidzah",
      predicate: "Jayyid Jiddan (Sangat Baik)",
      date: "15 Agustus 2026",
      image: "assets/unit_mts_photo.jpg",
      notes: "Khatam setoran 5 juz bil-ghaib di hadapan dewan penguji dan disaksikan orang tua. Diberikan mahkota simbolik dan syahadah kehormatan tahfidz yayasan."
    }
  ],

  // Majelis Muassis & Masyayikh Pendiri Pesantren (1984)
  muassis: [
    {
      id: "muassis-1",
      name: "KH. Sholeh Al-Ayyubi",
      honorific: "Muassis Pesantren",
      role: "Perintis & Sesepuh Pendiri (1984)",
      photo: "assets/muassis_sholeh_ayyubi.png",
      period: "1984 - Perintis Awal",
      desc: "Salah satu ulama sesepuh perintis peletakan batu pertama berdirinya pondok pesantren di Dusun Tegalrejo, Babat, Lamongan."
    },
    {
      id: "muassis-2",
      name: "KH. Sufyan",
      honorific: "Muassis Pesantren",
      role: "Perintis & Sesepuh Pendiri (1984)",
      photo: "assets/muassis_sufyan.png",
      period: "1984 - Perintis Awal",
      desc: "Tokoh ulama sesepuh pendiri yang memperkokoh pondasi keilmuan syariat, tradisi kitab turats, dan kelembagaan awal pesantren."
    },
    {
      id: "muassis-3",
      name: "KH. Moh Farhan Saa.",
      honorific: "Muassis Pesantren",
      role: "Perintis & Sesepuh Pendiri (1984)",
      photo: "assets/muassis_farhan_saa.png",
      period: "1984 - Perintis Awal",
      desc: "Tokoh perintis yang mendedikasikan perjuangan dalam pembentukan madrasah, dakwah keumatan, dan kaderisasi santri."
    },
    {
      id: "muassis-4",
      name: "KH. Mas'ud Lathief",
      honorific: "Al-Maghfurlah",
      role: "Muassis & Masyayikh Sepuh",
      photo: "assets/muassis_masud_lathief.png",
      period: "Sesepuh & Masyayikh",
      desc: "Ulama kharismatik yang menorehkan keteladanan spiritual luhur, sanad keilmuan, dan untaian doa bagi kemaslahatan santri."
    },
    {
      id: "muassis-5",
      name: "KH. Moh. Sa'dullah Al-Ayyubi",
      honorific: "Muassis Pesantren",
      role: "Perintis & Sesepuh Pendiri (1984)",
      photo: "assets/muassis_sadullah_ayyubi.png",
      period: "1984 - Perintis Awal",
      desc: "Ulama sesepuh perintis yang mendedikasikan keteladanan ilmu syariat, pembinaan akhlak santri, dan penguatan nilai-nilai salafiyah di Babat Lamongan."
    }
  ],
  dailySchedules: [
    { id: "sched-1", time: "03.30 – 04.30", activity: "Bangun pagi, mandi, sholat Tahajud, Hajat, dan wirid pembacaan dzikir fajar di Mushola Pondok Pesantren Putra", order: 1 },
    { id: "sched-2", time: "04.30 – 05.15", activity: "Sholat Subuh berjamaah dan pembacaan Ratib Al-Haddad / Hizib Nashor", order: 2 },
    { id: "sched-3", time: "05.15 – 06.15", activity: "Halaqah Al-Qur'an pagi: setoran tahfidz sanad, binnadhor, dan sorogan tajwid", order: 3 },
    { id: "sched-4", time: "06.15 – 07.15", activity: "Sholat Dhuha berjamaah, makan pagi santri, dan persiapan masuk kelas formal", order: 4 },
    { id: "sched-5", time: "07.15 – 12.00", activity: "Kegiatan Belajar Mengajar (KBM) Sekolah/Madrasah Formal (MI, MTs, SMP, MA, SMA)", order: 5 },
    { id: "sched-6", time: "12.00 – 13.00", activity: "Sholat Dhuhur berjamaah di Mushola Pondok Pesantren Putra dilanjutkan makan siang santri", order: 6 },
    { id: "sched-7", time: "13.00 – 14.30", activity: "Lanjutan KBM formal / Istirahat siang (Qoilulah Sunnah) di asrama", order: 7 },
    { id: "sched-8", time: "14.30 – 15.30", activity: "Persiapan & Sholat Ashar berjamaah", order: 8 },
    { id: "sched-9", time: "15.30 – 17.00", activity: "Pengajian Kitab Kuning Madrasah Diniyah Salaf / Ekstrakurikuler Bahasa Arab-Inggris & Olahraga", order: 9 },
    { id: "sched-10", time: "17.00 – 17.45", activity: "Mandi sore, berpakaian rapi jubah/busana muslim, dan persiapan menuju Mushola Pondok Pesantren Putra", order: 10 },
    { id: "sched-11", time: "17.45 – 18.30", activity: "Sholat Maghrib berjamaah, pembacaan Waqi'ah, dan Shalawat Burdah", order: 11 },
    { id: "sched-12", time: "18.30 – 19.30", activity: "Sorogan & Bandongan Kitab Kuning bersama Dewan Masyayikh / Asatidz pengasuh", order: 12 },
    { id: "sched-13", time: "19.30 – 20.15", activity: "Sholat Isya' berjamaah dilanjutkan makan malam santri", order: 13 },
    { id: "sched-14", time: "20.15 – 22.00", activity: "Belajar mandiri terbimbing (Tatsqif), musyawarah pelajaran, dan percakapan bahasa asing", order: 14 },
    { id: "sched-15", time: "22.00 – 03.30", activity: "Istirahat malam, lampu asrama dipadamkan demi menjaga stamina santri", order: 15 }
  ]
};

// Database Access & Persistence Layer
const STORAGE_KEY = 'ytpai_database_v1';

function getDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_YAYASAN_DATA));
      return JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA));
    }
    const parsed = JSON.parse(raw);
    if (!parsed.heroSlides || parsed.heroSlides.length < 4 || !parsed.heroSlides.some(s => s.image && s.image.includes('hero_belajar_santri.jpg')) || parsed.heroSlides.some(s => s.image && s.image.includes('program_overview.png'))) {
      parsed.heroSlides = DEFAULT_YAYASAN_DATA.heroSlides;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    if (!parsed.news || parsed.news.length < 5 || !parsed.news[0].content) {
      parsed.news = DEFAULT_YAYASAN_DATA.news;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate official Yayasan Visi & Misi if older cached version detected
    if (!parsed.meta || !parsed.meta.missionList || parsed.meta.vision !== DEFAULT_YAYASAN_DATA.meta.vision || !parsed.meta.address || parsed.meta.address.includes("Hasyim Asy'ari")) {
      parsed.meta = Object.assign({}, parsed.meta || {}, {
        vision: DEFAULT_YAYASAN_DATA.meta.vision,
        mission: DEFAULT_YAYASAN_DATA.meta.mission,
        missionList: DEFAULT_YAYASAN_DATA.meta.missionList,
        address: DEFAULT_YAYASAN_DATA.meta.address
      });
      // Also update hero slide 2 tag if needed
      if (parsed.heroSlides && parsed.heroSlides[1]) {
        parsed.heroSlides[1].title = DEFAULT_YAYASAN_DATA.heroSlides[1].title;
        parsed.heroSlides[1].tag = DEFAULT_YAYASAN_DATA.heroSlides[1].tag;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate accurate Google Maps location if missing or pointing to generic Lamongan regency
    if (!parsed.meta || !parsed.meta.mapsUrl || !parsed.meta.mapsEmbedUrl || parsed.meta.mapsEmbedUrl.includes('Kabupaten%20Lamongan')) {
      if (!parsed.meta) parsed.meta = Object.assign({}, DEFAULT_YAYASAN_DATA.meta);
      parsed.meta.mapsUrl = DEFAULT_YAYASAN_DATA.meta.mapsUrl;
      parsed.meta.mapsEmbedUrl = DEFAULT_YAYASAN_DATA.meta.mapsEmbedUrl;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate default WhatsApp contact to active official number (0856-4884-7070)
    if (!parsed.meta || !parsed.meta.whatsapp || parsed.meta.whatsappClean !== '6285648847070') {
      if (!parsed.meta) parsed.meta = Object.assign({}, DEFAULT_YAYASAN_DATA.meta);
      parsed.meta.phone = DEFAULT_YAYASAN_DATA.meta.phone;
      parsed.meta.phoneClean = DEFAULT_YAYASAN_DATA.meta.phoneClean;
      parsed.meta.whatsapp = DEFAULT_YAYASAN_DATA.meta.whatsapp;
      parsed.meta.whatsappClean = DEFAULT_YAYASAN_DATA.meta.whatsappClean;
      parsed.meta.address = DEFAULT_YAYASAN_DATA.meta.address;
      parsed.meta.slogan = DEFAULT_YAYASAN_DATA.meta.slogan;
      parsed.meta.runningText = DEFAULT_YAYASAN_DATA.meta.runningText;
      parsed.psbWaveConfig = Object.assign({}, DEFAULT_YAYASAN_DATA.psbWaveConfig);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate SPMB 2027/2028 wave schedule and address
    if (parsed.psbWaveConfig && parsed.psbWaveConfig.academicYear !== 'T.A. 2027/2028') {
      parsed.psbWaveConfig = Object.assign({}, DEFAULT_YAYASAN_DATA.psbWaveConfig);
      if (parsed.meta) {
        parsed.meta.address = DEFAULT_YAYASAN_DATA.meta.address;
        parsed.meta.slogan = DEFAULT_YAYASAN_DATA.meta.slogan;
        parsed.meta.runningText = DEFAULT_YAYASAN_DATA.meta.runningText;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate institutional Google Gemini API Key & Model if empty or deprecated in localStorage
    if (!parsed.meta || !parsed.meta.geminiApiKey || !parsed.meta.geminiApiKey.trim()) {
      if (!parsed.meta) parsed.meta = Object.assign({}, DEFAULT_YAYASAN_DATA.meta);
      parsed.meta.geminiApiKey = DEFAULT_YAYASAN_DATA.meta.geminiApiKey;
      parsed.meta.chatbotModel = "gemini-3.1-flash-lite";
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    if (parsed.meta) {
      if (!parsed.meta.chatbotModel || parsed.meta.chatbotModel === "gemini-3.6-flash" || parsed.meta.chatbotModel === "gemini-3.1-flash-lite" || parsed.meta.chatbotModel === "gemini-1.5-flash") {
        parsed.meta.chatbotModel = "gemini-3.5-flash-lite";
      }
      if (!parsed.meta.groqApiKey || parsed.meta.groqApiKey.trim() === '' || !parsed.meta.groqApiKey.startsWith('gsk_')) {
        parsed.meta.groqApiKey = DEFAULT_YAYASAN_DATA.meta.groqApiKey;
      }
      if (!parsed.meta.groqModel || parsed.meta.groqModel !== "qwen/qwen3.8-27b") {
        parsed.meta.groqModel = "qwen/qwen3.8-27b";
      }
      if (!parsed.meta.aiProvider) parsed.meta.aiProvider = "hybrid";
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate mascot avatar to official YTPAI HD 2026 character
    if (parsed.meta && (!parsed.meta.chatbotMascot || parsed.meta.chatbotMascot === 'assets/mascot.png' || parsed.meta.chatbotMascot === 'assets/mascot_sticker.png' || parsed.meta.chatbotMascot === 'assets/raudly_avatar_head.png' || parsed.meta.chatbotMascot === 'assets/raudly_avatar_v2.jpg')) {
      parsed.meta.chatbotMascot = "assets/raudly_avatar_hd.png";
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate slide 2 banner to latest official smart assistant artwork
    if (parsed.ppdbGatewaySlides && parsed.ppdbGatewaySlides[1]) {
      parsed.ppdbGatewaySlides[1].image = "assets/banner_ppdb_slide2.jpg?v=smart_asisten_v3";
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate to exact 7 formal units (KB, TK, MI, MTs, SMP, MA, SMA) & 2 boarding wings
    if (!parsed.units || parsed.units.length !== 7 || !parsed.units.some(u => u.id === 'sma') || !parsed.units.some(u => u.id === 'smp')) {
      parsed.units = DEFAULT_YAYASAN_DATA.units;
      parsed.boardingWings = DEFAULT_YAYASAN_DATA.boardingWings;
      if (parsed.meta && parsed.meta.stats) {
        parsed.meta.stats.units = "7 Unit Formal";
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate unit names & categories to strictly standardized [Unit] Raudlatul Muta'allimin
    if (parsed.units && Array.isArray(parsed.units)) {
      let unitChanged = false;
      const cleanNames = {
        'kb': "KB Raudlatul Muta'allimin",
        'tk': "TK Raudlatul Muta'allimin",
        'mi': "MI Raudlatul Muta'allimin",
        'mts': "MTs Raudlatul Muta'allimin",
        'smp': "SMP Raudlatul Muta'allimin",
        'ma': "MA Raudlatul Muta'allimin",
        'sma': "SMA Raudlatul Muta'allimin"
      };
      const cleanCategories = {
        'kb': "PAUD / Kelompok Bermain",
        'tk': "Taman Kanak-Kanak (TK)",
        'mi': "Madrasah Ibtidaiyah (MI)",
        'mts': "Madrasah Tsanawiyah (MTs)",
        'smp': "Sekolah Menengah Pertama (SMP)",
        'ma': "Madrasah Aliyah (MA)",
        'sma': "Sekolah Menengah Atas (SMA)"
      };
      parsed.units.forEach(u => {
        if (cleanNames[u.id] && u.name !== cleanNames[u.id]) {
          u.name = cleanNames[u.id];
          unitChanged = true;
        }
        if (cleanCategories[u.id] && (u.category !== cleanCategories[u.id] || (u.category && u.category.includes('Unggulan')))) {
          u.category = cleanCategories[u.id];
          unitChanged = true;
        }
      });
      if (unitChanged) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    if (!parsed.boardingWings || parsed.boardingWings.length === 0 || !parsed.boardingWings[0].musyrif || parsed.boardingWings[0].image.includes('hero_santri') || (parsed.boardingWings[1] && parsed.boardingWings[1].image.includes('unsplash'))) {
      parsed.boardingWings = DEFAULT_YAYASAN_DATA.boardingWings;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate to include Ruang Karya & Kreativitas Santri
    if (!parsed.studentWorks || parsed.studentWorks.length === 0) {
      parsed.studentWorks = DEFAULT_YAYASAN_DATA.studentWorks;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate leads with boarding status and document photos if older cache detected
    if (!parsed.leads || parsed.leads.length === 0 || typeof parsed.leads[0].isBoarding === 'undefined') {
      parsed.leads = JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.leads));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } else {
      let leadsDocUpdated = false;
      // Ensure at least 3 dummy leads exist
      if (parsed.leads.length < 3) {
        for (let i = parsed.leads.length; i < 3; i++) {
          parsed.leads.push(JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.leads[i])));
          leadsDocUpdated = true;
        }
      }
      // Ensure each lead has complete documents with real photo dataUrls
      parsed.leads.forEach((l, idx) => {
        const refIndex = idx % DEFAULT_YAYASAN_DATA.leads.length;
        const refDocs = DEFAULT_YAYASAN_DATA.leads[refIndex].documents;
        if (!l.documents) {
          l.documents = JSON.parse(JSON.stringify(refDocs));
          leadsDocUpdated = true;
        } else {
          ['pasfoto', 'kk', 'akta', 'ktp', 'ijazah'].forEach(docKey => {
            if (!l.documents[docKey] || (!l.documents[docKey].dataUrl && !l.documents[docKey].url) || (docKey === 'pasfoto' && l.documents[docKey].dataUrl && (l.documents[docKey].dataUrl.includes('belajar_santri') || l.documents[docKey].dataUrl.includes('hero_santri')))) {
              l.documents[docKey] = Object.assign({}, refDocs[docKey], l.documents[docKey] || {});
              l.documents[docKey].dataUrl = refDocs[docKey].dataUrl;
              leadsDocUpdated = true;
            }
          });
        }
      });
      if (leadsDocUpdated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    // Auto-migrate to include Program Unggulan & Khidmah Santri (including Pengurus Pondok Putra & Putri)
    if (!parsed.programs || parsed.programs.length < 7 || !parsed.programs.some(p => p.id === 'prog-pengurus-putra') || !parsed.programs.some(p => p.id === 'prog-pkms') || (parsed.programs[0] && parsed.programs[0].tag && parsed.programs[0].tag.includes('📖'))) {
      parsed.programs = DEFAULT_YAYASAN_DATA.programs;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate facilities to rich schema with authentic Mushola Pondok Putra (Utama) & Mushola Putri (Eksklusif)
    if (!parsed.facilities || parsed.facilities.length < 7 || !parsed.facilities[0].features || !parsed.facilities[0].capacity || parsed.facilities[0].name.includes("Masjid Jami'") || !parsed.facilities.some(f => f.id === 'fac-mushola-putri') || parsed.facilities[0].capacity.includes("1.200") || parsed.facilities[0].capacity.includes("600") || (parsed.facilities[0].fullDesc && parsed.facilities[0].fullDesc.includes("Tarbiyatul Pelajar"))) {
      parsed.facilities = DEFAULT_YAYASAN_DATA.facilities;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate service hours & holiday policy (Sabtu-Kamis 07.00-14.00, Jum'at Libur, Ponpes 24 Jam, & Kajian Alumni)
    if (!parsed.meta || !parsed.meta.serviceHours || parsed.meta.serviceHours.includes("07.30") || !parsed.meta.holiday || !parsed.meta.kajianAlumni) {
      if (!parsed.meta) parsed.meta = Object.assign({}, DEFAULT_YAYASAN_DATA.meta);
      parsed.meta.serviceHours = DEFAULT_YAYASAN_DATA.meta.serviceHours;
      parsed.meta.ponpesHours = DEFAULT_YAYASAN_DATA.meta.ponpesHours;
      parsed.meta.holiday = DEFAULT_YAYASAN_DATA.meta.holiday;
      parsed.meta.kajianAlumni = DEFAULT_YAYASAN_DATA.meta.kajianAlumni;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate extracurriculars
    if (!parsed.extracurriculars || parsed.extracurriculars.length < 6) {
      parsed.extracurriculars = DEFAULT_YAYASAN_DATA.extracurriculars;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate heroSlides to ensure reliable local assets (no broken Unsplash or blurry images)
    if (!parsed.heroSlides || parsed.heroSlides.length < 4 || !parsed.heroSlides[0] || parsed.heroSlides[0].image !== DEFAULT_YAYASAN_DATA.heroSlides[0].image || parsed.heroSlides.some(s => s.image && (s.image.includes('unsplash') || s.image.includes('program_overview') || s.image.includes('program_6') || s.image.includes('hero_santri.jpg')))) {
      parsed.heroSlides = DEFAULT_YAYASAN_DATA.heroSlides;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate hero taglines to 4 stages (Pesantren, PAUD, SMP/MTs, SMA/MA)
    if (!parsed.hero || !parsed.hero.taglines || parsed.hero.taglines.length < 4) {
      parsed.hero = DEFAULT_YAYASAN_DATA.hero;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate units to ensure dedicated local HD images (Distinct photos for KB, TK, MI, MTs, SMP, MA, SMA)
    if (!parsed.units || parsed.units.some(u => u.image && (u.image.includes('unsplash') || u.image.includes('program_overview'))) || !parsed.units.some(u => u.id === 'tk' && u.image.includes('unit_tk_photo')) || !parsed.units.some(u => u.id === 'mts' && u.image.includes('unit_mts_photo'))) {
      parsed.units = DEFAULT_YAYASAN_DATA.units;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate nonFormalUnits (Madin, LPBA, LBB, KBIHU) with updated Mushola Pondok Putra & Service Hours
    if (!parsed.nonFormalUnits || parsed.nonFormalUnits.length < 4 || !parsed.nonFormalUnits.some(n => n.id === 'lbb' && n.openForExternal) || !parsed.nonFormalUnits.some(n => n.id === 'kbihu' && n.isStandalone) || (parsed.nonFormalUnits[3] && parsed.nonFormalUnits[3].office && (parsed.nonFormalUnits[3].office.includes("Masjid Jami'") || parsed.nonFormalUnits[3].office.includes("Mushola Utama Pesantren"))) || (parsed.nonFormalUnits[2] && parsed.nonFormalUnits[2].serviceHours && parsed.nonFormalUnits[2].serviceHours.includes("Senin"))) {
      parsed.nonFormalUnits = DEFAULT_YAYASAN_DATA.nonFormalUnits;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate heroGateway (Gerbang Cepat Hero)
    if (!parsed.heroGateway || !parsed.heroGateway.kbihu || !parsed.heroGateway.lbb) {
      parsed.heroGateway = DEFAULT_YAYASAN_DATA.heroGateway;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate kbihuInfo (Pusat Bimbingan Calon Jamaah Haji & Umrah)
    if (!parsed.kbihuInfo || !parsed.kbihuInfo.whatsapp || !parsed.kbihuInfo.highlights || !parsed.kbihuInfo.gallery) {
      parsed.kbihuInfo = Object.assign({}, DEFAULT_YAYASAN_DATA.kbihuInfo, parsed.kbihuInfo || {});
      parsed.kbihuInfo.highlights = DEFAULT_YAYASAN_DATA.kbihuInfo.highlights;
      if (!parsed.kbihuInfo.gallery || parsed.kbihuInfo.gallery.length === 0) {
        parsed.kbihuInfo.gallery = DEFAULT_YAYASAN_DATA.kbihuInfo.gallery;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    if (!parsed.kbihuInfo.hero || !parsed.kbihuInfo.hero.title) {
      parsed.kbihuInfo.hero = DEFAULT_YAYASAN_DATA.kbihuInfo.hero;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate lbbInfo (LBB Terbuka Siswa Luar & Santri)
    if (!parsed.lbbInfo || !parsed.lbbInfo.whatsapp || !parsed.lbbInfo.highlights || !parsed.lbbInfo.gallery || (parsed.lbbInfo.serviceHours && parsed.lbbInfo.serviceHours.includes("Senin"))) {
      parsed.lbbInfo = Object.assign({}, DEFAULT_YAYASAN_DATA.lbbInfo, parsed.lbbInfo || {});
      parsed.lbbInfo.highlights = DEFAULT_YAYASAN_DATA.lbbInfo.highlights;
      parsed.lbbInfo.serviceHours = DEFAULT_YAYASAN_DATA.lbbInfo.serviceHours;
      if (!parsed.lbbInfo.gallery || parsed.lbbInfo.gallery.length === 0) {
        parsed.lbbInfo.gallery = DEFAULT_YAYASAN_DATA.lbbInfo.gallery;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate hero content (headline, description, buttons)
    if (!parsed.hero || !parsed.hero.headline || !parsed.hero.description) {
      parsed.hero = Object.assign({}, DEFAULT_YAYASAN_DATA.hero, parsed.hero || {});
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate hero taglines
    if (!parsed.hero.taglines || parsed.hero.taglines.length < 3 || (parsed.hero.taglines[0] && parsed.hero.taglines[0].badgeSlogan && parsed.hero.taglines[0].badgeSlogan.includes('Menyemai Aqidah'))) {
      parsed.hero.taglines = DEFAULT_YAYASAN_DATA.hero.taglines;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate coreValues (4 Pilar Nilai Dasar)
    if (!parsed.coreValues || parsed.coreValues.length < 4) {
      parsed.coreValues = DEFAULT_YAYASAN_DATA.coreValues;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate agenda (Jadwal Kegiatan Pesantren)
    if (!parsed.agenda || parsed.agenda.length < 4) {
      parsed.agenda = DEFAULT_YAYASAN_DATA.agenda;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate videoShowcase (Fix unavailable video ID & synchronize)
    if (!parsed.videoShowcase || !parsed.videoShowcase.youtubeId || parsed.videoShowcase.youtubeId === 'dQw4w9WgXcQ') {
      parsed.videoShowcase = Object.assign({}, DEFAULT_YAYASAN_DATA.videoShowcase, parsed.videoShowcase || {});
      parsed.videoShowcase.youtubeId = DEFAULT_YAYASAN_DATA.videoShowcase.youtubeId;
      parsed.videoShowcase.youtubeUrl = DEFAULT_YAYASAN_DATA.videoShowcase.youtubeUrl;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate leadership (Update to authentic Ketua Yayasan & 3 Dewan Pengasuh with respectful ordering: Ketua -> Sekretaris -> Bendahara)
    const hasValidLeadership = parsed.leadership && 
      parsed.leadership.length === 4 && 
      parsed.leadership.some(l => (l.name || '').includes('Shomad')) &&
      parsed.leadership.some(l => (l.name || '').includes('Miftahul Falah')) &&
      parsed.leadership.some(l => (l.name || '').includes('Ghozi')) &&
      parsed.leadership.some(l => (l.name || '').includes('Nuschul Ibad')) &&
      parsed.leadership[1]?.id === 'pengasuh-ketua';
    if (!hasValidLeadership) {
      parsed.leadership = DEFAULT_YAYASAN_DATA.leadership;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } else {
      let leadChanged = false;
      parsed.leadership.forEach(l => {
        if (l.id === 'pengasuh-ketua') {
          if (l.photo === 'assets/pengasuh_miftahul_falah.jpg') {
            l.photo = 'assets/pengasuh_miftahul_falah.jpg?v=seimbang';
            leadChanged = true;
          }
          if (l.speechContent && l.speechContent.includes('Pondok Pesantren YTPAI')) {
            l.speechContent = l.speechContent.replace('Pondok Pesantren YTPAI Raudlatul Muta\'allimin', 'Pondok Pesantren Raudlatul Muta\'allimin Tegalrejo');
            leadChanged = true;
          }
        } else if (l.photo && l.photo.startsWith('assets/') && !l.photo.includes('?v=') && !l.photo.startsWith('data:')) {
          l.photo = l.photo.split('?')[0] + '?v=flag';
          leadChanged = true;
        }
        if (l.photoScale === undefined) {
          l.photoScale = 1.0;
          leadChanged = true;
        }
        if (l.photoOffsetY === undefined) {
          l.photoOffsetY = 0;
          leadChanged = true;
        }
      });
      if (leadChanged) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    // Auto-migrate facilities: sinkronisasi fasilitas riil bebas hiperbola & pembersihan klaim fiktif lama
    if (parsed.facilities && Array.isArray(parsed.facilities)) {
      const isOutdated = parsed.facilities.some(f => 
        (f.capacity && f.capacity.includes('80 PC')) || 
        (f.name && (f.name.includes('Laboratorium Terpadu Sains') || f.name.includes('Graha Serbaguna'))) ||
        !parsed.facilities.some(fac => fac.id === 'fac-asrama') ||
        !parsed.facilities.some(fac => fac.id === 'fac-poskestren')
      );
      if (isOutdated || parsed.facilities.length !== DEFAULT_YAYASAN_DATA.facilities.length) {
        parsed.facilities = JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.facilities));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    // Auto-migrate unit galleries, key stats, facilities, and extracurriculars
    if (parsed.units && Array.isArray(parsed.units)) {
      let unitGalleryMigrated = false;
      parsed.units.forEach(u => {
        const def = DEFAULT_YAYASAN_DATA.units.find(du => du.id === u.id);
        if (def) {
          if (!u.gallery || u.gallery.length < 2 || !u.headmaster) {
            u.gallery = def.gallery;
            u.headmaster = def.headmaster;
            u.quota = def.quota;
            u.studyTime = def.studyTime;
            u.facilities = def.facilities;
            u.extracurriculars = def.extracurriculars;
            unitGalleryMigrated = true;
          }
          if (def.headmasterSpeech && (!u.headmasterSpeech || !u.headmasterPhoto || !u.headmasterSpeechTitle)) {
            u.headmasterPhoto = def.headmasterPhoto;
            u.headmasterSpeechTitle = def.headmasterSpeechTitle;
            u.headmasterSpeech = def.headmasterSpeech;
            unitGalleryMigrated = true;
          }
          if (def.headmasterPhoto && def.headmasterPhoto.includes('assets/kepala_') && u.headmasterPhoto !== def.headmasterPhoto) {
            u.headmasterPhoto = def.headmasterPhoto;
            unitGalleryMigrated = true;
          }
          if (def.leadershipTitle && u.leadershipTitle !== def.leadershipTitle) {
            u.leadershipTitle = def.leadershipTitle;
            unitGalleryMigrated = true;
          }
          if (!u.category || u.category.includes('Formal (')) {
            u.category = def.category;
            unitGalleryMigrated = true;
          }
        }
      });
      if (parsed.boardingWings && Array.isArray(parsed.boardingWings)) {
        parsed.boardingWings.forEach(b => {
          const def = DEFAULT_YAYASAN_DATA.boardingWings.find(db => db.id === b.id);
          if (def) {
            if (!b.gallery || b.gallery.length < 2 || !b.headmaster || (b.fullDesc && (b.fullDesc.includes("Masjid Jami'") || b.fullDesc.includes("Mushola Utama Pesantren")))) {
              b.gallery = def.gallery;
              b.headmaster = def.headmaster;
              b.quota = def.quota;
              b.studyTime = def.studyTime;
              b.facilities = def.facilities;
              b.extracurriculars = def.extracurriculars;
              b.fullDesc = def.fullDesc;
              b.shortDesc = def.shortDesc;
              unitGalleryMigrated = true;
            }
            if (def.headmasterSpeech && (!b.headmasterSpeech || !b.headmasterSpeechTitle || !b.headmasterPhoto || b.headmasterSpeech.includes("Mushola Utama Pesantren") || b.headmasterSpeech.includes("Masjid Jami'"))) {
              b.headmasterPhoto = def.headmasterPhoto;
              b.headmasterSpeechTitle = def.headmasterSpeechTitle;
              b.headmasterSpeech = def.headmasterSpeech;
              unitGalleryMigrated = true;
            }
          }
        });
      }
      if (parsed.nonFormalUnits && Array.isArray(parsed.nonFormalUnits)) {
        const poskestrenDef = DEFAULT_YAYASAN_DATA.nonFormalUnits.find(dn => dn.id === 'poskestren');
        if (poskestrenDef && !parsed.nonFormalUnits.some(n => n.id === 'poskestren')) {
          parsed.nonFormalUnits.push(poskestrenDef);
          unitGalleryMigrated = true;
        }
        parsed.nonFormalUnits.forEach(n => {
          const def = DEFAULT_YAYASAN_DATA.nonFormalUnits.find(dn => dn.id === n.id);
          if (def) {
            if (n.id === 'poskestren' && (!n.leadershipTitle || n.gallery.length === 4)) {
              n.gallery = def.gallery;
              n.role = def.role;
              n.leadershipTitle = def.leadershipTitle;
              unitGalleryMigrated = true;
            }
            if (!n.gallery || n.gallery.length < 2 || !n.headmaster || (n.office && n.office.includes("Mushola Utama Pesantren"))) {
              n.gallery = def.gallery;
              n.headmaster = def.headmaster;
              n.quota = def.quota;
              n.studyTime = def.studyTime;
              n.facilities = def.facilities;
              n.extracurriculars = def.extracurriculars;
              n.office = def.office;
              unitGalleryMigrated = true;
            }
            if (def.headmasterSpeech && (!n.headmasterSpeech || !n.headmasterSpeechTitle || !n.headmasterPhoto)) {
              n.headmasterPhoto = def.headmasterPhoto;
              n.headmasterSpeechTitle = def.headmasterSpeechTitle;
              n.headmasterSpeech = def.headmasterSpeech;
              unitGalleryMigrated = true;
            }
          }
        });
      }
      if (unitGalleryMigrated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    // Auto-migrate adminUsers (Role-Based Access Control)
    if (!parsed.adminUsers || !Array.isArray(parsed.adminUsers) || parsed.adminUsers.length < 10) {
      parsed.adminUsers = DEFAULT_YAYASAN_DATA.adminUsers;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate featureRoadmap (Pusat Penambahan & Perbaikan Fitur)
    if (!parsed.featureRoadmap || !Array.isArray(parsed.featureRoadmap) || parsed.featureRoadmap.length === 0) {
      parsed.featureRoadmap = DEFAULT_YAYASAN_DATA.featureRoadmap;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate analytics (Trafik & Sebaran Wilayah Pengunjung)
    if (!parsed.analytics || !parsed.analytics.cities || !Array.isArray(parsed.analytics.cities)) {
      parsed.analytics = DEFAULT_YAYASAN_DATA.analytics;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate units to tailored local realistic photos if still using old stock or illustration
    if (parsed.units && Array.isArray(parsed.units)) {
      let updatedUnits = false;
      parsed.units.forEach(u => {
        const defaultU = DEFAULT_YAYASAN_DATA.units.find(du => du.id === u.id);
        if (defaultU && defaultU.image.startsWith('assets/unit_') && (u.image.includes('unsplash.com') || u.image.includes('hero_santri.jpg') || u.image.includes('_illus.jpg'))) {
          u.image = defaultU.image;
          if (Array.isArray(u.gallery) && u.gallery[0]) {
            u.gallery[0].src = defaultU.gallery[0].src;
            u.gallery[0].caption = defaultU.gallery[0].caption;
          }
          updatedUnits = true;
        }
      });
      if (updatedUnits) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    // Auto-migrate videoShowcase headline to always include Lamongan
    if (parsed.videoShowcase && parsed.videoShowcase.headline) {
      if (parsed.videoShowcase.headline.includes("Ke YTPAI Raudlatul Muta'allimin") && !parsed.videoShowcase.headline.includes("Lamongan")) {
        parsed.videoShowcase.headline = parsed.videoShowcase.headline.replace(
          "Ke YTPAI Raudlatul Muta'allimin",
          "Ke YTPAI Raudlatul Muta'allimin Lamongan"
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    // Auto-migrate meta.gaId
    if (parsed.meta && typeof parsed.meta.gaId === 'undefined') {
      parsed.meta.gaId = DEFAULT_YAYASAN_DATA.meta.gaId || "";
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate meta.geminiApiKey
    if (parsed.meta && typeof parsed.meta.geminiApiKey === 'undefined') {
      parsed.meta.geminiApiKey = DEFAULT_YAYASAN_DATA.meta.geminiApiKey || "";
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate meta.geminiApiKeySecondary (Cadangan / Gotong Royong)
    if (parsed.meta && typeof parsed.meta.geminiApiKeySecondary === 'undefined') {
      parsed.meta.geminiApiKeySecondary = DEFAULT_YAYASAN_DATA.meta.geminiApiKeySecondary || "";
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate meta.chatbotName to RAUDLY
    if (parsed.meta && (!parsed.meta.chatbotName || parsed.meta.chatbotName === 'Santri AI')) {
      parsed.meta.chatbotName = "RAUDLY";
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate meta.chatbotMascot to clean official YTPAI HD avatar
    if (parsed.meta && (typeof parsed.meta.chatbotMascot === 'undefined' || parsed.meta.chatbotMascot === 'assets/mascot.png' || parsed.meta.chatbotMascot === 'assets/mascot_sticker.png' || parsed.meta.chatbotMascot === 'assets/raudly_avatar_head.png')) {
      parsed.meta.chatbotMascot = "assets/raudly_avatar_hd.png";
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate tasmikRecords (Galeri Kehormatan Tasmik 5 Juz Al-Qur'an)
    if (!parsed.tasmikRecords || !Array.isArray(parsed.tasmikRecords) || parsed.tasmikRecords.length === 0) {
      parsed.tasmikRecords = DEFAULT_YAYASAN_DATA.tasmikRecords;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate muassis (Muassis & Masyayikh Pendiri 1984)
    if (!parsed.muassis || !Array.isArray(parsed.muassis) || parsed.muassis.length === 0) {
      parsed.muassis = DEFAULT_YAYASAN_DATA.muassis;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } else if (!parsed.muassis.some(m => m.name && m.name.includes("Sa'dullah"))) {
      const sadullah = DEFAULT_YAYASAN_DATA.muassis.find(m => m.name && m.name.includes("Sa'dullah"));
      if (sadullah) {
        parsed.muassis.push(sadullah);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    // Auto-migrate psbWaveConfig (Sistem 2 Gelombang PSB Dinamis)
    if (!parsed.psbWaveConfig || !parsed.psbWaveConfig.wave1) {
      const oldConfig = parsed.psbWaveConfig || {};
      parsed.psbWaveConfig = {
        activeWave: (typeof oldConfig.isOpen !== 'undefined' && !oldConfig.isOpen) ? 0 : 1,
        academicYear: oldConfig.academicYear || DEFAULT_YAYASAN_DATA.psbWaveConfig.academicYear,
        wave1: {
          name: oldConfig.name || DEFAULT_YAYASAN_DATA.psbWaveConfig.wave1.name,
          shortName: "Gelombang I",
          dateRange: oldConfig.dateRange || DEFAULT_YAYASAN_DATA.psbWaveConfig.wave1.dateRange,
          status: oldConfig.status || DEFAULT_YAYASAN_DATA.psbWaveConfig.wave1.status,
          isOpen: (typeof oldConfig.isOpen !== 'undefined') ? oldConfig.isOpen : true,
          announcementText: oldConfig.announcementText || DEFAULT_YAYASAN_DATA.psbWaveConfig.wave1.announcementText
        },
        wave2: JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.psbWaveConfig.wave2)),
        name: oldConfig.name || "Gelombang I",
        dateRange: oldConfig.dateRange || "02 Jan – 31 Mar 2026",
        status: oldConfig.status || "Kuota Terbatas",
        isOpen: (typeof oldConfig.isOpen !== 'undefined') ? oldConfig.isOpen : true,
        announcementText: oldConfig.announcementText || DEFAULT_YAYASAN_DATA.psbWaveConfig.wave1.announcementText
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate kbihuInfo office to Mushola Pondok Pesantren Putra & kontak resmi Ust. Yusuf Afif Rifa'i
    if (parsed.kbihuInfo) {
      if (parsed.kbihuInfo.office && (parsed.kbihuInfo.office.includes("Mushola Utama Pesantren") || parsed.kbihuInfo.office.includes("Masjid Jami'"))) {
        parsed.kbihuInfo.office = DEFAULT_YAYASAN_DATA.kbihuInfo.office;
      }
      if (!parsed.kbihuInfo.whatsappClean || parsed.kbihuInfo.whatsappClean === '6282139458899' || parsed.kbihuInfo.coordinator === 'H. Ahmad Fauzi, S.Pd.I') {
        parsed.kbihuInfo.coordinator = DEFAULT_YAYASAN_DATA.kbihuInfo.coordinator;
        parsed.kbihuInfo.whatsapp = DEFAULT_YAYASAN_DATA.kbihuInfo.whatsapp;
        parsed.kbihuInfo.whatsappClean = DEFAULT_YAYASAN_DATA.kbihuInfo.whatsappClean;
        parsed.kbihuInfo.checkPorsiUrl = DEFAULT_YAYASAN_DATA.kbihuInfo.hero.checkPorsiUrl;
        if (parsed.kbihuInfo.hero) {
          parsed.kbihuInfo.hero.checkPorsiUrl = DEFAULT_YAYASAN_DATA.kbihuInfo.hero.checkPorsiUrl;
        }
        if (parsed.kbihuInfo.highlights && Array.isArray(parsed.kbihuInfo.highlights) && parsed.kbihuInfo.highlights[2]) {
          parsed.kbihuInfo.highlights[2].desc = DEFAULT_YAYASAN_DATA.kbihuInfo.highlights[2].desc;
        }
      }
      // Pastikan unit kbihu dalam units juga tersinkronisasi
      if (parsed.units && Array.isArray(parsed.units)) {
        const uKbihu = parsed.units.find(u => u.id === 'kbihu');
        if (uKbihu && (uKbihu.whatsappClean === '6282139458899' || uKbihu.coordinator === 'H. Ahmad Fauzi, S.Pd.I')) {
          uKbihu.coordinator = DEFAULT_YAYASAN_DATA.kbihuInfo.coordinator;
          uKbihu.headmaster = DEFAULT_YAYASAN_DATA.kbihuInfo.coordinator;
          uKbihu.whatsapp = DEFAULT_YAYASAN_DATA.kbihuInfo.whatsapp;
          uKbihu.whatsappClean = DEFAULT_YAYASAN_DATA.kbihuInfo.whatsappClean;
        }
      }
      if (parsed.kbihuInfo.highlights && Array.isArray(parsed.kbihuInfo.highlights) && parsed.kbihuInfo.highlights[1] && parsed.kbihuInfo.highlights[1].title && parsed.kbihuInfo.highlights[1].title.includes("Para Masyayikh")) {
        parsed.kbihuInfo.highlights[1] = DEFAULT_YAYASAN_DATA.kbihuInfo.highlights[1];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate kbihuPembimbing (saat ini hanya KH. Miftahul Falah, S.Pd)
    if (!parsed.kbihuPembimbing || !Array.isArray(parsed.kbihuPembimbing) || parsed.kbihuPembimbing.length === 0 || parsed.kbihuPembimbing.some(m => m.name && (m.name.includes("Baqir") || m.name.includes("Rodhiyah")))) {
      parsed.kbihuPembimbing = JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.kbihuPembimbing));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate dailySchedules (Jadwal Rutin Santri 24 Jam)
    if (!parsed.dailySchedules || !Array.isArray(parsed.dailySchedules) || parsed.dailySchedules.length === 0 || parsed.dailySchedules.some(s => s.activity && (s.activity.includes("Masjid Jami'") || s.activity.includes("Mushola Utama Pesantren")))) {
      parsed.dailySchedules = JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.dailySchedules));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate psbFaq (Tanya Jawab Resmi PSB & CRUD Dinamis)
    if (!parsed.psbFaq || !Array.isArray(parsed.psbFaq) || parsed.psbFaq.length === 0) {
      parsed.psbFaq = JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.psbFaq));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } else {
      // Pastikan koreksi faktual (makan 2 kali, boleh non-mukim, tanggal dinamis) disinkronkan
      let updatedFaq = false;
      parsed.psbFaq.forEach(faq => {
        if (faq.id === 'faq-3' && faq.answer && faq.answer.includes('3 kali')) {
          faq.answer = DEFAULT_YAYASAN_DATA.psbFaq.find(f => f.id === 'faq-3').answer;
          updatedFaq = true;
        }
        if (faq.id === 'faq-5' && faq.answer && faq.answer.includes('diwajibkan menetap')) {
          faq.answer = DEFAULT_YAYASAN_DATA.psbFaq.find(f => f.id === 'faq-5').answer;
          updatedFaq = true;
        }
        if (faq.id === 'faq-1' && faq.answer && !faq.answer.includes('{{WAVE_1_DATES}}')) {
          faq.answer = DEFAULT_YAYASAN_DATA.psbFaq.find(f => f.id === 'faq-1').answer;
          updatedFaq = true;
        }
      });
      if (updatedFaq) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    // Auto-migrate agenda (Agenda & Kalender Kegiatan Santri & Pembersihan Masjid Jami')
    if (!parsed.agenda || !Array.isArray(parsed.agenda) || parsed.agenda.length === 0) {
      parsed.agenda = JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.agenda));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } else {
      let updatedAgenda = false;
      parsed.agenda.forEach(item => {
        if (item.location && (item.location.includes("Masjid Jami'") || item.location.includes("Masjid Jamik"))) {
          item.location = item.location.replace(/Masjid Jami['’]|Masjid Jamik/gi, "Mushola Pondok Pesantren Putra");
          updatedAgenda = true;
        }
        if (item.desc && (item.desc.includes("Masjid Jami'") || item.desc.includes("Masjid Jamik"))) {
          item.desc = item.desc.replace(/Masjid Jami['’]|Masjid Jamik/gi, "Mushola Pondok Pesantren Putra");
          updatedAgenda = true;
        }
      });
      if (updatedAgenda) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    // Auto-migrate extracurriculars (Hapus Bela Diri & Ganti dengan Klub Olahraga Santri Futsal/Voli)
    if (!parsed.extracurriculars || !Array.isArray(parsed.extracurriculars) || parsed.extracurriculars.length === 0 || parsed.extracurriculars.some(e => (e.id && e.id === 'ekskul-pagarnusa') || (e.name && e.name.toLowerCase().includes('silat')) || (e.category && e.category.toLowerCase().includes('bela diri')) || (e.image && e.image.includes('unsplash.com')))) {
      parsed.extracurriculars = JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.extracurriculars));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate achievements (Hapus Prestasi Silat jika ada di cache & pastikan foto lokal santri)
    if (parsed.achievements && Array.isArray(parsed.achievements)) {
      let updatedAch = false;
      if (parsed.achievements.some(a => a.title && a.title.toLowerCase().includes('pencak silat'))) {
        parsed.achievements = JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.achievements));
        updatedAch = true;
      }
      parsed.achievements.forEach(a => {
        if (a.image && (a.image.includes('1526976668912-1a811878dd37') || a.image.includes('photo-1526976668912'))) {
          a.image = 'assets/kegiatan_pramuka_santri.jpg';
          updatedAch = true;
        }
      });
      if (updatedAch) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    // Auto-migrate tasmikRecords (Pastikan foto memakai aset lokal pesantren)
    if (parsed.tasmikRecords && Array.isArray(parsed.tasmikRecords)) {
      let updatedTasmik = false;
      parsed.tasmikRecords.forEach(t => {
        if (t.image && (t.image.includes('1526976668912-1a811878dd37') || t.image.includes('photo-1526976668912'))) {
          t.image = 'assets/tahfidz_quran_pesantren.jpg';
          updatedTasmik = true;
        }
      });
      if (updatedTasmik) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    // Auto-migrate units (Penyesuaian Faktual Kepala Sekolah / Madrasah & Nama Struktural)
    if (parsed.units && Array.isArray(parsed.units)) {
      let updatedUnits = false;
      parsed.units.forEach(u => {
        const def = DEFAULT_YAYASAN_DATA.units.find(du => du.id === u.id);
        if (def) {
          if (u.headmaster !== def.headmaster || !u.structural || u.leadershipTitle !== def.leadershipTitle) {
            u.headmaster = def.headmaster;
            u.leadershipTitle = def.leadershipTitle;
            u.structural = def.structural;
            updatedUnits = true;
          }
        }
      });
      if (parsed.units.some(u => u.extracurriculars && u.extracurriculars.some(ex => ex.toLowerCase().includes('silat')))) {
        parsed.units = JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.units));
        updatedUnits = true;
      }
      if (updatedUnits) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    // Auto-migrate facilities (Koreksi Faktual Fasilitas Riil & Pembersihan Klaim Hiperbolis)
    if (!parsed.facilities || !Array.isArray(parsed.facilities) || parsed.facilities.length === 0 || parsed.facilities.some(f => (f.capacity && f.capacity.includes("80 PC")) || (f.image && f.image.includes("belajar_santri_sma.jpg")) || (f.name && (f.name.includes("Laboratorium Terpadu Sains") || f.name.includes("Graha Serbaguna"))))) {
      parsed.facilities = JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.facilities));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    // Auto-migrate psbCosts (Rincian Estimasi Biaya Pendidikan SPMB Dinamis)
    if (!parsed.psbCosts || !parsed.psbCosts.cards || !Array.isArray(parsed.psbCosts.cards) || parsed.psbCosts.cards.length === 0 || parsed.psbCosts.cards.some(c => c.price === "Rp 4.850.000" || c.price === "Rp 1.050.000" || c.price === "Rp 150.000")) {
      parsed.psbCosts = JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.psbCosts));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    if (parsed.psbCosts && parsed.psbCosts.scholarshipNote) {
      parsed.psbCosts.scholarshipNote = "";
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (err) {
    console.error('Error reading DB from localStorage:', err);
    return JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA));
  }
}

function saveDB(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    // Dispatch custom event for reactive update
    window.dispatchEvent(new CustomEvent('ytpai_db_updated', { detail: db }));
    return true;
  } catch (err) {
    console.error('Error saving DB to localStorage:', err);
    return false;
  }
}

function resetDB() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_YAYASAN_DATA));
  window.dispatchEvent(new CustomEvent('ytpai_db_updated', { detail: DEFAULT_YAYASAN_DATA }));
  return DEFAULT_YAYASAN_DATA;
}

// Global reference for backward compatibility
const YAYASAN_DATA = getDB();
