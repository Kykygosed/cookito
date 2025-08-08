// --- Configuration Firebase ---
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDyWu4TI4PIRXfeb7yqt0WIGClgu10IjkM",
  authDomain: "kylita-f2923.firebaseapp.com",
  databaseURL: "https://kylita-f2923-default-rtdb.firebaseio.com",
  projectId: "kylita-f2923",
  storageBucket: "kylita-f2923.firebasestorage.app",
  messagingSenderId: "431823530994",
  appId: "1:431823530994:web:88a07e633751686e5ad96b",
  measurementId: "G-F4LLNWQJ16"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- Sélecteurs ---
const loader = document.getElementById("loader");
const app = document.getElementById("app");

const moviesContainer = document.getElementById("movies-container");
const searchInput = document.getElementById("search");

const selectedMovieSection = document.getElementById("selected-movie");
const movieTitle = document.getElementById("movie-title");
const movieDescription = document.getElementById("movie-description");
const movieDate = document.getElementById("movie-date");
const movieDirector = document.getElementById("movie-director");
const nsfwWarning = document.getElementById("nsfw-warning");
const launchBtn = document.getElementById("launch-btn");

const videoOverlay = document.getElementById("video-overlay");
const movieVideo = document.getElementById("movie-video");

const btnPlayPause = document.getElementById("btn-play-pause");
const btnForward = document.getElementById("btn-forward");
const btnBackward = document.getElementById("btn-backward");
const btnRestart = document.getElementById("btn-restart");
const btnExit = document.getElementById("btn-exit");

let moviesData = {};
let selectedMovieId = null;
let videoPlaying = false;

// --- Fonctions utilitaires ---
function formatDate(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function clearSelection() {
  document.querySelectorAll(".movie-thumb.selected").forEach((el) => {
    el.classList.remove("selected");
  });
  selectedMovieId = null;
  selectedMovieSection.classList.add("hidden");
  app.style.backgroundImage = "";
}

// --- Afficher un film sélectionné ---
function displaySelectedMovie(id) {
  if (!moviesData[id]) return;
  selectedMovieId = id;
  const movie = moviesData[id];

  // Sélection visuelle
  clearSelection();
  const thumb = document.querySelector(`.movie-thumb[data-id="${id}"]`);
  if (thumb) thumb.classList.add("selected");

  // Affichage des infos
  movieTitle.textContent = movie.name || "Titre inconnu";
  movieDescription.textContent = movie.description || "";
  movieDate.textContent = movie.date
    ? formatDate(movie.date)
    : "Date inconnue";
  movieDirector.textContent = movie.director || "";

  nsfwWarning.classList.toggle("hidden", !movie.nsfw);

  // Background
  if (movie.image) {
    app.style.backgroundImage = `url('${movie.image}')`;
  } else {
    app.style.backgroundImage = "";
  }

  selectedMovieSection.classList.remove("hidden");
}

// --- Charger les films depuis Firebase ---
function loadMovies() {
  db.ref("movies").once("value").then((snapshot) => {
    const movies = snapshot.val() || {};

    // Trier par date (du plus récent au plus ancien)
    moviesData = Object.entries(movies)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (b.date || 0) - (a.date || 0))
      .reduce((acc, movie) => {
        acc[movie.id] = movie;
        return acc;
      }, {});

    renderMovies(Object.values(moviesData));
    loader.classList.add("hidden");
    app.classList.remove("hidden");

    // Sélectionne le premier film automatiquement s'il y en a
    if (Object.keys(moviesData).length > 0) {
      displaySelectedMovie(Object.keys(moviesData)[0]);
    }
  });
}

// --- Afficher la liste des films (vignettes) ---
function renderMovies(list) {
  moviesContainer.innerHTML = "";
  list.forEach((movie) => {
    const div = document.createElement("div");
    div.className = "movie-thumb";
    div.style.backgroundImage = movie.image
      ? `url('${movie.image}')`
      : "none";
    div.dataset.id = movie.id;
    div.title = movie.name || "Film";

    div.addEventListener("mouseenter", () => {
      displaySelectedMovie(movie.id);
    });

    moviesContainer.appendChild(div);
  });
}

// --- Recherche ---
searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim().toLowerCase();

  if (query === "") {
    renderMovies(Object.values(moviesData));
  } else {
    const filtered = Object.values(moviesData).filter((movie) =>
      movie.name.toLowerCase().includes(query)
    );
    renderMovies(filtered);
    if (filtered.length > 0) {
      displaySelectedMovie(filtered[0].id);
    } else {
      clearSelection();
    }
  }
});

// --- Lancer la vidéo ---
launchBtn.addEventListener("click", () => {
  if (!selectedMovieId) return;
  const movie = moviesData[selectedMovieId];
  if (!movie || !movie.path) return;

  movieVideo.src = movie.path;
  movieVideo.currentTime = 0;
  videoOverlay.classList.remove("hidden");
  movieVideo.play();
  videoPlaying = true;
  btnPlayPause.textContent = "⏸️";
});

// --- Contrôles vidéo ---
btnPlayPause.addEventListener("click", () => {
  if (videoPlaying) {
    movieVideo.pause();
    videoPlaying = false;
    btnPlayPause.textContent = "▶️";
  } else {
    movieVideo.play();
    videoPlaying = true;
    btnPlayPause.textContent = "⏸️";
  }
});

btnForward.addEventListener("click", () => {
  movieVideo.currentTime = Math.min(
    movieVideo.duration,
    movieVideo.currentTime + 10
  );
});

btnBackward.addEventListener("click", () => {
  movieVideo.currentTime = Math.max(0, movieVideo.currentTime - 10);
});

btnRestart.addEventListener("click", () => {
  movieVideo.currentTime = 0;
  if (!videoPlaying) {
    movieVideo.play();
    videoPlaying = true;
    btnPlayPause.textContent = "⏸️";
  }
});

btnExit.addEventListener("click", () => {
  movieVideo.pause();
  movieVideo.src = "";
  videoOverlay.classList.add("hidden");
  videoPlaying = false;
  btnPlayPause.textContent = "▶️";
});

// --- Affiche les contrôles quand on bouge la souris sur la vidéo ---
let controlsTimeout;
videoOverlay.addEventListener("mousemove", () => {
  const controls = document.getElementById("video-controls");
  controls.style.opacity = "1";
  clearTimeout(controlsTimeout);
  controlsTimeout = setTimeout(() => {
    controls.style.opacity = "0";
  }, 3000);
});

// --- Initialisation ---
window.addEventListener("load", () => {
  loadMovies();
});
