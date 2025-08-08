
const firebaseConfig = {
  apiKey: "AIzaSyDyWu4TI4PIRXfeb7yqt0WIGClgu10IjkM",
  authDomain: "kylita-f2923.firebaseapp.com",
  databaseURL: "https://kylita-f2923-default-rtdb.firebaseio.com",
  projectId: "kylita-f2923",
  storageBucket: "kylita-f2923.firbaseapp.com",
  messagingSenderId: "431823530994",
  appId: "1:431823530994:web:88a07e633751686e5ad96b",
  measurementId: "G-F4LLNWQJ16"
};
firebase.initializeApp(firebaseConfig);

const db = firebase.database();

const loader = document.getElementById('loader');
const mainContent = document.getElementById('main-content');
const moviesList = document.getElementById('movies-list');
const searchBar = document.getElementById('search-bar');
const filmHeader = document.getElementById('film-header');
const filmName = document.getElementById('film-name');
const filmDate = document.getElementById('film-date');
const filmRealisator = document.getElementById('film-realisator');
const filmDescription = document.getElementById('film-description');
const filmNSFW = document.getElementById('film-nsfw-warning');
const watchBtn = document.getElementById('watch-btn');
const videoOverlay = document.getElementById('video-overlay');
const filmVideo = document.getElementById('film-video');
const videoControls = document.querySelector('.video-controls');
const playPauseBtn = document.getElementById('play-pause');
const forwardBtn = document.getElementById('forward');
const backwardBtn = document.getElementById('backward');
const restartBtn = document.getElementById('restart');
const exitBtn = document.getElementById('exit');

let allMovies = [];
let selectedMovie = null;

/** Formatte la date (timestamp ou string YYYY-MM-DD) */
function formatDate(d) {
  if(!d) return '';
  // Si timestamp
  if (typeof d === 'number') {
    return new Date(d).toLocaleDateString('fr-FR');
  }
  // Si format string
  let tryDate = new Date(d);
  if (!isNaN(tryDate)) return tryDate.toLocaleDateString('fr-FR');
  return d;
}

// Charge tous les films à partir de Firebase
function fetchMovies(cb) {
  db.ref('movies').once('value').then(snap => {
    let movies = [];
    snap.forEach(child => {
      const val = child.val();
      // chaque film : structure attendue
      movies.push({
        id: child.key,
        name: val.name || "",
        description: val.description || "",
        imageurl: val.imageurl || "",
        nsfw: !!val.nsfw,
        path: val.path || "",
        date: val.date || "",
        datepublication: val.datepublication || "",
        realisator: val.realisator || "",
        tags: val.tags || ""
      });
    });
    cb(movies);
  });
}

// Affiche la liste des films selon un ordre donné
function displayMovies(movies, selectedId = null) {
  moviesList.innerHTML = "";
  movies.forEach(movie => {
    const div = document.createElement('div');
    div.className = "movie-item" + (movie.id === selectedId ? ' selected' : '');
    div.dataset.id = movie.id;
    // miniatures = image du film
    const img = document.createElement('img');
    img.className = 'movie-thumb';
    img.src = movie.imageurl;
    img.alt = movie.name;
    div.appendChild(img);

    // Au survol : sélectionne ce film
    div.addEventListener('mouseenter', () => selectMovie(movie.id));
    div.addEventListener('focus', () => selectMovie(movie.id));
    // Tab navigation : aussi au focus
    div.tabIndex = 0;

    // cliquer sur une miniature = sélectionner (facilite mobile)
    div.addEventListener('click', () => selectMovie(movie.id));

    moviesList.appendChild(div);
  });
}

// Affichage des infos du film sélectionné
function updateHeader(movie) {
  // BG image (header)
  filmHeader.classList.remove('bg');
  filmHeader.style.backgroundImage = '';
  if(movie.imageurl) {
    filmHeader.classList.add('bg');
    filmHeader.style.backgroundImage = `linear-gradient(rgba(15,19,29,0.82),rgba(17,22,40,0.71)), url('${movie.imageurl}')`;
  }

  filmName.textContent = movie.name || '';
  filmDescription.textContent = movie.description || '';
  filmDate.textContent = movie.date ? formatDate(movie.date) : '';
  filmRealisator.textContent = movie.realisator ? "Réalisé par " + movie.realisator : '';
  // NSFW
  if(movie.nsfw) {
    filmNSFW.style.display = '';
    filmNSFW.innerHTML = "AVERTISSEMENT - Ce film contient des scènes NSFW, pouvant ne pas être adaptées à tout âge.";
  } else {
    filmNSFW.style.display = 'none';
    filmNSFW.innerHTML = '';
  }
  // Toggle bouton "Lancer!"
  if(movie.path) {
    watchBtn.style.display = '';
  } else {
    watchBtn.style.display = 'none';
  }
}

// Sélectionne un film
function selectMovie(id) {
  const movie = allMovies.find(m => m.id === id);
  if (!movie) return;
  selectedMovie = movie;
  // Mettre à jour le header
  updateHeader(movie);

  // Marquer la sélection visuelle
  document.querySelectorAll('.movie-item').forEach(div => {
    if(div.dataset.id === id) div.classList.add("selected");
    else div.classList.remove("selected");
  });
}

function filterMovies(query) {
  query = query.trim().toLowerCase();
  if(!query) return allMovies;
  return allMovies.filter(m => m.name.toLowerCase().includes(query));
}

// ------ Lecteur vidéo (overlay) ------
function showVideoOverlay(movie) {
  videoOverlay.style.display = '';
  filmVideo.src = movie.path;
  filmVideo.currentTime = 0;
  filmVideo.pause();
  videoControls.style.display = '';
  filmVideo.play();
}
function hideVideoOverlay() {
  filmVideo.pause();
  filmVideo.src = "";
  videoOverlay.style.display = 'none';
  videoControls.style.display = 'none';
  // Se protège contre focus/scroll vidéo
}

// Vidéo : boutons
playPauseBtn.onclick = () => {
  if (filmVideo.paused) {
    filmVideo.play();
    playPauseBtn.textContent = '⏸️';
  } else {
    filmVideo.pause();
    playPauseBtn.textContent = '⏯️';
  }
};
filmVideo.onplay = () => { playPauseBtn.textContent = '⏸️'; };
filmVideo.onpause = () => { playPauseBtn.textContent = '⏯️'; };
restartBtn.onclick = () => { filmVideo.currentTime = 0; };
forwardBtn.onclick = () => { filmVideo.currentTime += 10; };
backwardBtn.onclick = () => { filmVideo.currentTime = Math.max(0, filmVideo.currentTime - 10); };
exitBtn.onclick = () => { hideVideoOverlay(); };

videoOverlay.addEventListener('mousemove', () => {
  videoControls.style.display = '';
  // Timeout masquage possible si tu veux (ici, toujours visible)
});

// "Lancer!" bouton
watchBtn.onclick = () => {
  if(selectedMovie && selectedMovie.path) {
    showVideoOverlay(selectedMovie);
  }
};

// ---------- Recherche ----------
searchBar.addEventListener('input', (e) => {
  const val = searchBar.value;
  const filtered = filterMovies(val);
  displayMovies(filtered, selectedMovie ? selectedMovie.id : null);
  // Si le film sélectionné n'est pas dans les résultats filtrés, changer header
  if(selectedMovie && !filtered.some(m => m.id === selectedMovie.id) && filtered.length > 0) {
    selectMovie(filtered[0].id);
  } else if (filtered.length === 0) {
    // Vide le header
    filmName.textContent = filmDescription.textContent = "";
    filmDate.textContent = filmRealisator.textContent = "";
    filmHeader.style.backgroundImage = "";
    watchBtn.style.display = 'none';
    filmNSFW.style.display = 'none';
  }
});

// -------------------- INITIALISATION --------------------

// Chargement initial
fetchMovies(movies => {
  allMovies = movies.sort((a,b) =>
    // trier par datepublication (du plus récent au plus ancien)
    new Date(b.datepublication) - new Date(a.datepublication)
  );
  // Affiche films
  displayMovies(allMovies);
  if(allMovies.length) {
    selectMovie(allMovies[0].id);
  }
  loader.style.display = 'none';
  mainContent.style.display = '';
});

