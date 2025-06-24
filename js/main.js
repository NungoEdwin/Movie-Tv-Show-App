// Insert your API keys here
const OMDB_API_KEY = 'b915251'; // <-- Replace with your OMDB API key
const TMDB_API_KEY = 'b36dd2a4716ad427f080c880ffb51b7b'; // <-- Replace with your TMDB API key

let currentPage = 1;
let totalPages = 1;
let lastSearchText = '';

$(document).ready(() => {
  // Fetch popular movies on load
  getMovies('', 1, true);

  $('#searchForm').on('submit', (e) => {
    let searchText = $('#searchText').val();
    lastSearchText = searchText;
    getMovies(searchText, 1, false);
    e.preventDefault();
  });

  // Pagination click
  $(document).on('click', '.pagination .page-link', function(e) {
    e.preventDefault();
    const page = parseInt($(this).data('page'));
    if (!isNaN(page) && page !== currentPage) {
      getMovies(lastSearchText, page, lastSearchText === '');
    }
  });
});

async function getMovies(searchText = '', page = 1, isPopular = false){
  let omdbMovies = [];
  let tmdbMovies = [];
  currentPage = page;
  totalPages = 1;

  if (isPopular) {
    // Fetch popular movies from TMDB
    try {
      const tmdbRes = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`);
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
    // Fetch from OMDB
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
    // Fetch from TMDB
    try {
      const tmdbRes = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchText)}&page=${page}`);
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
  }

  let allMovies = [...omdbMovies, ...tmdbMovies];
  let output = '';
  allMovies.forEach(movie => {
    output += `
      <div class="col-6 col-sm-4 col-md-3 mb-3 d-flex align-items-stretch">
        <div class="card movie-card shadow-sm border-0 w-100 h-100 text-center">
          <img src="${movie.poster}" alt="${movie.title}" class="card-img-top movie-poster" onerror="this.src='https://via.placeholder.com/300x445?text=No+Image'">
          <div class="card-body p-2 d-flex flex-column justify-content-between">
            <h6 class="card-title mb-2" style="font-size:1rem; font-weight:600; color:#00bcd4; min-height:2.5em;">${movie.title} <span style='color:#aaa;'>(${movie.year})</span></h6>
            <a onclick="movieSelected('${movie.id}','${movie.source}')" class="btn btn-primary btn-sm mt-auto" href="#">Movie Details</a>
          </div>
        </div>
      </div>
    `;
  });
  $('#movies').html(output);
  renderPagination(currentPage, totalPages);
}

function renderPagination(current, total) {
  let pag = '';
  if (total > 1) {
    pag += '<div class="pagination-wrapper d-flex justify-content-center"><nav><ul class="pagination">';
    let start = Math.max(1, current-2);
    let end = Math.min(total, current+2);
    if (current > 1) pag += `<li class="page-item"><a class="page-link" href="#" data-page="${current-1}">&laquo;</a></li>`;
    for (let i = start; i <= end; i++) {
      pag += `<li class="page-item${i===current?' active':''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    if (current < total) pag += `<li class="page-item"><a class="page-link" href="#" data-page="${current+1}">&raquo;</a></li>`;
    pag += '</ul></nav></div>';
  }
  // Remove any previous pagination before adding new
  $('.pagination-wrapper').remove();
  $('#movies').after(pag);
}

function movieSelected(id, source){
  sessionStorage.setItem('movieId', id);
  sessionStorage.setItem('movieSource', source);
  window.location = 'movie.html';
  return false;
}

async function getMovie(){
  let movieId = sessionStorage.getItem('movieId');
  let source = sessionStorage.getItem('movieSource');
  let output = '';
  if (source === 'omdb') {
    try {
      const res = await axios.get(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${movieId}&plot=full`);
      let movie = res.data;
      output =`
        <div class="row">
          <div class="col-md-4">
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x445?text=No+Image'}" class="thumbnail">
          </div>
          <div class="col-md-8">
            <h2>${movie.Title}</h2>
            <ul class="list-group">
              <li class="list-group-item"><strong>Genre:</strong> ${movie.Genre}</li>
              <li class="list-group-item"><strong>Released:</strong> ${movie.Released}</li>
              <li class="list-group-item"><strong>Rated:</strong> ${movie.Rated}</li>
              <li class="list-group-item"><strong>IMDB Rating:</strong> ${movie.imdbRating}</li>
              <li class="list-group-item"><strong>Director:</strong> ${movie.Director}</li>
              <li class="list-group-item"><strong>Writer:</strong> ${movie.Writer}</li>
              <li class="list-group-item"><strong>Actors:</strong> ${movie.Actors}</li>
            </ul>
          </div>
        </div>
        <div class="row">
          <div class="well">
            <h3>Plot</h3>
            ${movie.Plot}
            <hr>
            <a href="http://imdb.com/title/${movie.imdbID}" target="_blank" class="btn btn-primary">View IMDB</a>
            <a href="index.html" class="btn btn-default">Go Back To Search</a>
          </div>
        </div>
      `;
    } catch (err) { output = '<p>Error loading OMDB details.</p>'; }
  } else if (source === 'tmdb') {
    try {
      const res = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits`);
      let movie = res.data;
      output =`
        <div class="row">
          <div class="col-md-4">
            <img src="${movie.poster_path ? 'https://image.tmdb.org/t/p/w300'+movie.poster_path : 'https://via.placeholder.com/300x445?text=No+Image'}" class="thumbnail">
          </div>
          <div class="col-md-8">
            <h2>${movie.title}</h2>
            <ul class="list-group">
              <li class="list-group-item"><strong>Genre:</strong> ${movie.genres.map(g=>g.name).join(', ')}</li>
              <li class="list-group-item"><strong>Released:</strong> ${movie.release_date}</li>
              <li class="list-group-item"><strong>Rated:</strong> ${movie.adult ? '18+' : 'PG'}</li>
              <li class="list-group-item"><strong>TMDB Rating:</strong> ${movie.vote_average}</li>
              <li class="list-group-item"><strong>Director:</strong> ${movie.credits.crew.filter(c=>c.job==='Director').map(c=>c.name).join(', ')}</li>
              <li class="list-group-item"><strong>Writer:</strong> ${movie.credits.crew.filter(c=>c.job==='Writer').map(c=>c.name).join(', ')}</li>
              <li class="list-group-item"><strong>Actors:</strong> ${movie.credits.cast.slice(0,5).map(a=>a.name).join(', ')}</li>
            </ul>
          </div>
        </div>
        <div class="row">
          <div class="well">
            <h3>Plot</h3>
            ${movie.overview}
            <hr>
            <a href="https://www.themoviedb.org/movie/${movie.id}" target="_blank" class="btn btn-primary">View on TMDB</a>
            <a href="index.html" class="btn btn-default">Go Back To Search</a>
          </div>
        </div>
      `;
    } catch (err) { output = '<p>Error loading TMDB details.</p>'; }
  } else {
    output = '<p>Invalid source.</p>';
  }
  $('#movie').html(output);
}
