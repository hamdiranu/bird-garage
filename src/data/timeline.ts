import type { Milestone } from "@/types/fleet";

/* The fleet timeline: the group's story told through the cars in the garage, oldest first. Every fact here is
   also in the cars' own blurbs and notes (data/cars.ts). */

export const TIMELINE: Milestone[] = [
  { year: "1972", car: "torana",
    title: { en: "The first fleet", id: "Armada pertama" },
    note: { en: "Blue Bird starts out with 25 Holden Toranas. One is still on display at head office in Jakarta.", id: "Blue Bird memulai usahanya dengan 25 Holden Torana. Satu di antaranya masih dipajang di kantor pusat di Jakarta." } },
  { year: "1979", car: "coach",
    title: { en: "Bigbird hits the road", id: "Bigbird mulai melaju" },
    note: { en: "Set up in December 1978, the charter-bus arm starts running.", id: "Didirikan pada Desember 1978, lini bus carter mulai beroperasi." } },
  { year: "1993", car: "alphard",
    title: { en: "Silverbird", id: "Silverbird" },
    note: { en: "Indonesia's first executive taxi service.", id: "Layanan taksi eksekutif pertama di Indonesia." } },
  { year: "2000s", car: "limo",
    title: { en: "The Limo years", id: "Era Limo" },
    note: { en: "The Vios-based Toyota Limo carries the Blue Bird livery, until MPVs take over regular taxi work.", id: "Toyota Limo berbasis Vios membawa livery Blue Bird, sampai MPV mengambil alih tugas taksi reguler." } },
  { year: "2019", car: "modelx",
    title: { en: "Electric taxis", id: "Taksi listrik" },
    note: { en: "The BYD e6 and five Tesla Model X launch on the same day, and Cititrans joins the group.", id: "BYD e6 dan lima Tesla Model X diluncurkan di hari yang sama, dan Cititrans bergabung dengan grup." } },
  { year: "2023", car: "ix",
    title: { en: "Electric Goldenbird", id: "Goldenbird listrik" },
    note: { en: "The BMW iX joins the rental range through a tie-up with BMW Indonesia.", id: "BMW iX bergabung dengan jajaran sewa lewat kerja sama dengan BMW Indonesia." } },
  { year: "2025", car: "m6",
    title: { en: "53 years on", id: "53 tahun berjalan" },
    note: { en: "The anniversary line-up names the electric BYD M6, and the Denza D9 is announced for Goldenbird.", id: "Jajaran armada ulang tahun memasukkan BYD M6 listrik, dan Denza D9 diumumkan untuk Goldenbird." } },
  { year: "2026", car: "e6-prime",
    title: { en: "Bluebird Prime", id: "Bluebird Prime" },
    note: { en: "A new tier between regular taxis and Silverbird, launched in July with the second-generation e6.", id: "Kelas baru di antara taksi reguler dan Silverbird, diluncurkan pada Juli dengan e6 generasi kedua." } },
];
