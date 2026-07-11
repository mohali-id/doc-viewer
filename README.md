# Doc Viewer

Aplikasi web static untuk membuka dan melihat berbagai jenis dokumen langsung di browser, tanpa perlu backend.

## Tipe File yang Didukung

| Kategori | Ekstensi | Library |
|----------|----------|---------|
| PDF | `.pdf` | pdfjs-dist |
| Word | `.docx` | mammoth.js |
| Excel | `.xlsx`, `.csv` | SheetJS, PapaParse |
| PowerPoint | `.pptx` | JSZip (text extraction) |
| Gambar | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg` | Native `<img>` |
| Kode/Teks | `.js`, `.ts`, `.py`, `.php`, `.json`, `.html`, `.css`, `.md`, dll | highlight.js |

File yang tidak didukung akan menampilkan info card dengan tombol download.

## Cara Build

```bash
npm install
npm run build
```

Hasil build ada di folder `dist/`.

## Cara Serve Hasil Build Secara Lokal

```bash
npx serve dist
```

Atau gunakan static file server lain (Nginx, Apache, dsb).

## Cara Penggunaan

### Mode URL (via query parameter)

Buka dengan parameter `?file=` yang berisi URL dokumen:

```
http://localhost:3000/?file=https://example.com/document.pdf
http://localhost:3000/index.html?file=https://example.com/laporan.docx
```

Aplikasi akan otomatis fetch dan menampilkan dokumen tersebut.

### Mode Upload Manual

Buka tanpa parameter `?file=`, lalu:
- Drag & drop file ke area upload, atau
- Klik tombol "Browse File" untuk memilih file

## Fitur

- **Dark/Light mode** - toggle di pojok kanan atas
- **Responsive** - bisa digunakan di desktop dan mobile
- **Sidebar** - daftar file yang sudah dibuka (mode upload)
- **Toolbar** - nama file, ukuran, tombol download, tombol close
- **Loading indicator** - saat file sedang diproses
- **Error handling** - pesan error jelas jika file gagal diproses
- **File size limit** - maksimal 50MB

## Catatan CORS

Jika menggunakan mode `?file=` dengan URL dari domain lain, server penyedia file harus mengizinkan CORS dengan header:

```
Access-Control-Allow-Origin: *
```

Jika CORS diblokir, aplikasi akan menampilkan pesan error yang menjelaskan masalah tersebut.

## Keterbatasan

- **PPTX**: Rendering bersifat simplified (teks per slide), bukan pixel-perfect seperti PowerPoint asli.
- **DOCX**: Formatting dasar (heading, bold, list, tabel) didukung, tapi layout kompleks mungkin tidak 100% akurat.
- **Semua proses** dilakukan client-side di browser, sehingga file yang sangat besar mungkin menyebabkan browser lambat.

## Struktur Project

```
src/
├── components/
│   ├── viewers/
│   │   ├── PdfViewer.tsx
│   │   ├── DocxViewer.tsx
│   │   ├── XlsxViewer.tsx
│   │   ├── PptxViewer.tsx
│   │   ├── ImageViewer.tsx
│   │   ├── CodeViewer.tsx
│   │   └── DownloadOnlyCard.tsx
│   ├── FileViewer.tsx
│   ├── Sidebar.tsx
│   ├── Toolbar.tsx
│   ├── UploadArea.tsx
│   ├── LoadingIndicator.tsx
│   └── ErrorDisplay.tsx
├── utils/
│   └── fileUtils.ts
├── types/
│   └── index.ts
├── App.tsx
├── App.css
└── main.tsx
```
