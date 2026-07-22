import type { LegalContent } from "./types";

const id = {
  backToPapre: "← Kembali ke Papre",
  lastUpdatedLabel: "Terakhir diperbarui",
  privacy: {
    title: "Kebijakan Privasi",
    lastUpdated: "19 Juli 2026",
    intro:
      "Kebijakan Privasi ini menjelaskan informasi apa saja yang dikumpulkan Papre, bagaimana informasi tersebut digunakan, dan pilihan apa yang kamu miliki. Papre adalah aplikasi pribadi untuk mencatat, menulis jurnal, dan membaca.",
    sections: [
      {
        heading: "1. Informasi yang Kami Kumpulkan",
        list: [
          {
            term: "Informasi akun:",
            description:
              "nama, alamat email, dan password yang di-hash secara aman jika kamu mendaftar dengan email dan password, atau nama, email, dan foto profil jika kamu masuk dengan Google.",
          },
          {
            term: "Konten yang kamu buat:",
            description:
              "halaman, folder, entri jurnal, koleksi buku, dan file apa pun yang kamu unggah (gambar sampul, PDF yang diimpor). Konten halaman terenkripsi saat disimpan.",
          },
          {
            term: "Data workspace & berbagi:",
            description:
              "keanggotaan workspace, peran, dan informasi tentang halaman yang kamu pilih untuk dibagikan serta kepada siapa.",
          },
          {
            term: "Cookie:",
            description:
              "cookie sesi untuk menjaga kamu tetap masuk, dan cookie kecil yang mengingat workspace terakhir yang kamu pilih. Kami tidak menggunakan cookie iklan atau pelacak pihak ketiga.",
          },
        ],
      },
      {
        heading: "2. Bagaimana Kami Menggunakan Informasimu",
        paragraphs: [
          "Kami menggunakan informasi di atas untuk mengoperasikan Layanan: mengautentikasi kamu, menjaga workspace dan halamanmu tetap terorganisir, mengingat preferensimu, dan mengirim email transaksional yang kamu minta — misalnya, tautan reset password. Kami tidak menggunakan konten atau informasi akunmu untuk iklan, dan kami tidak menjual data pribadi kepada pihak ketiga.",
        ],
      },
      {
        heading: "3. Layanan Pihak Ketiga",
        paragraphs: ["Kami mengandalkan sejumlah kecil layanan pihak ketiga untuk menjalankan Papre:"],
        list: [
          {
            term: "Google",
            description:
              "— hanya digunakan jika kamu memilih \"Masuk dengan Google,\" untuk memverifikasi identitasmu melalui OAuth.",
          },
          {
            term: "Penyedia layanan email",
            description: "— digunakan untuk mengirim email transaksional seperti tautan reset password.",
          },
        ],
        listFootnote:
          "Penyedia layanan ini hanya menerima informasi minimum yang dibutuhkan untuk menjalankan fungsinya dan tidak diizinkan menggunakannya untuk kepentingan mereka sendiri.",
      },
      {
        heading: "4. Penyimpanan Data & Keamanan",
        paragraphs: [
          "Password disimpan sebagai hash yang di-salt, tidak pernah dalam bentuk teks biasa. Konten halaman dienkripsi saat disimpan menggunakan kunci unik per akun. Ini melindungi datamu dari akses tidak sah ke database yang mendasarinya, namun — sebagaimana dicatat dalam Ketentuan Layanan kami — ini bukan desain zero-knowledge, dan operator tetap memiliki kemampuan teknis untuk mengakses konten yang tersimpan bila diperlukan (misalnya, untuk menyelidiki penyalahgunaan atau mematuhi hukum).",
        ],
      },
      {
        heading: "5. Berbagi dengan Pengguna Lain",
        paragraphs: [
          "Jika kamu mengundang seseorang ke workspace, mereka dapat melihat halaman yang terdapat di workspace tersebut, sesuai peran yang diberikan. Jika kamu menggunakan fitur berbagi halaman, halaman tersebut terlihat oleh siapa pun yang kamu undang, atau oleh siapa saja yang memiliki tautan jika kamu memilih untuk membuatnya publik. Kami hanya membagikan kontenmu kepada pengguna lain sebagai akibat langsung dari tindakan yang kamu ambil.",
        ],
      },
      {
        heading: "6. Retensi Data & Pilihanmu",
        paragraphs: [
          "Kami menyimpan akun dan kontenmu selama akunmu masih aktif. Kamu dapat meminta akses, koreksi, atau penghapusan datamu kapan saja dengan menghubungi kami di alamat di bawah ini; kami akan menghapus akun dan konten terkait dalam waktu yang wajar setelah permintaan terverifikasi, kecuali jika kami diwajibkan oleh hukum untuk menyimpan catatan tertentu.",
        ],
      },
      {
        heading: "7. Privasi Anak-Anak",
        paragraphs: [
          "Papre tidak ditujukan untuk anak-anak di bawah 13 tahun, dan kami tidak secara sengaja mengumpulkan informasi pribadi dari anak-anak di bawah 13 tahun.",
        ],
      },
      {
        heading: "8. Perubahan & Kontak",
        paragraphs: [
          "Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu; perubahan material akan tercermin dengan memperbarui tanggal di bagian atas halaman ini. Jika kamu memiliki pertanyaan tentang kebijakan ini atau ingin menggunakan hak atas datamu,",
        ],
      },
    ],
    contactPrefix: "hubungi kami di",
  },
  terms: {
    title: "Ketentuan Layanan",
    lastUpdated: "19 Juli 2026",
    intro:
      "Ketentuan Layanan (\"Ketentuan\") ini mengatur akses dan penggunaanmu atas Papre (\"Layanan\"), aplikasi pribadi untuk mencatat, menulis jurnal, dan membaca. Dengan membuat akun atau menggunakan Layanan, kamu menyetujui Ketentuan ini. Jika kamu tidak setuju, mohon untuk tidak menggunakan Layanan.",
    sections: [
      {
        heading: "1. Layanan",
        paragraphs: [
          "Papre memungkinkanmu membuat dan mengatur halaman serta folder, menulis entri jurnal berbasis kalender, menyimpan perpustakaan pribadi berisi volume tulisan dan PDF yang diimpor, dan secara opsional membagikan halaman tertentu kepada orang lain. Layanan ini disediakan oleh operator independen dan tidak berafiliasi dengan merek pihak ketiga mana pun yang disebutkan dalam Ketentuan ini.",
        ],
      },
      {
        heading: "2. Akun",
        paragraphs: [
          "Kamu dapat membuat akun dengan email dan password atau dengan masuk menggunakan akun Google. Kamu bertanggung jawab untuk menjaga kerahasiaan kredensial masukmu dan atas semua aktivitas yang terjadi di bawah akunmu. Segera beri tahu kami jika kamu meyakini akunmu telah diakses tanpa izinmu.",
        ],
      },
      {
        heading: "3. Kontenmu",
        paragraphs: [
          "Kamu tetap memiliki kepemilikan atas segala sesuatu yang kamu buat di Papre — halaman, folder, entri jurnal, file yang diunggah, dan volume perpustakaan (\"Kontenmu\"). Kamu memberi kami hanya hak terbatas yang diperlukan untuk menyimpan, memproses, dan menampilkan kembali Kontenmu kepadamu (dan kepada siapa pun yang secara eksplisit kamu pilih untuk membagikannya) demi mengoperasikan Layanan. Kami tidak mengklaim kepemilikan atas Kontenmu dan tidak menggunakannya untuk melatih model atau untuk iklan.",
          "Konten halaman dienkripsi saat disimpan. Ini melindungi datamu dari akses tidak sah ke penyimpanan yang mendasarinya, tetapi tidak menjadikan Layanan ini sebagai sistem zero-knowledge — operator tetap memiliki kemampuan teknis untuk mengakses konten yang tersimpan untuk tujuan yang sah seperti pemecahan masalah, kepatuhan hukum, atau pemulihan akun.",
        ],
      },
      {
        heading: "4. Berbagi Halaman",
        paragraphs: [
          "Papre memungkinkanmu membagikan halaman tertentu baik kepada orang-orang tertentu yang diundang, atau jika kamu memilih, melalui tautan publik. Apa pun yang kamu bagikan dengan cara ini akan terlihat oleh siapa pun yang memegang undangan atau tautan tersebut — pastikan kamu memang bermaksud membagikan suatu halaman sebelum mengaktifkan fitur berbagi padanya.",
        ],
      },
      {
        heading: "5. Penggunaan yang Dapat Diterima",
        paragraphs: [
          "Kamu setuju untuk tidak menggunakan Layanan untuk menyimpan atau membagikan konten yang melanggar hukum, melanggar hak orang lain, mencoba mendapatkan akses tidak sah ke Layanan atau data pengguna lain, atau mengganggu operasional normal Layanan (termasuk scraping otomatis atau upaya membebani infrastruktur secara berlebihan).",
        ],
      },
      {
        heading: "6. Penangguhan & Penghentian",
        paragraphs: [
          "Kamu dapat berhenti menggunakan Layanan dan meminta penghapusan akunmu kapan saja dengan menghubungi kami (lihat Bagian 9). Kami dapat menangguhkan atau menghentikan akun yang melanggar Ketentuan ini atau menimbulkan risiko keamanan bagi Layanan atau pengguna lain.",
        ],
      },
      {
        heading: "7. Tanpa Jaminan",
        paragraphs: [
          "Papre disediakan \"sebagaimana adanya\" dan \"sebagaimana tersedia,\" tanpa jaminan dalam bentuk apa pun, baik tersurat maupun tersirat. Kami tidak menjamin bahwa Layanan akan berjalan tanpa gangguan, bebas dari kesalahan, atau tersedia setiap saat. Kamu dianjurkan untuk menyimpan cadangan sendiri atas hal-hal penting, seperti volume PDF yang telah kamu impor.",
        ],
      },
      {
        heading: "8. Batasan Tanggung Jawab",
        paragraphs: [
          "Sejauh diizinkan oleh hukum yang berlaku, operator Papre tidak akan bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaanmu atas, atau ketidakmampuanmu menggunakan, Layanan.",
        ],
      },
      {
        heading: "9. Perubahan & Kontak",
        paragraphs: [
          "Kami dapat memperbarui Ketentuan ini dari waktu ke waktu. Penggunaan Layanan yang berkelanjutan setelah pembaruan berarti kamu menerima Ketentuan yang direvisi. Jika kamu memiliki pertanyaan tentang Ketentuan ini,",
        ],
      },
    ],
    contactPrefix: "hubungi kami di",
  },
} satisfies LegalContent;

export default id;
