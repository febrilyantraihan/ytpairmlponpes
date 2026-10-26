# PANDUAN MENGHUBUNGKAN FORMULIR PPDB KE GOOGLE SHEETS
**YTPAI Raudlatul Muta'allimin Lamongan**

Panduan ini dirancang khusus agar sangat mudah diikuti (hanya butuh waktu sekitar 2–3 menit). Setiap kali ada santri mendaftar di website, data akan otomatis masuk ke lembar Excel Google Sheet Anda secara real-time!

---

## 🟢 LANGKAH 1: Buat File Google Sheets Baru
1. Buka peramban (browser) di laptop Anda, lalu buka: **[sheets.google.com](https://sheets.google.com)** (pastikan sudah login dengan akun Google Anda).
2. Klik tombol **"Kosong"** (tanda tambah `+`) untuk membuat Spreadsheet baru.
3. Beri nama file di pojok kiri atas, misalnya:  
   `DATABASE PPDB YTPAI 2026`

---

## 🟢 LANGKAH 2: Buka Menu Apps Script
1. Pada menu bar bagian atas Google Sheet, klik menu **Ekstensi** (atau *Extensions* jika bahasa Inggris).
2. Pilih dan klik **Apps Script**.
3. Tab baru editor skrip akan terbuka secara otomatis.

---

## 🟢 LANGKAH 3: Tempel Skrip Penerima Data
1. Di dalam editor Apps Script, hapus semua tulisan yang ada di layar (misal tulisan `function myFunction() { ... }`).
2. Salin (*copy*) seluruh kode di bawah ini, lalu tempel (*paste*) ke editor:

```javascript
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Jika sheet masih kosong melompong, otomatis buatkan judul kolom profesional
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Waktu Daftar",
        "Nomor Registrasi",
        "Nama Calon Santri",
        "Jenis Kelamin",
        "Tempat, Tanggal Lahir",
        "Nama Ayah / Wali",
        "Nama Ibu",
        "Nomor WhatsApp",
        "Email",
        "Unit Pendidikan",
        "Status Asrama",
        "Gedung Asrama",
        "Program Pilihan",
        "Alamat",
        "Catatan Khusus",
        "Status Seleksi"
      ]);
      
      // Beri warna latar Navy (#0A2540) dan teks Putih Tebal pada baris judul
      var headerRange = sheet.getRange(1, 1, 1, 16);
      headerRange.setBackground("#0A2540");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
    }
    
    var data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    }
    
    // Tambahkan 1 baris baru data santri
    sheet.appendRow([
      data.date || new Date().toLocaleString("id-ID"),
      data.regNumber || "-",
      data.fullName || "-",
      data.gender || "-",
      data.birthPlaceDate || "-",
      data.fatherName || data.parentName || "-",
      data.motherName || "-",
      data.whatsapp || "-",
      data.email || "-",
      data.unit || "-",
      data.boardingStatus || (data.isBoarding ? "Mondok" : "Non-Mukim"),
      data.boardingWing || "-",
      data.program || "-",
      data.address || "-",
      data.notes || "-",
      data.status || "Baru"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", regNumber: data.regNumber }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Klik ikon **Simpan** (gambar disket 💾) atau tekan tombol `Ctrl + S`.

---

## 🟢 LANGKAH 4: Dapatkan URL Webhook (Deploy / Terapkan)
1. Di pojok kanan atas, klik tombol biru **Terapkan** (atau *Deploy*).
2. Pilih **Penerapan baru** (*New deployment*).
3. Di samping tulisan "Pilih jenis", klik ikon gerigi ⚙️ $\rightarrow$ pilih **Aplikasi Web** (*Web app*).
4. Isi pengaturannya sebagai berikut:
   - **Deskripsi:** `Webhook PPDB Website`
   - **Jalankan sebagai:** **Saya (email Anda)** (*Me*)
   - **Siapa yang memiliki akses:** Pilih **Siapa saja** (*Anyone*) $\leftarrow$ *(PENTING agar website diizinkan mengirim data!)*
5. Klik tombol **Terapkan** (*Deploy*).
6. *(Jika muncul jendela izin akses Google, klik "Beri Akses" / "Izinkan")*.
7. Google akan menampilkan **URL Aplikasi Web** (berakhiran `/exec`).  
   Contohnya:  
   `https://script.google.com/macros/s/AKfycbxYz.../exec`
8. Klik tombol **Salin** (*Copy*).

---

## 🟢 LANGKAH 5: Tempel URL ke Panel Admin Website Anda
1. Buka Backoffice CMS website Anda (`admin.html`), masukkan PIN `admin123`.
2. Klik menu **Pendaftar PPDB Online**.
3. Klik tombol **📊 Hubungkan Google Sheets**.
4. Tempelkan (*paste*) URL yang tadi disalin ke kolom yang tersedia, lalu klik **💾 Simpan URL**.
5. Klik tombol **🧪 Tes Kirim Data Contoh**.
6. Buka kembali Google Sheet Anda. Anda akan melihat baris judul biru dongker dan 1 baris data santri uji coba langsung muncul!

---

### 🎉 SELESAI!
Mulai saat ini:
- Setiap ada santri atau wali murid yang mendaftar lewat formulir online di website, baris baru akan otomatis masuk ke Google Sheet Anda dalam hitungan detik!
- Anda dan seluruh panitia PPDB bisa membuka dan memantau pendaftar langsung dari aplikasi Google Sheets di HP masing-masing!
