// Insert your API keys here
const OMDB_API_KEY = 'b915251'; // <-- Replace with your OMDB API key
const TMDB_API_KEY = 'b36dd2a4716ad427f080c880ffb51b7b'; // <-- Replace with your TMDB API key

let currentPage = 1;
let totalPages = 1;
let lastSearchText = '';
let genresList = [];

$(document).ready(() => {
  // Fetch genres and populate dropdown
  fetchGenres();

  // Fetch popular movies on load
  getMovies('', 1, true);

  $('#searchForm').on('submit', (e) => {
    let searchText = $('#searchText').val();
    lastSearchText = searchText;
    getMovies(searchText, 1, false);
    e.preventDefault();
  });

  // Genre filter
  $('#genreSelect').on('change', function() {
    getMovies($('#searchText').val(), 1, !$('#searchText').val());
  });

  // Pagination click
  $(document).on('click', '.pagination .page-link', function(e) {
    e.preventDefault();
    const page = parseInt($(this).data('page'));
    if (!isNaN(page) && page !== currentPage) {
      getMovies(lastSearchText, page, lastSearchText === '');
    }
  });

  // Watchlist modal handlers
  $('#watchlistBtn').on('click', function() {
    renderWatchlist();
    $('#watchlistModal').css('display', 'flex');
  });
  $('#closeWatchlist').on('click', function() {
    $('#watchlistModal').hide();
  });
  // Remove from watchlist
  $(document).on('click', '.remove-watchlist', function() {
    const id = $(this).data('id');
    removeFromWatchlist(id);
    // Re-enable the "Add to Watchlist" button for the removed movie,I love the magic here
  $(`.add-watchlist-btn[data-id="${id}"]`).prop('disabled', false).text('Add to Watchlist');
    
    renderWatchlist();
  });

  // Add to watchlist button click handler
  $(document).on('click', '.add-watchlist-btn', function() {
    const btn = $(this);
    const movie = {
      id: btn.data('id'),
      source: btn.data('source'),
      title: decodeURIComponent(btn.data('title')),
      poster: decodeURIComponent(btn.data('poster')),
      year: btn.data('year')
    };
    addToWatchlist(movie);
    //btn.prop('disabled', true).innerHTML('Added to Watchlist');
    btn.prop('disabled',true).text('Added to Watchlist');

  });
});

async function fetchGenres() {
  try {
    const res = await axios.get(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}`);
    genresList = res.data.genres || [];
    let options = '<option value="">All Genres</option>';
    genresList.forEach(g => {
      options += `<option value="${g.id}">${g.name}</option>`;
    });
    $('#genreSelect').html(options);
  } catch (err) {
    $('#genreSelect').html('<option value="">All Genres</option>');
  }
}

function getWatchlist() {
  return JSON.parse(localStorage.getItem('watchlist') || '[]');
}

function saveWatchlist(list) {
  localStorage.setItem('watchlist', JSON.stringify(list));
}

function addToWatchlist(movie) {
  let list = getWatchlist();
  if (!list.find(m => m.id === movie.id && m.source === movie.source)) {
    list.push(movie);
    saveWatchlist(list);
  }
}

function removeFromWatchlist(id) {
  let list = getWatchlist();
  list = list.filter(m => m.id !== id);
  saveWatchlist(list);
}

function isInWatchlist(movie) {
  let list = getWatchlist();
  return list.some(m => m.id === movie.id && m.source === movie.source);
}

function renderWatchlist() {
  const list = getWatchlist();
  if (!list.length) {
    $('#watchlistContent').html('<p>Your watchlist is empty.</p>');
    return;
  }
  let html = '<ul style="list-style:none; padding:0;">';
  list.forEach(movie => {
    html += `
      <li style="margin-bottom:1rem; display:flex; align-items:center; gap:1rem;">
        <img src="${movie.poster}" alt="${movie.title}" style="width:60px; border-radius:8px;">
        <span style="flex:1;">${movie.title} (${movie.year})</span>
        <button class="remove-watchlist" data-id="${movie.id}" style="background:#e53935; color:#fff; border:none; border-radius:8px; padding:4px 10px; cursor:pointer;">Remove</button>
        <button onclick="movieSelected('${movie.id}','${movie.source}')" style="background:#00bcd4; color:#fff; border:none; border-radius:8px; padding:4px 10px; cursor:pointer;">Details</button>
      </li>
    `;
  });
  html += '</ul>';
  $('#watchlistContent').html(html);
}

async function getMovies(searchText = '', page = 1, isPopular = false){
  let omdbMovies = [];
  let tmdbMovies = [];
  currentPage = page;
  totalPages = 1;
  const selectedGenre = $('#genreSelect').val();

  if (isPopular) {
    // Fetch popular movies from TMDB
    try {
      let url = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`;
      if (selectedGenre) {
        url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&page=${page}&with_genres=${selectedGenre}`;
      }
      const tmdbRes = await axios.get(url);
      if (tmdbRes.data.results) {
        tmdbMovies = tmdbRes.data.results.map(m => ({
          source: 'tmdb',
          id: m.id,
          title: m.title,
          poster: m.poster_path ? `https://image.tmdb.org/t/p/w300${m.poster_path}` : '',
          year: m.release_date ? m.release_date.substring(0,4) : ''
        }));
        totalPages = tmdbRes.data.total_pages;
      }
    } catch (err) { console.log('TMDB popular error', err); }
  } else if (searchText) {
    // Fetch from OMDB (no genre filter)
    try {
      const omdbRes = await axios.get(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(searchText)}&page=${page}`);
      if (omdbRes.data.Search) {
        omdbMovies = omdbRes.data.Search.map(m => ({
          source: 'omdb',
          id: m.imdbID,
          title: m.Title,
          poster: m.Poster !== 'N/A' ? m.Poster : '',
          year: m.Year
        }));
        totalPages = Math.ceil((parseInt(omdbRes.data.totalResults)||1) / 10);
      }
    } catch (err) { console.log('OMDB error', err); }
    // Fetch from TMDB (with genre filter if selected)
    try {
      let url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchText)}&page=${page}`;
      if (selectedGenre) {
        url += `&with_genres=${selectedGenre}`;
      }
      const tmdbRes = await axios.get(url);
      if (tmdbRes.data.results) {
        tmdbMovies = tmdbRes.data.results.map(m => ({
          source: 'tmdb',
          id: m.id,
          title: m.title,
          poster: m.poster_path ? `https://image.tmdb.org/t/p/w300${m.poster_path}` : '',
          year: m.release_date ? m.release_date.substring(0,4) : ''
        }));
        totalPages = Math.max(totalPages, tmdbRes.data.total_pages);
      }
    } catch (err) { console.log('TMDB error', err); }
  } else if (selectedGenre) {
    // If only genre is selected, show movies by genre
    try {
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&page=${page}&with_genres=${selectedGenre}`;
      const tmdbRes = await axios.get(url);
      if (tmdbRes.data.results) {
        tmdbMovies = tmdbRes.data.results.map(m => ({
          source: 'tmdb',
          id: m.id,
          title: m.title,
          poster: m.poster_path ? `https://image.tmdb.org/t/p/w300${m.poster_path}` : '',
          year: m.release_date ? m.release_date.substring(0,4) : ''
        }));
        totalPages = tmdbRes.data.total_pages;
      }
    } catch (err) { console.log('TMDB genre error', err); }
  }

  let allMovies = [...omdbMovies, ...tmdbMovies];
  let output = '';
  allMovies.forEach(movie => {
    const inWatchlist = isInWatchlist(movie);
    output += `
      <div class="movie-card">
        <img src="${movie.poster}" alt="${movie.title}" class="movie-poster" onerror="this.src='https://via.placeholder.com/300x445?text=No+Image'">
        <div class="movie-card-body">
          <h6 class="card-title">${movie.title} <span>(${movie.year})</span></h6>
          <a onclick="movieSelected('${movie.id}','${movie.source}')" class="btn-primary" href="#">Movie Details</a>
          <button class="btn-primary add-watchlist-btn" style="margin-top:10px;" 
            data-id="${movie.id}" data-source="${movie.source}" data-title="${encodeURIComponent(movie.title)}" data-poster="${encodeURIComponent(movie.poster)}" data-year="${movie.year}"
            ${inWatchlist ? 'disabled' : ''}>
            ${inWatchlist ? 'Added to Watchlist' : 'Add to Watchlist'}
          </button>
        </div>
      </div>
    `;
  });
  $('#movies').html(output);
  renderPagination(currentPage, totalPages);
}
