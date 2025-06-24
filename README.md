# MovieInfo - Movie & TV Show Search App

MovieInfo is a web application that allows users to search for movies and TV shows, view details, and filter results by genre. It fetches data from the OMDB and TMDB APIs and displays results in a clean, responsive interface.

## Features

- **Search** for movies and TV shows by title.
- **Filter** results by genre (using TMDB genres).
- **View details** for each movie, including poster, plot, cast, director, and ratings.
- **Pagination** for browsing through multiple pages of results.
- **Responsive design** for desktop and mobile devices.

## Technologies Used

- HTML5, CSS3 (custom, no Bootstrap)
- JavaScript (jQuery, Axios)
- [OMDB API](https://www.omdbapi.com/)
- [TMDB API](https://www.themoviedb.org/documentation/api)

## Setup Instructions

1. **Clone or Download** this repository.

   ```sh
   git clone https://github.com/NungoEdwin/Movie-Tv-Show-App.git
   cd Movie-Tv-Show-App
   ```

2. **API Keys**  
   - Register for a free OMDB API key at [omdbapi.com](https://www.omdbapi.com/apikey.aspx).
   - Register for a free TMDB API key at [themoviedb.org](https://www.themoviedb.org/settings/api).
   - Open `/js/main.js` and replace the placeholders for `OMDB_API_KEY` and `TMDB_API_KEY` with your keys.

3. **Run Locally**  
   - Open `index.html` in your browser.
   - No server is required; all API calls are made client-side.
   - Search for movies and TV shows, filter by genre, and view details.

