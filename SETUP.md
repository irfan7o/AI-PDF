# AI-PDF Setup dan Penggunaan

## Setup Environment Variables

Untuk menggunakan semua fitur AI PDF, Anda perlu menambahkan API key Google AI:

1. Buka [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Buat API key baru
3. Copy API key tersebut
4. Edit file `.env.local` di root project
5. Ganti `your_google_ai_api_key_here` dengan API key Anda:

```
GOOGLE_GENAI_API_KEY=AIzaSyC_your_actual_api_key_here
```

## Fitur yang Tersedia

### 1. 📄 PDF Summarizer
- **Fungsi**: Merangkum konten PDF menjadi summary singkat
- **Input**: Upload file PDF atau masukkan URL PDF
- **Output**: Summary text dan jumlah halaman
- **Cara penggunaan**: 
  - Klik "Choose File" atau drag & drop PDF
  - Klik "Analyze Document" untuk mendapatkan summary

### 2. 💬 Chat PDF 
- **Fungsi**: Chat interaktif dengan konten PDF
- **Input**: Upload file PDF
- **Output**: Respon AI berdasarkan konten PDF
- **Cara penggunaan**:
  - Upload PDF terlebih dahulu
  - Ketik pertanyaan tentang PDF di chat box
  - AI akan menjawab berdasarkan konten PDF

### 3. 🎵 PDF to Audio
- **Fungsi**: Mengubah teks PDF menjadi audio
- **Input**: File PDF + pilihan voice
- **Output**: File audio MP3
- **Cara penggunaan**:
  - Upload file PDF
  - Pilih voice yang diinginkan
  - Preview voice dengan tombol play
  - Klik "Convert to Audio"

### 4. 🌐 PDF Translator
- **Fungsi**: Menerjemahkan PDF ke bahasa lain
- **Input**: File PDF + bahasa target
- **Output**: PDF yang sudah diterjemahkan
- **Cara penggunaan**:
  - Upload file PDF
  - Pilih bahasa tujuan
  - Klik "Translate PDF"

### 5. 🖼️ Image to PDF
- **Fungsi**: Menggabungkan multiple images menjadi PDF
- **Input**: Multiple image files (JPEG, PNG)
- **Output**: File PDF yang berisi semua gambar
- **Cara penggunaan**:
  - Upload multiple images
  - Drag & drop untuk mengurutkan
  - Klik "Convert to PDF"

### 6. 📷 PDF to Image
- **Fungsi**: Mengubah halaman PDF menjadi images
- **Input**: File PDF
- **Output**: Multiple image files (PNG)
- **Cara penggunaan**:
  - Upload file PDF
  - Klik "Convert to Images"
  - Download images yang dihasilkan

## Troubleshooting

### Tombol "Choose File" Tidak Berfungsi
- ✅ **SUDAH DIPERBAIKI**: Semua tombol "Choose File" sekarang memiliki onClick handler yang benar
- Tombol di mobile sekarang memiliki background biru yang terlihat jelas

### API Key Error
- Pastikan API key Google AI sudah dimasukkan dengan benar di `.env.local`
- Restart development server setelah menambahkan API key
- Cek console browser untuk error message

### Upload File Tidak Berfungsi
- Pastikan file format sesuai (PDF untuk most functions, images untuk Image to PDF)
- Cek ukuran file (max biasanya 10MB)
- Pastikan browser support File API

### Responsive Design
- ✅ **SUDAH DIPERBAIKI**: Menu mobile sekarang menampilkan 6 items
- ✅ **SUDAH DIPERBAIKI**: Menu mobile diperbesar untuk better UX
- ✅ **SUDAH DIPERBAIKI**: Tombol "Choose File" di mobile memiliki background biru

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start Genkit development (untuk AI flows)
npm run genkit:dev

# Start Genkit with watch mode
npm run genkit:watch
```

## Dependencies

Semua dependencies sudah terinstall:
- `pdf-parse`: Untuk parsing PDF content
- `pdf-lib`: Untuk manipulasi PDF
- `@genkit-ai/google-genai`: Untuk AI functionality
- Next.js 15.5.4 dengan Tailwind CSS

## File Structure

```
src/
├── ai/
│   ├── genkit.ts          # AI configuration
│   └── flows/             # AI processing flows
├── app/
│   └── actions.ts         # Server actions
└── components/            # React components
```

Semua fungsi sekarang sudah siap digunakan! 🎉