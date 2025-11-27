let allCinemas = [];
let allGenres = new Set();

const els = {
  // search/filter
  searchInput: document.getElementById("searchInput"),
  ageFilter: document.getElementById("ageFilter"),
  genreFilter: document.getElementById("genreFilter"),
  cinemaGrid: document.getElementById("cinemaGrid"),
  btnSearch: document.getElementById("btnSearch"),
  btnExploreMovies: document.getElementById("btnExploreMovies"),

  // kategori di body
  brandList: document.getElementById("brandList"),
  cityList: document.getElementById("cityList"),

  // hero utama
  heroBg: document.querySelector(".hero-bg"),
  heroTitle: document.querySelector(".hero-title"),
  heroDesc: document.querySelector(".hero-desc"),
  heroYear: document.querySelector(".hero-rating .year"),
  heroStars: document.querySelector(".hero-rating .stars"),

  // strip now showing (kartu kecil)
  heroThumbnails: document.getElementById("heroThumbnails"),

  // nav dropdown menu
  navCinemaMenu: document.getElementById("navCinemaMenu"),
  navCityMenu: document.getElementById("navCityMenu"),
};

const filters = {
  city: "",
  brand: "",
};

function getBrandFromName(name) {
  if (!name) return "Other";
  const n = name.toLowerCase();
  if (n.includes("cgv")) return "CGV";
  if (n.includes("cinepolis") || n.includes("cinépolis")) return "Cinépolis";
  if (n.includes("xxi")) return "Cinema XXI";
  return "Other";
}

async function loadData() {
  try {
    const res = await fetch("data.json");
    const data = await res.json();

    allCinemas = (data.cinemas || []).map((c) => ({
      ...c,
      brand: getBrandFromName(c.name),
    }));

    if (!allCinemas.length) {
      els.cinemaGrid.innerHTML =
        '<div class="empty-state">Data bioskop kosong. Pastikan <code>data.json</code> benar.</div>';
      return;
    }

    fillFiltersAndCategories();
    renderHeroDynamic();
    renderNowShowingStrip();
    renderCinemas(allCinemas);
    bindEvents();

  } catch (e) {
    console.error(e);
    els.cinemaGrid.innerHTML =
      '<div class="empty-state">Gagal memuat <code>data.json</code>.</div>';
  }
}

const carousel = document.getElementById("heroThumbnails");
const btnLeft = document.getElementById("arrowLeft");
const btnRight = document.getElementById("arrowRight");

// Clone untuk efek infinite scroll
function cloneCarouselItems() {
  const cards = [...carousel.children];
  cards.forEach((card) => {
    const clone = card.cloneNode(true);
    carousel.appendChild(clone);
  });
}
cloneCarouselItems();

btnLeft.addEventListener("click", () => {
  carousel.scrollBy({ left: -250, behavior: "smooth" });
});

btnRight.addEventListener("click", () => {
  carousel.scrollBy({ left: 250, behavior: "smooth" });
});

// Auto scroll pelan terus (bisa kamu ubah speed)
let autoScroll = setInterval(() => {
  carousel.scrollBy({ left: 1, behavior: "smooth" });
}, 35);

// Pause kalau user hover
carousel.addEventListener("mouseenter", () => clearInterval(autoScroll));
carousel.addEventListener("mouseleave", () => {
  autoScroll = setInterval(() => {
    carousel.scrollBy({ left: 1, behavior: "smooth" });
  }, 35);
});

function fillFiltersAndCategories() {
  const cities = new Set();
  const brands = new Set();

  allCinemas.forEach((c) => {
    if (c.city) cities.add(c.city);
    if (c.brand && c.brand !== "Other") brands.add(c.brand);
    (c.movies || []).forEach((m) =>
      (m.genres || []).forEach((g) => allGenres.add(g))
    );
  });

  // isi dropdown genre (filter di body)
if (els.genreFilter) {
  Array.from(allGenres)
    .sort((a, b) => a.localeCompare(b))
    .forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      els.genreFilter.appendChild(opt);
    });
}

  const brandArr = Array.from(brands);
  const cityArr = Array.from(cities).sort((a, b) => a.localeCompare(b));

  // body cards: cuma dibikin kalau elemen-nya ada
  if (els.brandList && els.cityList) {
    buildCategoryListBody(els.brandList, brandArr, "brand");
    buildCategoryListBody(els.cityList, cityArr, "city");
  }

  // dropdown di navbar
  buildNavDropdownMenus(brandArr, cityArr);
}

/* ====== HERO DINAMIS (AUTO SLIDE) ====== */
let heroIndex = 0;
let heroMovies = [];

function renderHeroDynamic() {
  const movies = [];
  allCinemas.forEach((c) => {
    (c.movies || []).forEach((m) => movies.push({ cinema: c, movie: m }));
  });
  if (!movies.length) return;

  // urutkan, biar yang "Sampai Titik Terakhirmu" tetap muncul pertama
  heroMovies = [
    ...movies.filter((x) =>
      (x.movie.title || "").toLowerCase().includes("sampai titik terakhir")
    ),
    ...movies.filter(
      (x) =>
        !(x.movie.title || "")
          .toLowerCase()
          .includes("sampai titik terakhir")
    ),
  ];

  updateHeroSlide(); // tampilkan pertama kali
  setInterval(nextHeroSlide, 6000); // ganti tiap 6 detik
}

function updateHeroSlide() {
  if (!heroMovies.length) return;
  const { cinema, movie } = heroMovies[heroIndex];

  els.heroContent = els.heroContent || document.querySelector(".hero-content");
  els.heroContent.classList.add("fade-out");

  setTimeout(() => {
    // Ganti data hero
    els.heroTitle.textContent = movie.title || "Now Showing";
    els.heroYear.textContent = movie.year ? `(${movie.year})` : "(2025)";

    let starsText = "★★★★★";
    if (movie.ratingScore != null) {
      const score = Number(movie.ratingScore);
      const full = Math.round(score);
      starsText = "★★★★★"
        .split("")
        .map((s, i) => (i < full ? "★" : "☆"))
        .join("");
    }
    els.heroStars.textContent = starsText;

    if (movie.synopsisEn) {
      els.heroDesc.textContent = movie.synopsisEn;
    } else {
      const g = (movie.genres || []).join(", ") || "various genres";
      const screen = (movie.screenTypes || []).join(", ") || "standard 2D";
      els.heroDesc.textContent = `Now playing at ${cinema.name ||
        "your favorite cinema"} in ${cinema.city ||
        "North Sumatera"}. Genre: ${g}, screen type: ${screen}.`;
    }

    // background hero: pakai heroBgUrl > posterUrl > default
    if (els.heroBg) {
      const bg =
        movie.heroBgUrl ||
        movie.posterUrl ||
        "hero-placeholder.jpg";
      els.heroBg.style.backgroundImage = `url("${bg}")`;
    }

    // animasi fade-in
    els.heroContent.classList.remove("fade-out");
    els.heroContent.classList.add("fade-in");
  }, 400);
}

function nextHeroSlide() {
  heroIndex = (heroIndex + 1) % heroMovies.length;
  updateHeroSlide();
}



/* ====== NOW SHOWING STRIP (kartu kecil di bawah hero) ====== */

function renderNowShowingStrip() {
  if (!els.heroThumbnails) return;

  const movies = [];
  allCinemas.forEach((c) =>
    (c.movies || []).forEach((m) => movies.push({ cinema: c, movie: m }))
  );
  els.heroThumbnails.innerHTML = "";

  movies.slice(0, 12).forEach(({ cinema, movie }) => {
    const card = document.createElement("div");
    card.className = "thumb-card";

    const img = document.createElement("div");
    img.className = "hero-thumb-upper";
    if (movie.posterUrl) {
      img.style.backgroundImage = `url("${movie.posterUrl}")`;
      img.style.backgroundSize = "cover";
      img.style.backgroundPosition = "center";
    }
    card.appendChild(img);

    const lower = document.createElement("div");
    lower.className = "thumb-meta";
    const t = document.createElement("h4");
    t.textContent = movie.title || "Untitled";
    const c = document.createElement("p");
    c.textContent = cinema.city || "";
    lower.appendChild(t);
    lower.appendChild(c);

    card.appendChild(lower);

    if (movie.id) {
      card.addEventListener("click", () => {
        window.location.href = `movie.html?movie=${encodeURIComponent(
          movie.id
        )}`;
      });
    }

    els.heroThumbnails.appendChild(card);
  });
}

/* ====== KATEGORI DI BODY ====== */

function buildCategoryListBody(container, items, type) {
  container.innerHTML = "";
  items.forEach((label) => {
    const item = document.createElement("div");
    item.className = "category-item";
    item.textContent = label;
    item.dataset.value = label;
    item.dataset.type = type;

    if (type === "brand") {
      if (label === "Cinema XXI") item.classList.add("brand-XXI");
      if (label === "CGV") item.classList.add("brand-CGV");
      if (label === "Cinépolis") item.classList.add("brand-Cinepolis");
    }

    item.addEventListener("click", () => {
      if (type === "city") {
        filters.city = filters.city === label ? "" : label;
      } else {
        filters.brand = filters.brand === label ? "" : label;
      }
      updateCategoryActiveBody();
      applyFilters();
    });

    container.appendChild(item);
  });

  updateCategoryActiveBody();
}

function updateCategoryActiveBody() {
  document.querySelectorAll(".category-item").forEach((el) => {
    const type = el.dataset.type;
    const val = el.dataset.value;
    const active =
      (type === "city" && filters.city === val) ||
      (type === "brand" && filters.brand === val);
    el.classList.toggle("active", active);
  });
}

/* ====== NAV DROPDOWN MENUS ====== */

function buildNavDropdownMenus(brands, cities) {
  // cinema brands
  els.navCinemaMenu.innerHTML = "";
  brands.forEach((b) => {
    const div = document.createElement("div");
    div.className = "nav-drop-item nav-drop-brand";
    if (b === "Cinema XXI") div.classList.add("brand-XXI");
    if (b === "CGV") div.classList.add("brand-CGV");
    if (b === "Cinépolis") div.classList.add("brand-Cinepolis");
    div.textContent = b;

    div.addEventListener("click", () => {
      filters.brand = filters.brand === b ? "" : b;
      applyFilters();
      closeAllNavDropdowns();
      document
        .getElementById("cinemaCategories")
        .scrollIntoView({ behavior: "smooth" });
    });

    els.navCinemaMenu.appendChild(div);
  });

  // cities
  els.navCityMenu.innerHTML = "";
  cities.forEach((city) => {
    const div = document.createElement("div");
    div.className = "nav-drop-item nav-drop-city";
    div.textContent = city;

    div.addEventListener("click", () => {
      filters.city = filters.city === city ? "" : city;
      applyFilters();
      closeAllNavDropdowns();
      document
        .getElementById("cinemaCategories")
        .scrollIntoView({ behavior: "smooth" });
    });

    els.navCityMenu.appendChild(div);
  });
}

function closeAllNavDropdowns() {
  document
    .querySelectorAll(".nav-dropdown")
    .forEach((el) => el.classList.remove("open"));
}

/* ====== FILTER & GRID BIOSKOP ====== */

function bindEvents() {
  els.btnSearch.addEventListener("click", applyFilters);
  els.searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") applyFilters();
  });

  // kalau dropdown Age & Genre dihapus, amanin aja:
  if (els.ageFilter) els.ageFilter.addEventListener("change", applyFilters);
  if (els.genreFilter) els.genreFilter.addEventListener("change", applyFilters);
}

  // nav dropdown toggle
  document
    .querySelectorAll(".nav-dropdown-toggle")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const parent = btn.closest(".nav-dropdown");
        const isOpen = parent.classList.contains("open");
        closeAllNavDropdowns();
        if (!isOpen) parent.classList.add("open");
      });
    });

  // klik di luar menutup dropdown
  document.addEventListener("click", () => {
    closeAllNavDropdowns();
  });

function applyFilters() {
  const q = els.searchInput.value.trim().toLowerCase();
  const age = els.ageFilter.value;
const genre = els.genreFilter ? els.genreFilter.value : "";

  const filtered = allCinemas.filter((cinema) => {
    if (filters.city && cinema.city !== filters.city) return false;
    if (filters.brand && cinema.brand !== filters.brand) return false;

    if (age) {
      const hasAge = (cinema.movies || []).some(
        (m) => (m.ageRating || "").toString() === age
      );
      if (!hasAge) return false;
    }

    if (genre) {
      const hasGenre = (cinema.movies || []).some((m) =>
        (m.genres || []).includes(genre)
      );
      if (!hasGenre) return false;
    }

    if (q) {
      const inCinema =
        (cinema.name || "").toLowerCase().includes(q) ||
        (cinema.city || "").toLowerCase().includes(q);

      const inMovies = (cinema.movies || []).some((m) =>
        (m.title || "").toLowerCase().includes(q)
      );

      if (!inCinema && !inMovies) return false;
    }

    return true;
  });

  renderCinemas(filtered);
}

function renderCinemas(cinemas) {
  if (!cinemas.length) {
    els.cinemaGrid.innerHTML =
      '<div class="empty-state">Tidak ada bioskop yang cocok dengan filter.</div>';
    return;
  }

  const frag = document.createDocumentFragment();

  cinemas.forEach((cinema) => {
    const card = document.createElement("article");
    card.className = "cinema-card";

    const top = document.createElement("div");
    top.className = "cinema-card-top";

    const gradient = document.createElement("div");
    gradient.className = "cinema-card-gradient";
    top.appendChild(gradient);
    card.appendChild(top);

    top.className = "cinema-card-top";

    // === TAMBAHAN: pasang gambar sebagai background area atas kartu ===
    if (cinema.imageUrl) {
      top.style.backgroundImage = `url("${cinema.imageUrl}")`;
      top.style.backgroundSize = "cover";
      top.style.backgroundPosition = "center";
    }

    gradient.className = "cinema-card-gradient";
    top.appendChild(gradient);
    card.appendChild(top);

    const body = document.createElement("div");
    body.className = "cinema-card-body";

    const tag = document.createElement("div");
    tag.className = "cinema-tag";
    tag.textContent = cinema.brand || "Cinema";
    body.appendChild(tag);

    const name = document.createElement("div");
    name.className = "cinema-name";
    name.textContent = cinema.name || "Unnamed Cinema";
    body.appendChild(name);

    const city = document.createElement("div");
    city.className = "cinema-city";
    city.textContent = cinema.city || "Unknown city";
    body.appendChild(city);

    if (cinema.address) {
      const addr = document.createElement("div");
      addr.className = "cinema-address";
      addr.textContent = cinema.address;
      body.appendChild(addr);
    }

    const metaRow = document.createElement("div");
    metaRow.className = "cinema-meta-row";

    if (cinema.rating) {
      const badge = document.createElement("span");
      badge.className = "cinema-badge";
      badge.textContent = `Rating ${cinema.rating}`;
      metaRow.appendChild(badge);
    }
    if (cinema.ticketPrice) {
      const badge = document.createElement("span");
      badge.className = "cinema-badge";
      badge.textContent = cinema.ticketPrice;
      metaRow.appendChild(badge);
    }
    if (cinema.totalStudios) {
      const badge = document.createElement("span");
      badge.className = "cinema-badge";
      badge.textContent = `${cinema.totalStudios} studios`;
      metaRow.appendChild(badge);
    }

    body.appendChild(metaRow);

    const footer = document.createElement("div");
    footer.className = "cinema-card-footer";

    const link = document.createElement("a");
    link.className = "btn-detail";
    link.textContent = "View Schedule";
    link.href = `detail.html?cinema=${encodeURIComponent(cinema.id)}`;
    footer.appendChild(link);

    if (cinema.mapLink) {
      const map = document.createElement("a");
      map.href = cinema.mapLink;
      map.target = "_blank";
      map.rel = "noopener noreferrer";
      map.className = "cinema-map-link";
      map.textContent = "View on Maps";
      footer.appendChild(map);
    }

    body.appendChild(footer);
    card.appendChild(body);

    frag.appendChild(card);
  });

  els.cinemaGrid.innerHTML = "";
  els.cinemaGrid.appendChild(frag);
}

// start
loadData();