const mEls = {
  poster: document.getElementById("moviePoster"),
  title: document.getElementById("movieTitle"),
  director: document.getElementById("movieDirector"),
  casts: document.getElementById("movieCasts"),
  duration: document.getElementById("movieDuration"),
  rating: document.getElementById("movieRating"),
  genres: document.getElementById("movieGenres"),
  ratingBadge: document.getElementById("movieRatingBadge"),
  trailerFrame: document.getElementById("movieTrailerFrame"),
  synopsis: document.getElementById("movieSynopsis"),
  dateInfo: document.getElementById("movieDateInfo"),
};

function getMovieIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("movie");
}

function extractYoutubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "");
    }
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v");
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function loadWikipediaSynopsis(slug) {
  if (!slug) return null;

  try {
    const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
      `https://id.wikipedia.org/api/rest_v1/page/summary/${slug}`
    )}`;

    const res = await fetch(apiUrl);
    const data = await res.json();
    const parsed = JSON.parse(data.contents);

    if (parsed.extract) {
      mEls.synopsis.textContent = parsed.extract;
      // Tambahkan sumber di bawah sinopsis
      mEls.synopsis.insertAdjacentHTML(
        "afterend",
        `<p class="wiki-source">Sumber: <a href="https://id.wikipedia.org/wiki/${slug}" target="_blank" rel="noopener noreferrer">Wikipedia</a></p>`
      );
    } else {
      mEls.synopsis.textContent = "Sinopsis tidak ditemukan di Wikipedia.";
    }
  } catch (err) {
    console.error("Gagal memuat sinopsis Wikipedia:", err);
    mEls.synopsis.textContent =
      "Gagal memuat sinopsis dari Wikipedia. Coba lagi nanti.";
  }
}

async function loadMovieDetail() {
  const movieId = getMovieIdFromUrl();
  if (!movieId) {
    mEls.synopsis.textContent =
      "ID film tidak ditemukan di URL. Pastikan tautan dari halaman bioskop benar.";
    return;
  }

  try {
    const res = await fetch("data.json");
    const data = await res.json();
    const cinemas = data.cinemas || [];

    // cari movie di seluruh bioskop
    let foundMovie = null;
    let playingCinemaNames = [];
    cinemas.forEach((c) => {
      (c.movies || []).forEach((m) => {
        if (m.id === movieId) {
          foundMovie = m;
          playingCinemaNames.push(c.name || "Bioskop");
        }
      });
    });

    if (!foundMovie) {
      mEls.synopsis.textContent =
        "Data film tidak ditemukan di data.json untuk ID ini.";
      return;
    }

    renderMovie(foundMovie, playingCinemaNames);
  } catch (err) {
    console.error(err);
    mEls.synopsis.textContent = "Gagal memuat data.json.";
  }
}

function renderMovie(movie, cinemaNames) {
  mEls.title.textContent = movie.title || "Judul Film";
  mEls.director.textContent = movie.director || "-";
  mEls.casts.textContent = movie.casts || "-";
  mEls.duration.textContent = movie.durationMinutes
    ? `${movie.durationMinutes} minutes`
    : "-";
  mEls.rating.textContent = movie.ageRating || "NR";
  mEls.genres.textContent =
    movie.genres && movie.genres.length ? movie.genres.join(", ") : "-";

  // badge rating warna
  const age = (movie.ageRating || "").toString();
  mEls.ratingBadge.textContent = age || "NR";
  mEls.ratingBadge.classList.remove(
    "movie-rating-SU",
    "movie-rating-13",
    "movie-rating-17",
    "movie-rating-21"
  );
  if (age === "SU") mEls.ratingBadge.classList.add("movie-rating-SU");
  if (age === "13+") mEls.ratingBadge.classList.add("movie-rating-13");
  if (age === "17+") mEls.ratingBadge.classList.add("movie-rating-17");
  if (age === "21+") mEls.ratingBadge.classList.add("movie-rating-21");

  // poster
  if (movie.posterUrl) {
    mEls.poster.style.backgroundImage = `url("${movie.posterUrl}")`;
  }

  // trailer iframe
  mEls.trailerFrame.innerHTML = "";
  const ytId = extractYoutubeId(movie.sinopsisUrl);
  if (ytId) {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${ytId}`;
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    mEls.trailerFrame.appendChild(iframe);
  } else if (movie.sinopsisUrl) {
    const link = document.createElement("a");
    link.href = movie.sinopsisUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.style.display = "block";
    link.style.color = "#fefce8";
    link.style.padding = "10px";
    link.textContent = "Buka trailer / sinopsis di halaman eksternal";
    mEls.trailerFrame.appendChild(link);
  } else {
    mEls.trailerFrame.textContent = "Link trailer tidak tersedia di data.json.";
  }

  // ===== SINOPSIS TEXT =====
  if (movie.synopsisText) {
    // pecah berdasarkan newline, buang baris kosong
    const paragraphs = movie.synopsisText
      .split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  
    // render sebagai <p> ... </p> biar rapi
    mEls.synopsis.innerHTML = paragraphs
      .map(p => `<p>${p}</p>`)
      .join("");
  } else {
    mEls.synopsis.textContent =
      'Sinopsis tertulis belum tersedia di data.json. Kamu bisa menambahkannya di field "synopsisText" untuk film ini.';
  }


  // info tanggal tayang
  if (movie.playStart || movie.playEnd) {
    const start = movie.playStart || "?";
    const end = movie.playEnd || "?";
    mEls.dateInfo.textContent = `Film ini tayang di beberapa bioskop: ${cinemaNames.join(
      ", "
    )} sejak ${start}${
      movie.playEnd ? ` sampai ${end}` : ""
    } (berdasarkan data ontology, bukan jadwal real-time).`;
  } else {
    mEls.dateInfo.textContent = `Film ini terdaftar tayang di: ${cinemaNames.join(
      ", "
    )}. Jadwal pasti mengikuti informasi resmi bioskop.`;
  }
}

// mulai
loadMovieDetail();