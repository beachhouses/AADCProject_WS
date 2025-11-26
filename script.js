let allCinemas = [];
let allGenres = new Set();

const els = {
  searchInput: document.getElementById("searchInput"),
  cityFilter: document.getElementById("cityFilter"),
  ageFilter: document.getElementById("ageFilter"),
  genreFilter: document.getElementById("genreFilter"),
  cinemaGrid: document.getElementById("cinemaGrid"),
  btnSearch: document.getElementById("btnSearch"),
  btnExploreMovies: document.getElementById("btnExploreMovies"),

  // hero
  heroMovieTitle: document.getElementById("heroMovieTitle"),
  heroMovieYear: document.getElementById("heroMovieYear"),
  heroMovieDesc: document.getElementById("heroMovieDesc"),
  heroCinemaName: document.getElementById("heroCinemaName"),
  heroThumbnails: document.getElementById("heroThumbnails"),

  // modal
  modal: document.getElementById("movieModal"),
  modalCloseBtn: document.getElementById("modalCloseBtn"),
  modalCinemaName: document.getElementById("modalCinemaName"),
  modalCinemaMeta: document.getElementById("modalCinemaMeta"),
  modalMoviesList: document.getElementById("modalMoviesList"),
};

async function loadData() {
  try {
    const res = await fetch("data.json");
    const data = await res.json();
    allCinemas = data.cinemas || [];

    if (!allCinemas.length) {
      els.cinemaGrid.innerHTML =
        '<div class="empty-state">Data bioskop kosong. Pastikan <code>data.json</code> berisi data hasil konversi dari Turtle.</div>';
      return;
    }

    fillFilters();
    renderHero();
    renderCinemas(allCinemas);
    bindEvents();
  } catch (err) {
    console.error(err);
    els.cinemaGrid.innerHTML =
      '<div class="empty-state">Gagal memuat <code>data.json</code>. Cek lokasi file dan jalankan via server lokal jika perlu.</div>';
  }
}

function fillFilters() {
  const cities = new Set();

  allCinemas.forEach((c) => {
    if (c.city) cities.add(c.city);
    (c.movies || []).forEach((m) =>
      (m.genres || []).forEach((g) => allGenres.add(g))
    );
  });

  Array.from(cities)
    .sort((a, b) => a.localeCompare(b))
    .forEach((city) => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      els.cityFilter.appendChild(opt);
    });

  Array.from(allGenres)
    .sort((a, b) => a.localeCompare(b))
    .forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      els.genreFilter.appendChild(opt);
    });
}

function renderHero() {
  // Ambil beberapa film pertama untuk hero
  const movies = [];
  allCinemas.forEach((c) => {
    (c.movies || []).forEach((m) => movies.push({ cinema: c, movie: m }));
  });

  if (!movies.length) return;

  const first = movies[0];
  els.heroMovieTitle.textContent = first.movie.title || "Now Showing";
  els.heroCinemaName.textContent = first.cinema.name || "Cinema";
  els.heroMovieYear.textContent = first.movie.year
    ? `(${first.movie.year})`
    : "";

  const anyGenre = (first.movie.genres || []).slice(0, 2).join(", ");
  const anyScreen = (first.movie.screenTypes || []).join(", ");

  els.heroMovieDesc.textContent =
    `Sedang tayang di ${first.cinema.name || "bioskop"} di kota ${
      first.cinema.city || "-"
    }. Genre: ${anyGenre || "-"}, tipe layar: ${
      anyScreen || "-"
    }. Lihat detail film lain dengan sekali pencarian.`;

  // Thumbnail list
  const container = document.createElement("div");
  const title = document.createElement("div");
  title.className = "hero-thumb-title";
  title.textContent = "Now Showing in North Sumatera";
  container.appendChild(title);

  const row = document.createElement("div");
  row.className = "hero-thumb-row";

  movies.slice(0, 8).forEach(({ cinema, movie }) => {
    const card = document.createElement("div");
    card.className = "hero-thumb-card";

    const img = document.createElement("div");
    img.className = "hero-thumb-image";
    card.appendChild(img);

    const body = document.createElement("div");
    body.className = "hero-thumb-body";

    const mt = document.createElement("div");
    mt.className = "hero-thumb-movie-title";
    mt.textContent = movie.title || "Untitled";
    body.appendChild(mt);

    const meta = document.createElement("div");
    meta.textContent = cinema.city ? cinema.city : "";
    body.appendChild(meta);

    card.appendChild(body);
    row.appendChild(card);
  });

  container.appendChild(row);
  els.heroThumbnails.innerHTML = "";
  els.heroThumbnails.appendChild(container);
}

function bindEvents() {
  els.btnSearch.addEventListener("click", applyFilters);
  els.searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") applyFilters();
  });
  els.cityFilter.addEventListener("change", applyFilters);
  els.ageFilter.addEventListener("change", applyFilters);
  els.genreFilter.addEventListener("change", applyFilters);

  els.btnExploreMovies.addEventListener("click", () => {
    document
      .getElementById("cinemaCategories")
      .scrollIntoView({ behavior: "smooth" });
  });

  // Delegasi klik untuk tombol detail pada card
  els.cinemaGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-detail");
    if (!btn) return;
    const id = btn.dataset.id;
    const cinema = allCinemas.find((c) => c.id === id);
    if (cinema) openModal(cinema);
  });

  // Modal
  els.modalCloseBtn.addEventListener("click", closeModal);
  els.modal.addEventListener("click", (e) => {
    if (e.target === els.modal.querySelector(".modal-backdrop")) {
      closeModal();
    }
  });
}

function applyFilters() {
  const q = els.searchInput.value.trim().toLowerCase();
  const city = els.cityFilter.value;
  const age = els.ageFilter.value;
  const genre = els.genreFilter.value;

  const filtered = allCinemas.filter((cinema) => {
    if (city && cinema.city !== city) return false;

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
      '<div class="empty-state">Tidak ada bioskop yang cocok dengan filter pencarian.</div>';
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

    const body = document.createElement("div");
    body.className = "cinema-card-body";

    const tag = document.createElement("div");
    tag.className = "cinema-tag";
    tag.textContent = "Cinema Point";
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

    const btn = document.createElement("button");
    btn.className = "btn-detail";
    btn.textContent = "View Movies";
    btn.dataset.id = cinema.id;
    footer.appendChild(btn);

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

function openModal(cinema) {
  els.modalCinemaName.textContent = cinema.name || "Cinema";
  els.modalCinemaMeta.textContent = cinema.city
    ? `${cinema.city} • ${cinema.address || ""}`
    : cinema.address || "";

  const list = document.createElement("div");
  list.className = "modal-movies-list";

  if (!cinema.movies || !cinema.movies.length) {
    list.innerHTML =
      '<div class="empty-state">Belum ada data film untuk bioskop ini.</div>';
  } else {
    cinema.movies.forEach((m) => {
      const card = document.createElement("div");
      card.className = "modal-movie-card";

      const title = document.createElement("div");
      title.className = "modal-movie-title";
      title.textContent = m.title || "Untitled";
      card.appendChild(title);

      const meta = document.createElement("div");
      meta.className = "modal-movie-meta";
      const parts = [];
      if (m.director) parts.push(`Director: ${m.director}`);
      if (m.durationMinutes) parts.push(`${m.durationMinutes} minutes`);
      if (m.ageRating) parts.push(`Rating usia: ${m.ageRating}`);
      meta.textContent = parts.join(" • ");
      card.appendChild(meta);

      const tags = document.createElement("div");
      tags.className = "modal-movie-tags";

      (m.genres || []).forEach((g) => {
        const span = document.createElement("span");
        span.className = "modal-tag";
        span.textContent = g;
        tags.appendChild(span);
      });

      (m.screenTypes || []).forEach((s) => {
        const span = document.createElement("span");
        span.className = "modal-tag";
        span.textContent = s;
        tags.appendChild(span);
      });

      if (tags.childElementCount) card.appendChild(tags);

      if (m.sinopsisUrl) {
        const linkWrap = document.createElement("div");
        linkWrap.className = "modal-link";
        const a = document.createElement("a");
        a.href = m.sinopsisUrl;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = "Lihat sinopsis";
        linkWrap.appendChild(a);
        card.appendChild(linkWrap);
      }

      list.appendChild(card);
    });
  }

  els.modalMoviesList.innerHTML = "";
  els.modalMoviesList.appendChild(list);

  els.modal.classList.remove("hidden");
}

function closeModal() {
  els.modal.classList.add("hidden");
}

// start
loadData();