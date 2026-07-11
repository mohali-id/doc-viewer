# Prompt: Aplikasi Web Doc Viewer

Salin prompt di bawah ini dan berikan ke AI coding agent (Claude Code, Cursor, dll).

---

## PROMPT

Buatkan aplikasi web **Doc Viewer** yang memungkinkan user mengunggah file dan langsung melihat isinya di browser tanpa perlu mendownload atau membuka aplikasi eksternal, kecuali untuk tipe file yang tidak didukung preview-nya.

### Mode Deploy & Cara Akses (WAJIB)

- Hasil build harus berupa **static file** (HTML, JS, CSS, assets) tanpa perlu server backend untuk jalan — bisa langsung dibuka dari static hosting apa saja (Nginx, Apache, S3, GitHub Pages, dll), dengan **`index.html` sebagai entry point tunggal**.
- Aplikasi harus bisa dibuka dengan cara load dokumen langsung lewat **query parameter `file`** yang isinya URL dokumen, contoh:
  ```
  http://localhost:5174/?file=http://localhost:5174/document.pdf
  http://localhost:5174/index.html?file=https://example.com/laporan.docx
  ```
  Saat halaman dimuat dengan parameter `file` ini, aplikasi harus otomatis:
  1. Fetch file dari URL tersebut (pakai `fetch`, perhatikan CORS — dokumentasikan di README kalau butuh header CORS di server penyedia file).
  2. Deteksi tipe file dari ekstensi URL (dan/atau `Content-Type` response header sebagai fallback).
  3. Tampilkan langsung di viewer yang sesuai (tanpa perlu user upload manual).
  4. Tampilkan loading indicator selama proses fetch & parsing berlangsung.
  5. Kalau fetch gagal (404, CORS blocked, network error), tampilkan pesan error yang jelas beserta URL yang dicoba, dan tombol "Coba lagi".
- Kalau parameter `file` **tidak ada**, aplikasi fallback ke mode upload manual (drag & drop / browse file) seperti biasa.
- Nama file untuk ditampilkan di toolbar/judul diambil dari nama file di URL (bagian akhir path setelah `/`, sebelum query string).
- Build config harus mendukung base path relatif (`base: './'` kalau pakai Vite, atau setara) supaya static build tetap jalan walau dideploy di subfolder, bukan hanya di root domain.

### Fitur Utama

1. **Dua cara membuka dokumen**:
   - **Via URL** — otomatis lewat query parameter `?file=` seperti dijelaskan di atas (mode utama untuk kebutuhan embed/link langsung).
   - **Upload manual** — drag & drop area + tombol "Browse File", untuk kebutuhan saat tidak ada parameter `file`. Bisa upload satu file per view (atau multiple file dengan daftar/list di sidebar, tampilkan sebagai file manager sederhana jika memungkinkan).
2. **Deteksi tipe file otomatis** berdasarkan ekstensi & MIME type (dari nama file lokal maupun dari URL/Content-Type saat mode `?file=`).
3. **Preview langsung di browser** untuk tipe file berikut:

| Kategori | Ekstensi | Cara Render |
|---|---|---|
| PDF | `.pdf` | Render pakai `pdf.js`, tampilkan per halaman dengan scroll/pagination, ada zoom in/out |
| Word | `.docx` | Convert ke HTML pakai `mammoth.js` (client-side) atau library setara di backend, tampilkan dengan formatting (heading, bold, list, tabel) |
| Excel | `.xlsx`, `.csv` | Parse pakai `SheetJS (xlsx)` atau `PapaParse` (khusus csv), tampilkan sebagai tabel dengan sheet tab jika multi-sheet, support scroll horizontal untuk kolom banyak |
| PowerPoint | `.pptx` | Render tiap slide sebagai gambar/HTML (bisa pakai konversi server-side ke gambar, atau library viewer pptx), tampilkan dengan navigasi slide (prev/next + thumbnail) |
| Gambar | `.png`, `.jpg`, `.jpeg`, `.gif` | Tampilkan langsung dengan `<img>`, sediakan zoom & fit-to-screen |
| Text & Kode | `.txt`, `.php`, `.py`, `.js`, `.ts`, `.json`, `.html`, `.css`, `.java`, `.c`, `.cpp`, `.sql`, `.md`, `.yml`, `.sh`, dll | Tampilkan dengan syntax highlighting (pakai `highlight.js` atau `Prism.js`), termasuk nomor baris, deteksi bahasa dari ekstensi file |

4. **Fallback untuk file lain (binary/tidak didukung)**:
   - Jangan coba render.
   - Tampilkan info card: nama file, ukuran, tipe file, ikon generik.
   - Sediakan **tombol Download** saja untuk file tersebut.

5. **UI/UX**:
   - Layout: sidebar kiri (daftar file yang sudah diupload) + panel kanan (area preview).
   - Toolbar di atas preview: nama file, ukuran, tombol download, tombol close/hapus.
   - Loading state saat file sedang diproses/di-parse (terutama untuk pptx/xlsx besar).
   - Error handling: jika file gagal diparse/corrupt, tampilkan pesan error yang jelas + tetap sediakan tombol download sebagai fallback.
   - Responsive (bisa dipakai di desktop & mobile).
   - Dark mode & light mode.

### Batasan Teknis

- **Semua proses parsing dokumen (pdf, docx, xlsx, csv, pptx, kode) harus dilakukan 100% client-side** di browser, karena aplikasi ini adalah static build tanpa backend. Jangan pakai library yang butuh proses server-side (misalnya LibreOffice headless) — pilih library yang bisa parsing/render langsung di JS browser.
  - Khusus PPTX: karena parsing pptx murni di browser cukup terbatas, gunakan library JS yang bisa extract & render slide (teks, gambar, layout dasar) langsung dari file `.pptx` (misalnya render manual dari XML di dalam file pptx menggunakan `JSZip` + parser XML, atau library viewer pptx client-side yang tersedia). Kalau rendering pixel-perfect tidak memungkinkan, render versi simplified (teks + gambar per slide) asal tetap terbaca, dan jelaskan keterbatasan ini di README.
- Batasi ukuran file yang diproses (misal maksimal 20–50MB) dan tampilkan validasi/peringatan jika melebihi batas, baik untuk upload manual maupun saat fetch dari `?file=`.
- Validasi tipe file dari isi file (magic number) kalau isi file (arraybuffer) sudah didapat, bukan hanya dari ekstensi, untuk keamanan.
- Sanitasi output HTML hasil konversi (docx/pptx) untuk mencegah XSS, karena semuanya dirender client-side langsung dari file yang bisa berasal dari URL luar.
- Untuk mode `?file=`, tangani CORS dengan baik: kalau fetch gagal karena CORS, tampilkan pesan error spesifik yang menjelaskan bahwa server penyedia file perlu mengizinkan `Access-Control-Allow-Origin`.

### Rekomendasi Stack

- Frontend: React + Vite (pilih Vite karena mudah dikonfigurasi jadi static build single `index.html` dengan base path relatif) — atau sesuaikan dengan stack yang sudah dipakai di project, selama hasil akhirnya tetap bisa di-build jadi static site.
- Library preview (semua client-side):
  - PDF → `pdf.js`
  - DOCX → `mammoth.js`
  - XLSX/CSV → `xlsx` (SheetJS) / `papaparse`
  - PPTX → `JSZip` + parser XML manual, atau library pptx viewer client-side
  - Gambar → native `<img>`
  - Syntax highlight → `highlight.js` atau `shiki`
- Tidak butuh backend/server runtime — cukup static file server untuk hosting hasil build (Nginx/Apache/S3/CDN/GitHub Pages, dll).

### Output yang Diharapkan

- Struktur folder project yang jelas (komponen viewer terpisah per tipe file, contoh: `PdfViewer.tsx`, `DocxViewer.tsx`, `XlsxViewer.tsx`, `PptxViewer.tsx`, `ImageViewer.tsx`, `CodeViewer.tsx`, `DownloadOnlyCard.tsx`).
- Satu komponen router `FileViewer` yang mendeteksi tipe file dan memilih komponen viewer yang sesuai.
- Kode yang mudah dikembangkan untuk menambah dukungan tipe file baru di kemudian hari.
- Hasil `npm run build` (atau setara) menghasilkan folder `dist/` berisi `index.html` + assets statis, siap di-copy langsung ke static hosting mana pun tanpa konfigurasi tambahan.
- Sertakan file `README.md` singkat yang menjelaskan cara build, cara serve hasil build secara lokal (misal `npx serve dist`), dan contoh penggunaan URL dengan parameter `?file=`.

---

### Tips Pemakaian Prompt Ini
- Kalau kamu sudah punya stack tertentu (misal Laravel, Vue, Flutter web, dsb), tambahkan satu baris di awal prompt: *"Gunakan stack: [sebutkan stack-nya]"* supaya AI agent menyesuaikan.
- Kalau targetnya file besar (ratusan MB), tambahkan instruksi soal streaming saat fetch/parsing di client, karena semua proses murni di browser (tidak ada backend yang bisa bantu chunking).
- Kalau file yang dibuka lewat `?file=` berada di domain berbeda, pastikan server penyedia file mengaktifkan CORS — kalau tidak bisa diubah, sebutkan di prompt bahwa perlu proxy CORS terpisah (catatan: proxy ini akan jadi komponen server tambahan di luar static build).
- Kalau butuh multi-user dengan penyimpanan permanen, ini di luar cakupan static build — perlu requirement tambahan soal storage (misal S3) dan autentikasi, beserta backend terpisah.