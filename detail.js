const detailEls = {
  cinemaNameTop: document.getElementById("detailCinemaNameTop"),
  cinemaName: document.getElementById("detailCinemaName"),
  cinemaAddress: document.getElementById("detailCinemaAddress"),
  cinemaMeta: document.getElementById("detailCinemaMeta"),
  mapEmbed: document.getElementById("detailMapEmbed"),
  scheduleSub: document.getElementById("detailScheduleSub"),
  movieList: document.getElementById("detailMovieList"),
  btnNearest: document.getElementById("btnNearest"),
  cinemaPhoto: document.getElementById("detailCinemaPhoto"),
};

function getCinemaIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("cinema");
}

async function loadCinemaDetail() {
  const cinemaId = getCinemaIdFromUrl();
  if (!cinemaId) {
    detailEls.movieList.innerHTML =
      '<div class="empty-state">ID bioskop tidak ditemukan di URL.</div>';
    return;
  }

  try {
    const res = await fetch("data.json");
    const data = await res.json();
    const cinemas = data.cinemas || [];
    const cinema = cinemas.find((c) => c.id === cinemaId);

    if (!cinema) {
      detailEls.movieList.innerHTML =
        '<div class="empty-state">Data bioskop tidak ditemukan di <code>data.json</code>.</div>';
      return;
    }

    renderCinemaHeader(cinema);
    renderMovieSchedule(cinema);
    bindDetailEvents(cinemas);
  } catch (err) {
    console.error(err);
    detailEls.movieList.innerHTML =
      '<div class="empty-state">Gagal memuat data.json.</div>';
  }
}

function renderCinemaHeader(cinema) {
  detailEls.cinemaNameTop.textContent = cinema.name || "Bioskop";
  detailEls.cinemaName.textContent = cinema.name || "Bioskop";

  const addressPieces = [];
  if (cinema.address) addressPieces.push(cinema.address);
  if (cinema.city) addressPieces.push(cinema.city);
  detailEls.cinemaAddress.textContent = addressPieces.join(" • ");

  const metaPieces = [];
  if (cinema.rating) metaPieces.push(`Rating: ${cinema.rating}`);
  if (cinema.ticketPrice) metaPieces.push(cinema.ticketPrice);
  if (cinema.totalStudios) metaPieces.push(`${cinema.totalStudios} studio`);
  detailEls.cinemaMeta.textContent = metaPieces.join(" • ");

  // 🟢 tampilkan gambar bioskop kalau ada
  if (cinema.imageUrl && detailEls.cinemaPhoto) {
    detailEls.cinemaPhoto.style.backgroundImage = `url("${cinema.imageUrl}")`;
    detailEls.cinemaPhoto.style.backgroundSize = "cover";
    detailEls.cinemaPhoto.style.backgroundPosition = "center";
    detailEls.cinemaPhoto.style.backgroundRepeat = "no-repeat";
  }

  // 🟢 tampilkan peta
  detailEls.mapEmbed.innerHTML = "";

  if (cinema.mapEmbed) {
    // Versi embed langsung (iframe)
    const iframe = document.createElement("iframe");
    iframe.src = cinema.mapEmbed;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.allowFullscreen = true;
    iframe.style.width = "100%";
    iframe.style.height = "230px";
    iframe.style.border = "none";
    iframe.style.borderRadius = "16px";
    detailEls.mapEmbed.appendChild(iframe);
  } else if (cinema.mapLink) {
    // fallback ke link biasa
    const link = document.createElement("a");
    link.href = cinema.mapLink;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Lihat lokasi di Google Maps";
    link.style.display = "block";
    link.style.textAlign = "center";
    link.style.background = "#e5e7eb";
    link.style.padding = "12px 16px";
    link.style.borderRadius = "16px";
    link.style.textDecoration = "none";
    detailEls.mapEmbed.appendChild(link);
  } else {
    detailEls.mapEmbed.textContent = "Lokasi belum tersedia.";
  }
}

function renderMovieSchedule(cinema) {
  const movies = cinema.movies || [];
  if (!movies.length) {
    detailEls.scheduleSub.textContent =
      "Belum ada data film yang terdaftar untuk bioskop ini di data.json.";
    detailEls.movieList.innerHTML =
      '<div class="empty-state">Data film tidak tersedia.</div>';
    return;
  }

  detailEls.scheduleSub.textContent =
    `Jadwal film di ${cinema.name || "bioskop"} di kota ${
      cinema.city || "-"
    }. Data diambil dari ontology Turtle dan tidak merepresentasikan jadwal real-time.`;

  const frag = document.createDocumentFragment();

  movies.forEach((m) => {
    const card = document.createElement("article");
    card.className = "detail-movie-card";

    const poster = document.createElement("div");
    poster.className = "detail-movie-poster";

    if (m.posterUrl) {
      poster.style.backgroundImage = `url("${m.posterUrl}")`;
    }

    const body = document.createElement("div");

    const header = document.createElement("div");
    header.className = "detail-movie-header";

    const title = document.createElement("div");
    title.className = "detail-movie-title";
    title.textContent = m.title || "Untitled";

    const rating = document.createElement("div");
    rating.className = "detail-rating-pill";
    const age = (m.ageRating || "").toString();
    rating.textContent = age || "NR";

    if (age === "SU") rating.classList.add("detail-rating-SU");
    if (age === "13+") rating.classList.add("detail-rating-13");
    if (age === "17+") rating.classList.add("detail-rating-17");
    if (age === "21+") rating.classList.add("detail-rating-21");

    header.appendChild(title);
    header.appendChild(rating);

    const meta = document.createElement("div");
    meta.className = "detail-movie-meta";
    const metaPieces = [];
    if (m.genres && m.genres.length) metaPieces.push(m.genres.join(", "));
    if (m.durationMinutes) metaPieces.push(`${m.durationMinutes} menit`);
    if (m.director) metaPieces.push(`Sutradara: ${m.director}`);
    meta.textContent = metaPieces.join(" • ");

    const tags = document.createElement("div");
    tags.className = "detail-movie-tags";

    (m.genres || []).forEach((g) => {
      const span = document.createElement("span");
      span.className = "detail-tag";
      span.textContent = g;
      tags.appendChild(span);
    });

    (m.screenTypes || []).forEach((s) => {
      const span = document.createElement("span");
      span.className = "detail-tag";
      span.textContent = s;
      tags.appendChild(span);
    });

    const desc = document.createElement("div");
    desc.className = "detail-movie-desc";
    if (m.casts) {
      desc.textContent = `Pemeran: ${m.casts}`;
    } else {
      desc.textContent =
        "Sinopsis lengkap dapat dilihat melalui tautan sinopsis (jika tersedia).";
    }

    const actions = document.createElement("div");
    actions.className = "detail-movie-actions";

    if (m.sinopsisUrl) {
      const btnSin = document.createElement("a");
      btnSin.className = "detail-btn-sinopsis";
      btnSin.href = `movie.html?movie=${encodeURIComponent(m.id)}`;
      btnSin.textContent = "Lihat sinopsis film";
      actions.appendChild(btnSin);
    }

    if (cinema.mapLink) {
      const btnMap = document.createElement("a");
      btnMap.className = "detail-btn-map";
      btnMap.href = cinema.mapLink;
      btnMap.target = "_blank";
      btnMap.rel = "noopener noreferrer";
      btnMap.textContent = "Lihat lokasi bioskop";
      actions.appendChild(btnMap);
    }

    body.appendChild(header);
    body.appendChild(meta);
    if (tags.childElementCount) body.appendChild(tags);
    body.appendChild(desc);
    body.appendChild(actions);

    card.appendChild(poster);
    card.appendChild(body);

    frag.appendChild(card);
  });

  detailEls.movieList.innerHTML = "";
  detailEls.movieList.appendChild(frag);
}

function bindDetailEvents(allCinemas) {
  detailEls.btnNearest.addEventListener("click", () => {
    alert(
      "Fitur 'bioskop terdekat' belum dihubungkan ke lokasi asli. Kamu bisa memilih kota lain di halaman utama."
    );
  });
}

loadCinemaDetail();