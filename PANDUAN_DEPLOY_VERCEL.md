# Panduan Praktis Deploy Website ke Vercel (Khusus Pemula / Awam)

Selamat! Website **Portal Terpadu & Backoffice CMS YTPAI Raudlatul Muta’allimin Lamongan** telah dirancang secara ringan, mandiri, dan **100% siap dideploy ke Vercel secara gratis**.

---

## 🌟 Mengapa Vercel Sangat Tepat untuk Website Ini?
1. **100% Gratis Selamanya** (Hobby Plan Vercel tidak dipungut biaya apa pun).
2. **Sangat Cepat & Aman** (Otomatis mendapatkan sertifikat keamanan SSL / HTTPS dengan ikon gembok hijau di peramban).
3. **Bisa Menghubungkan Domain Yayasan Sendiri** (contoh: `ytpai-lamongan.sch.id` atau `raudlatulmutaallimin.ponpes.id`).
4. **Tidak Butuh Server Fisik atau Database Mahal** (Semua data pendaftaran dan CRUD dikelola secara instan dan reaktif di peramban, serta bisa diekspor ke Excel).

---

## 🚀 Cara Deploy: Langkah demi Langkah (Paling Mudah)

### Metode 1: Menggunakan GitHub & Vercel (Paling Direkomendasikan)

1. **Buat Akun di Vercel:**
   * Kunjungi [https://vercel.com](https://vercel.com).
   * Klik tombol **Sign Up** (Anda bisa memilih *Continue with Google* menggunakan akun Gmail Anda, atau *Continue with GitHub*).

2. **Unggah Folder ke Akun GitHub Anda:**
   * Buka [https://github.com](https://github.com) dan buat akun gratis jika belum punya.
   * Buat Repositori Baru (klik tombol **New Repository**), beri nama misalnya: `website-pesantren-ytpai`.
   * Unggah seluruh berkas di folder `d:\Aplikasi\website pesantren` ke repositori tersebut.

3. **Sambungkan dan Deploy di Vercel:**
   * Kembali ke dashboard Vercel Anda, klik tombol **"Add New..."** lalu pilih **"Project"**.
   * Pilih repositori GitHub `website-pesantren-ytpai` yang baru saja Anda buat, lalu klik **"Import"**.
   * Di bagian pengaturan, biarkan semua pengaturan standar (tidak perlu mengubah apa pun karena berkas `vercel.json` sudah saya siapkan secara otomatis).
   * Klik tombol biru besar: **"Deploy"**.

4. **Selesai! 🎉**
   * Dalam waktu kurang dari 1 menit, Vercel akan memberikan tautan resmi yang langsung aktif di internet (contoh: `https://website-pesantren-ytpai.vercel.app`).
   * Siapa saja di seluruh dunia sekarang bisa membuka website yayasan Anda!

---

### Metode 2: Menggunakan Vercel CLI (Jika Paham Perintah Terminal)
Bila di kemudian hari Anda memasang Node.js/Vercel CLI:
```bash
# Di dalam folder proyek:
vercel
```
Cukup tekan `Enter` menyetujui opsi default, dan situs Anda akan langsung terbit secara online.

---

## 🔐 Cara Mengakses Panel Admin Backoffice CMS

Setelah website Anda terbit di internet:
1. Buka halaman utama website Anda, lalu klik tombol **"Panel Admin CMS"** di pojok kanan bawah, atau langsung kunjungi alamat:
   ```
   https://alamat-website-anda.vercel.app/admin
   ```
2. Masukkan PIN / Kata Sandi bawaan:
   * **Password:** `admin123`
3. Di dalam Panel Admin, Anda memiliki hak penuh untuk:
   * **Melihat & Mengelola Data Pendaftar PPDB Online:** Melihat nama calon santri, asal orang tua, unit pilihan, dan menghubungi via WhatsApp dalam 1 klik.
   * **Ekspor ke Excel (.CSV):** Klik tombol *"Ekspor ke Excel"* untuk mengunduh seluruh data calon santri ke format spreadsheet.
   * **Mengedit Seluruh Konten (Full CRUD):**
     * Tambah / Edit / Hapus Warta & Berita.
     * Ubah kurikulum 11 Satuan Pendidikan.
     * Edit naskah sambutan Dewan Pembina & Ketua Yayasan.
     * Tambah galeri fasilitas & etalase prestasi kejuaraan santri.
     * Ganti nomor telepon, WhatsApp, dan angka statistik santri.
4. **Cadangan Data (Backup):**
   * Di tab *"Pengaturan & Backup"*, Anda bisa mengklik tombol **"Unduh Cadangan Data (.JSON)"** kapan saja untuk menyimpan seluruh basis data yayasan Anda di komputer Anda.

---
*Dokumen ini dibuat otomatis sebagai panduan resmi operasional digital YTPAI Raudlatul Muta'allimin Lamongan.*
