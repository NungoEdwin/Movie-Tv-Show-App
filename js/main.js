// Insert your API keys here
const OMDB_API_KEY = 'YOUR_OMDB_API_KEY'; // <-- Replace with your OMDB API key
const TMDB_API_KEY = 'YOUR_TMDB_API_KEY'; // <-- Replace with your TMDB API key

$(document).ready(() => {
  $('#searchForm').on('submit', (e) => {
    let searchText = $('#searchText').val();
    getMovies(searchText);
    e.preventDefault();
  });
});

async function getMovies(searchText){
  // Fetch from OMDB
  let omdbMovies = [];
  try {
    const omdbRes = await axios.get(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(searchText)}`);
    if (omdbRes.data.Search) {
      omdbMovies = omdbRes.data.Search.map(m => ({
        source: 'omdb',
        id: m.imdbID,
        title: m.Title,
        poster: m.Poster !== 'N/A' ? m.Poster : '',
        year: m.Year
      }));
    }
  } catch (err) { console.log('OMDB error', err); }

  // Fetch from TMDB
  let tmdbMovies = [];
  try {
    const tmdbRes = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchText)}`);
    if (tmdbRes.data.results) {
      tmdbMovies = tmdbRes.data.results.map(m => ({
        source: 'tmdb',
        id: m.id,
        title: m.title,
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w300${m.poster_path}` : '',
        year: m.release_date ? m.release_date.substring(0,4) : ''
      }));
    }
  } catch (err) { console.log('TMDB error', err); }

  // Merge and display
  let allMovies = [...omdbMovies, ...tmdbMovies];
  let output = '';
  allMovies.forEach(movie => {
    output += `
      <div class="col-md-3">
        <div class="well text-center">
          <img src="${movie.poster}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/300x445?text=No+Image'">
          <h5>${movie.title} (${movie.year})</h5>
          <a onclick="movieSelected('${movie.id}','${movie.source}')" class="btn btn-primary" href="#">Movie Details</a>
        </div>
      </div>
    `;
  });
  $('#movies').html(output);
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
