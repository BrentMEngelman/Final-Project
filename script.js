const apiKey = "9e4f1ce2";
let currentPage = 1;
let totalResultsCount = 0;
let currentMovies = [];
let showingTitle =document.querySelector("#SearchValue");

// Persistent global Set to store all unique types discovered across ALL searches/pages
let knownTypes = new Set();

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const sortSelect = document.getElementById("sortSelect");
const searchBtn = document.getElementById("searchBtn");
const moviesGrid = document.getElementById("moviesGrid");
const paginationContainer = document.getElementById("pagination");

// Event Listeners
searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    currentPage = 1;
    fetchMovies();
});

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        currentPage = 1;
        fetchMovies();
    }
});

// Changing the type dropdown triggers a new API query for that specific type
typeFilter.addEventListener("change", () => {
    currentPage = 1;
    fetchMovies();
});

sortSelect.addEventListener("change", () => {
    sortAndDisplayMovies();
});

// 1. Fetch Data from OMDb API with Type Sub-Search Support
async function fetchMovies() {
    let query = searchInput.value.trim();
    
    // If search box is empty on initial load, default to "Marvel", otherwise use user input
    if (!query) {
        query = "Marvel";
    }
    showingTitle.innerHTML =query;    

    const selectedType = typeFilter.value;
    
    let url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(query)}&page=${currentPage}`;
    if (selectedType) {
        url += `&type=${selectedType}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.Response === "True") {
            currentMovies = data.Search;
            totalResultsCount = parseInt(data.totalResults, 10);
            
            // Add newly found types into our persistent global set
            currentMovies.forEach(movie => {
                if (movie.Type) knownTypes.add(movie.Type);
            });

            updateTypeDropdown();
            sortAndDisplayMovies();
            renderPagination();
        } else {
            moviesGrid.innerHTML = `<p>${data.Error || "No results found."}</p>`;
            paginationContainer.innerHTML = "";
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        moviesGrid.innerHTML = `<p>Failed to load data.</p>`;
    }
}

// 2. Populate Dropdown using the Persistent Global Set
function updateTypeDropdown() {
    const selectedType = typeFilter.value;
    
    typeFilter.innerHTML = `<option value="">All Types</option>`;
    knownTypes.forEach(type => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        if (type === selectedType) option.selected = true;
        typeFilter.appendChild(option);
    });
}

// 3. Sort Data and Display
function sortAndDisplayMovies() {
    let sorted = [...currentMovies];

    // Apply Sorting
    const sortVal = sortSelect.value;
    sorted.sort((a, b) => {
        if (sortVal === "a-z") {
            return a.Title.localeCompare(b.Title);
        } else if (sortVal === "z-a") {
            return b.Title.localeCompare(a.Title);
        } else if (sortVal === "oldest") {
            return parseInt(a.Year, 10) - parseInt(b.Year, 10);
        } else if (sortVal === "newest") {
            return parseInt(b.Year, 10) - parseInt(a.Year, 10);
        }
    });

    displayMovies(sorted);
}

// Display Movies on DOM
function displayMovies(movies) {
    if (movies.length === 0) {
        moviesGrid.innerHTML = `<p>No matches found.</p>`;
        return;
    }

    moviesGrid.innerHTML = movies.map(movie => movieCardHTML(movie)).join("");

    // After inserting into DOM, asynchronously check each image
    movies.forEach(movie => {
        const container = document.querySelector(`#card-${movie.imdbID} .movie-card__img-container`);
        if (!container) return;

        const posterUrl = container.dataset.poster;

        // Check if poster exists and is not "N/A"
        if (!posterUrl || posterUrl === "N/A") {
            renderPlaceholderHTML(container, movie.Title);
            return;
        }

        // Test if the image link returns a valid 200 OK image
        const imgTest = new Image();
        imgTest.src = posterUrl;
        
        imgTest.onload = function() {
            // Valid image: render standard image HTML
            container.innerHTML = `<img class="movie-card__img" src="${posterUrl}" alt="${movie.Title}"/>`;
        };

        imgTest.onerror = function() {
            // Invalid/Broken image: render completely different alternative HTML
            renderPlaceholderHTML(container, movie.Title);
        };
    });
}

// Alternative HTML structure when the image is invalid
function renderPlaceholderHTML(container, title) {
    container.innerHTML = `
        <div class="movie-card__poster-placeholder">
          ${title} <br>Poster <br>Not Available
        </div>
    `;
}

function movieCardHTML(movie){
    if(movie.Poster === "N/A"){
        console.log('hi')
    }
    return `
        <div class="movie-card" id="card-${movie.imdbID}">
            <div class="movie-card__img-container" data-poster="${movie.Poster}">
                <!-- Will be dynamically populated via JS check -->
            </div>
            <h2 class="movie-card__title">${movie.Title}</h2>
            <p class="movie-card__year">${movie.Year}</p>
            <p class="movie-card__type">${toProperCase(movie.Type)}</p>
        </div>
    `;
}

function toProperCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// 4. Pagination Logic
function renderPagination() {
    paginationContainer.innerHTML = "";
    const totalPages = Math.ceil(totalResultsCount / 10);

    for (let i = 1; i <= Math.min(totalPages, 20); i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        if (i === currentPage) btn.classList.add("active");
        btn.addEventListener("click", () => {
            currentPage = i;
            fetchMovies();
        });
        paginationContainer.appendChild(btn);
    }
}

// Initial Load on Page Startup
fetchMovies();