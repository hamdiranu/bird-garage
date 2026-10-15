import type { CarEntry, ProfileParams } from "@/types/fleet";

/* The fleet, in roster order. Each car's profile lists only what differs from DEFAULT_PROFILE; for a scanned car
   it mainly sets the size the scan is scaled to (see "Add a scanned (GLB) car" in the README). */

/** Bluebird's regular-taxi blue. */
const BLUE = "#2a86d6";

export const DEFAULT_PROFILE: Partial<ProfileParams> = {
  gc: 0.2, wr: 0.33, tw: 0.21, tumble: 0.9, panes: 3, drop: 0.05, tail: "v", noseX: 0.03,
  noseR: 0.13, tailR: 0.1, hl: [0.1, 0.34], hlDrop: 0.17, gr: [0.16, 0.7],
};

export const CAR_ENTRIES: CarEntry[] = [
  { id: "e6-prime", service: "bluebird", maker: "BYD", model: "e6 Prime", short: "e6 Prime", paint: "#1fa6dc", plate: "yellow", sign: "blue",
    blurb: { en: "The second-generation e6 in Bluebird Prime livery. Prime launched in July 2026 as a tier between regular taxis and Silverbird, and runs the e6 in Jakarta, Bandung, Surabaya, Medan and Bali.", id: "e6 generasi kedua berbalut livery Bluebird Prime. Prime diluncurkan pada Juli 2026 sebagai kelas di antara taksi reguler dan Silverbird, dan mengoperasikan e6 di Jakarta, Bandung, Surabaya, Medan, dan Bali." },
    body: { en: "Electric MPV", id: "MPV listrik" }, seats: "5", power: { en: "Electric", id: "Listrik" }, note: { en: "Bluebird Prime, July 2026", id: "Bluebird Prime, Juli 2026" },
    ratings: { capacity: 5, comfort: 8, eco: 10, agility: 7 },
    scan: { src: "/models/bluebird/byd-e6-prime.glb" },
    // Real length; width and height sit between the real e6 (1.81 × 1.67 m) and the chunkier scan.
    profile: { L: 4.695, W: 1.86, H: 1.75, wb: 2.68, fo: 0.92, wr: 0.36, hoodH: 0.95, noseX: 0.06, cowlX: 1.15, cowlH: 1.12, roofX0: 2.05, roofX1: 4.15, drop: 0.08, rearX: 4.5, rearH: 1.2, tailH: 1.15, tumble: 0.9, tail: "bar", gr: 0, hl: [0.07, 0.42] } },
  { id: "transmover", service: "bluebird", maker: "Toyota", model: "Transmover", short: "Transmover", paint: BLUE, plate: "yellow", sign: "blue",
    blurb: { en: "Toyota's taxi-only MPV, built on the Avanza. It comes first whenever Bluebird lists its regular fleet.", id: "MPV khusus taksi dari Toyota, berbasis Avanza. Selalu disebut pertama setiap kali Bluebird merinci armada regulernya." },
    body: { en: "Compact MPV", id: "MPV kompak" }, seats: "7", power: { en: "Petrol", id: "Bensin" }, note: { en: "Named in the 2025 fleet line-up", id: "Masuk jajaran armada 2025" },
    ratings: { capacity: 6, comfort: 5, eco: 5, agility: 8 },
    scan: { src: "/models/bluebird/toyota-transmover.glb" },
    // Real length; width and height sit between the real car (1.73 × 1.7 m) and the chunkier scan.
    profile: { L: 4.4, W: 1.77, H: 1.71, wb: 2.75, fo: 0.83, wr: 0.32, hoodH: 0.97, cowlX: 1.0, cowlH: 1.06, roofX0: 1.72, roofX1: 4.02, rearX: 4.3, rearH: 1.08, tailH: 1.05, tumble: 0.92 } },
  { id: "mobilio", service: "bluebird", maker: "Honda", model: "Mobilio", short: "Mobilio", paint: BLUE, plate: "yellow", sign: "blue",
    blurb: { en: "Honda's low-roof seven-seater in Bluebird blue. It shares regular taxi duty with the Transmover.", id: "Mobil tujuh penumpang beratap rendah dari Honda, berwarna biru Bluebird. Bertugas sebagai taksi reguler bersama Transmover." },
    body: { en: "Compact MPV", id: "MPV kompak" }, seats: "7", power: { en: "Petrol", id: "Bensin" }, note: { en: "Named in the 2025 fleet line-up", id: "Masuk jajaran armada 2025" },
    ratings: { capacity: 6, comfort: 5, eco: 6, agility: 8 },
    // The scan's roof sign is wide enough to pass for roof, so the loader is given the roof and body under it.
    scan: { src: "/models/bluebird/honda-mobilio.glb", fit: { roof: 39.3, halfWidth: 20.8 } },
    // Real length; width and height sit between the real car (1.68 × 1.6 m) and the chunkier scan.
    profile: { L: 4.39, W: 1.77, H: 1.68, wb: 2.65, fo: 0.86, wr: 0.31, hoodH: 0.9, cowlX: 0.98, cowlH: 1.0, roofX0: 1.78, roofX1: 3.98, drop: 0.07, rearX: 4.28, rearH: 1.06, tailH: 1.03, tumble: 0.91 } },
  { id: "brv", service: "bluebird", maker: "Honda", model: "BR-V", short: "BR-V", paint: BLUE, plate: "yellow", sign: "blue",
    blurb: { en: "Honda's seven-seat crossover, with a little more ground clearance than the MPVs it works alongside.", id: "Crossover tujuh penumpang dari Honda, dengan jarak bebas ke tanah sedikit lebih tinggi daripada MPV yang bertugas bersamanya." },
    body: { en: "Crossover MPV", id: "MPV crossover" }, seats: "7", power: { en: "Petrol", id: "Bensin" }, note: { en: "Pictured in Bluebird livery", id: "Tampil dalam livery Bluebird" },
    ratings: { capacity: 6, comfort: 6, eco: 5, agility: 7 },
    scan: { src: "/models/bluebird/honda-brv.glb" },
    // Real length; width and height sit between the real car (1.78 × 1.69 m) and the chunkier scan.
    profile: { L: 4.49, W: 1.83, H: 1.72, wb: 2.7, fo: 0.9, wr: 0.35, gc: 0.24, hoodH: 1.03, cowlX: 1.1, cowlH: 1.11, roofX0: 1.86, roofX1: 4.1, rearX: 4.38, rearH: 1.13, tailH: 1.1, tumble: 0.91, rails: 1, clad: 1 } },
  { id: "m6", service: "bluebird", maker: "BYD", model: "M6", short: "BYD M6", paint: BLUE, plate: "yellow", sign: "blue",
    blurb: { en: "A three-row electric MPV. Bluebird named it in its fleet line-up for the group's 53rd anniversary.", id: "MPV listrik tiga baris. Bluebird memasukkannya ke jajaran armada pada ulang tahun ke-53 grup." },
    body: { en: "Electric MPV", id: "MPV listrik" }, seats: { en: "6 or 7", id: "6 atau 7" }, power: { en: "Electric", id: "Listrik" }, note: { en: "Named in the 2025 fleet line-up", id: "Masuk jajaran armada 2025" },
    ratings: { capacity: 6, comfort: 7, eco: 10, agility: 6 },
    scan: { src: "/models/bluebird/byd-m6.glb" },
    // Real length; width and height sit between the real car (1.81 × 1.69 m) and the chunkier scan.
    profile: { L: 4.71, W: 1.86, H: 1.75, wb: 2.8, fo: 0.93, wr: 0.34, hoodH: 0.96, noseX: 0.05, cowlX: 0.98, cowlH: 1.06, roofX0: 1.8, roofX1: 4.32, drop: 0.06, rearX: 4.61, rearH: 1.1, tailH: 1.07, tumble: 0.92, tail: "bar", gr: 0, hl: [0.07, 0.42] } },
  { id: "alphard", service: "silverbird", maker: "Toyota", model: "Alphard", short: "Alphard", paint: "#0b0c10", plate: "yellow", sign: "silver",
    blurb: { en: "The executive taxi, in black. Silverbird has run since 1993 and was the first executive taxi service in Indonesia.", id: "Taksi eksekutif berwarna hitam. Silverbird beroperasi sejak 1993 dan merupakan layanan taksi eksekutif pertama di Indonesia." },
    body: { en: "Luxury MPV", id: "MPV mewah" }, seats: "7", power: { en: "Petrol", id: "Bensin" }, note: { en: "Named in the 2025 fleet line-up", id: "Masuk jajaran armada 2025" },
    ratings: { capacity: 6, comfort: 10, eco: 4, agility: 5 },
    scan: { src: "/models/silverbird/toyota-alphard.glb" },
    profile: { L: 5.01, W: 1.85, H: 1.95, wb: 3.0, fo: 0.93, wr: 0.36, gc: 0.19, hoodH: 1.12, cowlX: 0.92, cowlH: 1.2, roofX0: 1.62, roofX1: 4.78, drop: 0.04, rearX: 4.93, rearH: 1.22, tailH: 1.19, tumble: 0.95, gr: [0.5, 1.1], hl: [0.09, 0.4], hlDrop: 0.1 } },
  { id: "modelx", service: "silverbird", maker: "Tesla", model: "Model X", short: "Model X", paint: "#0b0c10", plate: "yellow", sign: "silver",
    blurb: { en: "Five Model X 75Ds opened the electric Silverbird service in 2019, launched on the same day as the BYD e6.", id: "Lima unit Model X 75D membuka layanan Silverbird listrik pada 2019, diluncurkan di hari yang sama dengan BYD e6." },
    body: { en: "Electric SUV", id: "SUV listrik" }, seats: { en: "Up to 7", id: "Hingga 7" }, power: { en: "Electric", id: "Listrik" }, note: { en: "Launched 2019 with 5 cars", id: "Diluncurkan 2019 dengan 5 unit" },
    ratings: { capacity: 6, comfort: 9, eco: 10, agility: 5 },
    // The scan has its falcon-wing doors open, so the loader is given the roof and body under them.
    scan: { src: "/models/silverbird/tesla-model-x.glb", fit: { roof: 36.6, halfWidth: 20.7 } },
    // Real length; width and height sit between the real car (2.0 × 1.68 m) and the chunkier scan.
    profile: { L: 5.04, W: 2.04, H: 1.76, wb: 2.97, fo: 0.96, wr: 0.37, hoodH: 0.86, noseX: 0.1, noseR: 0.2, cowlX: 1.08, cowlH: 1.02, roofX0: 2.1, roofX1: 3.55, drop: 0.13, rearX: 4.82, rearH: 1.12, tailH: 1.06, tumble: 0.88, tail: "bar", gr: 0, hl: [0.07, 0.4], hlDrop: 0.12 } },
  { id: "d9", service: "goldenbird", maker: "Denza", model: "D9", short: "Denza D9", paint: "#0d0e12", plate: "white",
    blurb: { en: "BYD's premium electric MPV. Bluebird announced it in March 2025 as a new Goldenbird car.", id: "MPV listrik premium dari BYD. Bluebird mengumumkannya pada Maret 2025 sebagai armada baru Goldenbird." },
    body: { en: "Electric luxury MPV", id: "MPV listrik mewah" }, seats: "7", power: { en: "Electric", id: "Listrik" }, note: { en: "Announced March 2025", id: "Diumumkan Maret 2025" },
    ratings: { capacity: 6, comfort: 10, eco: 10, agility: 4 },
    scan: { src: "/models/goldenbird/denza-d9.glb" },
    profile: { L: 5.25, W: 1.96, H: 1.92, wb: 3.11, fo: 0.98, wr: 0.37, hoodH: 1.1, cowlX: 0.98, cowlH: 1.18, roofX0: 1.72, roofX1: 5.0, rearX: 5.17, rearH: 1.21, tailH: 1.18, tumble: 0.95, tail: "bar", gr: [0.42, 1.2], hl: [0.07, 0.44], hlDrop: 0.1 } },
  { id: "ioniq5", service: "goldenbird", maker: "Hyundai", model: "Ioniq 5", short: "Ioniq 5", paint: "#0b0c10", plate: "white",
    blurb: { en: "Hyundai's electric crossover, offered through the Goldenbird rental service.", id: "Crossover listrik dari Hyundai, tersedia melalui layanan sewa Goldenbird." },
    body: { en: "Electric crossover", id: "Crossover listrik" }, seats: "5", power: { en: "Electric", id: "Listrik" }, note: { en: "Reported in the fleet, 2023", id: "Tercatat dalam armada, 2023" },
    ratings: { capacity: 4, comfort: 8, eco: 10, agility: 7 },
    scan: { src: "/models/goldenbird/hyundai-ioniq5.glb" },
    // Real length; width and height sit between the real car (1.89 × 1.6 m) and the chunkier scan.
    profile: { L: 4.64, W: 1.98, H: 1.66, wb: 3.0, fo: 0.85, wr: 0.37, hoodH: 0.92, noseX: 0.05, cowlX: 1.08, cowlH: 1.0, roofX0: 1.92, roofX1: 3.9, drop: 0.09, rearX: 4.48, rearH: 1.08, tailH: 1.04, tail: "bar", gr: 0, hl: [0.07, 0.5], panes: 2 } },
  { id: "ix", service: "goldenbird", maker: "BMW", model: "iX", short: "BMW iX", paint: "#0b0c10", plate: "white",
    blurb: { en: "Joined the electric Goldenbird range in 2023 through a tie-up with BMW Indonesia.", id: "Bergabung dengan jajaran Goldenbird listrik pada 2023 lewat kerja sama dengan BMW Indonesia." },
    body: { en: "Electric SUV", id: "SUV listrik" }, seats: "5", power: { en: "Electric", id: "Listrik" }, note: { en: "Joined in 2023", id: "Bergabung pada 2023" },
    ratings: { capacity: 4, comfort: 9, eco: 10, agility: 5 },
    scan: { src: "/models/goldenbird/bmw-ix.glb" },
    // Real length; width and height sit between the real car (1.97 × 1.7 m) and the chunkier scan.
    profile: { L: 4.95, W: 2.02, H: 1.75, wb: 3.0, fo: 0.9, wr: 0.39, gc: 0.21, hoodH: 1.04, noseX: 0.05, cowlX: 1.16, cowlH: 1.12, roofX0: 2.02, roofX1: 4.15, drop: 0.1, rearX: 4.8, rearH: 1.16, tailH: 1.1, tail: "bar", gr: [0.36, 0.5], hl: [0.06, 0.4], hlDrop: 0.12, clad: 1 } },
  { id: "hiace", service: "bigbird", maker: "Toyota", model: "Hiace Commuter", short: "Hiace Commuter", paint: "#e4e9ee", plate: "yellow",
    blurb: { en: "The group's people-mover van, listed for both Goldenbird rental and Bigbird charter work.", id: "Van angkut penumpang milik grup, tersedia untuk sewa Goldenbird maupun carter Bigbird." },
    body: { en: "Passenger van", id: "Van penumpang" }, seats: { en: "Up to 16", id: "Hingga 16" }, power: "Diesel", note: { en: "Named in the 2025 fleet line-up", id: "Masuk jajaran armada 2025" },
    ratings: { capacity: 8, comfort: 5, eco: 3, agility: 4 },
    scan: { src: "/models/bigbird/toyota-hiace.glb" },
    // The scan is the cab-over H200 Commuter, and its proportions match the real van, so it takes the real size.
    profile: { L: 5.38, W: 1.88, H: 2.28, wb: 3.11, fo: 0.98, wr: 0.34, hoodH: 1.02, cowlX: 0.34, cowlH: 1.14, roofX0: 1.05, roofX1: 5.24, drop: 0, rearX: 5.31, rearH: 1.2, tailH: 1.17, tumble: 0.97, panes: 4, gr: [0.14, 0.9], hl: [0.14, 0.36], hlDrop: 0.14 } },
  { id: "coach", service: "bigbird", maker: "Bigbird", model: "Charter Coach", short: "Charter Coach", paint: "#3f97dd", plate: "yellow",
    blurb: { en: "A full-size charter bus. Bigbird was set up in December 1978 and started running the following year.", id: "Bus carter ukuran penuh. Bigbird didirikan pada Desember 1978 dan mulai beroperasi setahun kemudian." },
    body: { en: "Coach bus", id: "Bus pariwisata" }, seats: { en: "Varies by bus", id: "Tergantung bus" }, power: "Diesel", note: { en: "Bus arm since 1979", id: "Lini bus sejak 1979" },
    ratings: { capacity: 10, comfort: 7, eco: 3, agility: 1 },
    scan: { src: "/models/bigbird/charter-coach.glb" },
    // Real length; height and width sit between a real high-deck coach (about 3.8 × 2.5 m) and the much chunkier
    // scan, so its wheels stay nearly round.
    profile: { L: 12, W: 2.8, H: 4.2, wb: 6.0, fo: 2.65, wr: 0.5, gc: 0.34, tw: 0.3, hoodH: 1.7, noseR: 0.12, cowlX: 0.09, cowlH: 1.75, roofX0: 0.42, roofX1: 11.86, drop: 0, rearX: 11.9, rearH: 1.78, tailH: 1.74, tailR: 0.12, tumble: 0.985, panes: 7, winTop: 3.12, gr: 0, hl: [0.14, 0.5], hlDrop: 0.95, bus: 1 } },
  { id: "jetbus", service: "cititrans", maker: "Hino RM280", model: "Jetbus 5", short: "Jetbus 5", paint: "#eef1f4", plate: "yellow",
    blurb: { en: "The Cititrans Busline coach: a Hino RM280 chassis under Adiputro's Jetbus 5 body, in a 28-seat Super Executive layout.", id: "Bus Cititrans Busline: sasis Hino RM280 berbalut bodi Jetbus 5 buatan Adiputro, dengan tata letak 28 kursi Super Executive." },
    body: { en: "Executive coach", id: "Bus eksekutif" }, seats: "28", power: "Diesel", note: { en: "Cititrans joined the group in 2019", id: "Cititrans bergabung dengan grup pada 2019" },
    ratings: { capacity: 9, comfort: 9, eco: 3, agility: 1 },
    scan: { src: "/models/cititrans/hino-jetbus5.glb" },
    // Real length; height and width sit between the real coach (about 3.7 × 2.5 m) and the much chunkier scan,
    // so its wheels stay nearly round.
    profile: { L: 12, W: 2.75, H: 4.1, wb: 5.9, fo: 2.7, wr: 0.5, gc: 0.34, tw: 0.3, hoodH: 1.75, noseX: 0.05, noseR: 0.14, cowlX: 0.12, cowlH: 1.8, roofX0: 0.7, roofX1: 11.8, drop: 0, rearX: 11.9, rearH: 1.9, tailH: 1.85, tailR: 0.14, tumble: 0.985, panes: 6, winTop: 3.3, gr: 0, hl: [0.12, 0.55], hlDrop: 0.95, bus: 1 } },
  { id: "torana", service: "heritage", maker: "Holden", model: "Torana", short: "Torana", paint: "#3b78c2", plate: "yellow", sign: "blue",
    blurb: { en: "Where it began. 25 Toranas made up the first Blue Bird fleet in 1972, and one is kept on display at head office in Jakarta.", id: "Di sinilah semuanya bermula. 25 unit Torana menjadi armada pertama Blue Bird pada 1972, dan satu di antaranya dipajang di kantor pusat di Jakarta." },
    body: "Sedan", seats: "5", power: { en: "Petrol", id: "Bensin" }, note: { en: "First fleet, 1972", id: "Armada pertama, 1972" },
    ratings: { capacity: 4, comfort: 3, eco: 2, agility: 8 },
    scan: { src: "/models/heritage/holden-torana.glb" },
    // Real length; width and height sit between the real car (1.6 × 1.34 m) and the chunkier scan.
    profile: { L: 4.39, W: 1.7, H: 1.39, wb: 2.54, fo: 0.76, wr: 0.3, gc: 0.17, hoodH: 0.8, noseR: 0.08, cowlX: 1.45, cowlH: 0.86, roofX0: 1.88, roofX1: 2.95, drop: 0.02, rearX: 3.45, rearH: 0.86, tailH: 0.82, tailR: 0.07, tumble: 0.86, panes: 2, tail: "h", gr: [0.13, 0.9], hl: "round", chrome: 1 } },
  { id: "limo", service: "heritage", maker: "Toyota", model: "Limo", short: "Toyota Limo", paint: BLUE, plate: "yellow", sign: "blue",
    blurb: { en: "The Vios-based sedan that carried the old Blue Bird livery, before MPVs took over regular taxi work.", id: "Sedan berbasis Vios yang membawa livery lama Blue Bird, sebelum MPV mengambil alih tugas taksi reguler." },
    body: "Sedan", seats: "5", power: { en: "Petrol", id: "Bensin" }, note: { en: "Wore the pre-2018 livery", id: "Berlivery sebelum 2018" },
    ratings: { capacity: 4, comfort: 5, eco: 5, agility: 8 },
    scan: { src: "/models/heritage/toyota-limo.glb" },
    // Real length; width and height sit between the real car (1.7 × 1.47 m) and the chunkier scan.
    profile: { L: 4.41, W: 1.76, H: 1.52, wb: 2.55, fo: 0.9, wr: 0.31, hoodH: 0.84, noseX: 0.05, cowlX: 1.15, cowlH: 0.94, roofX0: 1.92, roofX1: 3.15, drop: 0.04, rearX: 3.85, rearH: 1.0, tailH: 0.97, tumble: 0.88, panes: 2, tail: "h", gr: [0.1, 0.8] } },
  { id: "bmw-2002", service: "heritage", maker: "BMW", model: "2002", short: "BMW 2002", paint: "#3f7fcf", plate: "yellow", sign: "silver",
    blurb: { en: "A blue BMW 2002 with a white roof, dressed as a classic taxi. It isn't part of Bluebird's recorded fleet; it's here as a showroom piece from the same era as the first Toranas.", id: "BMW 2002 biru beratap putih, didandani sebagai taksi klasik. Mobil ini bukan bagian dari armada Bluebird yang tercatat; ia hadir sebagai pajangan dari era yang sama dengan Torana pertama." },
    body: "Sedan", seats: "5", power: { en: "Petrol", id: "Bensin" }, note: { en: "Showroom piece, 1970s classic", id: "Pajangan, mobil klasik 1970-an" },
    ratings: { capacity: 4, comfort: 4, eco: 2, agility: 8 },
    scan: { src: "/models/heritage/bmw-2002.glb" },
    // Real length; width and height sit between the real car (1.59 × 1.41 m) and the chunkier scan,
    // so the scan isn't squashed enough to turn its wheels oval.
    profile: { L: 4.23, W: 1.7, H: 1.5, wb: 2.5, fo: 0.73, wr: 0.3, gc: 0.16, hoodH: 0.82, noseR: 0.06, cowlX: 1.3, cowlH: 0.9, roofX0: 1.75, roofX1: 2.85, drop: 0.02, rearX: 3.3, rearH: 0.88, tailH: 0.84, tailR: 0.06, tumble: 0.86, panes: 2, tail: "h", gr: [0.14, 0.5], hl: "round", chrome: 1 } },
];
