// scripts.js

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const priceFilter = document.getElementById('price-filter');
  const reviewForm = document.getElementById('review-form');

  // Login page
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await handleLogin();
    });
  }

  // Index page (places list)
  if (document.getElementById('places-list')) {
    handleIndexPageAuth();
    if (priceFilter) {
      priceFilter.addEventListener('change', handlePriceFilter);
    }
  }

  // Place details page
  if (window.location.pathname.includes('place.html')) {
    handlePlaceDetailsAuth();
  }

  // Add review page
  if (window.location.pathname.includes('add_review.html')) {
    const token = checkAuthOrRedirect();
    const placeId = getPlaceIdFromURL();

    if (reviewForm && token && placeId) {
      reviewForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const comment = document.getElementById('comment')?.value.trim();
        const rating = parseInt(document.getElementById('rating')?.value);

        if (!comment || !rating) {
          alert('Please enter both a comment and a rating.');
          return;
        }

        await submitReview(token, placeId, comment, rating);
      });
    }
  }
});


function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function getPlaceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('place_id') || params.get('id');
}

function checkAuthOrRedirect() {
  const token = getCookie('token');
  if (!token) {
    window.location.href = 'index.html';
  }
  return token;
}


async function handleLogin() {
  const email = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value.trim();

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      alert('Login failed. Please check your credentials.');
      return;
    }

    const data = await response.json();
    const token = data.access_token;

    if (!token) {
      alert('No token received.');
      return;
    }

    document.cookie = `token=${token}; path=/; max-age=86400; Secure`;
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Login error:', error);
    alert('An error occurred. Please try again later.');
  }
}


function handleIndexPageAuth() {
  const token = getCookie('token');
  const loginLink = document.getElementById('login-link');

  if (loginLink) loginLink.style.display = token ? 'none' : 'block';

  if (token) {
    fetchPlaces(token);
  } else {
    const placesList = document.getElementById('places-list');
    if (placesList) placesList.innerHTML = '';
  }
}

async function fetchPlaces(token) {
  try {
    const response = await fetch('http://localhost:5000/api/places', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to fetch places');

    const data = await response.json();
    displayPlaces(data);
  } catch (error) {
    console.error(error);
    alert('Error loading places.');
  }
}

function displayPlaces(places) {
  const placesList = document.getElementById('places-list');
  if (!placesList) return;

  placesList.innerHTML = '';

  (places || []).forEach((place) => {
    const card = document.createElement('div');
    card.className = 'place-card';
    card.setAttribute('data-price', place.price_per_night);

    card.innerHTML = `
      <h3>${place.name}</h3>
      <p>Price per night: $${place.price_per_night}</p>
      <a href="place.html?id=${place.id}" class="details-button">View Details</a>
    `;

    placesList.appendChild(card);
  });
}

function handlePriceFilter(event) {
  const selectedValue = event.target.value;
  const maxPrice = selectedValue === 'All' ? Infinity : parseFloat(selectedValue);
  const cards = document.querySelectorAll('.place-card');

  cards.forEach((card) => {
    const price = parseFloat(card.getAttribute('data-price'));
    card.style.display = price <= maxPrice ? 'block' : 'none';
  });
}


function handlePlaceDetailsAuth() {
  const token = getCookie('token');
  const placeId = getPlaceIdFromURL();
  const addReviewSection = document.getElementById('add-review');
  const addReviewLink = document.getElementById('add-review-link');
  const loginLink = document.getElementById('login-link');

  if (loginLink) loginLink.style.display = token ? 'none' : 'block';
  if (addReviewSection) addReviewSection.style.display = token ? 'block' : 'none';

  if (addReviewLink && placeId) {
    addReviewLink.setAttribute('href', `add_review.html?place_id=${placeId}`);
  }

  fetchPlaceDetails(token, placeId);
}

async function fetchPlaceDetails(token, placeId) {
  if (!placeId) {
    alert('Missing place ID.');
    return;
  }

  try {
    const response = await fetch(`http://localhost:5000/api/places/${placeId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!response.ok) throw new Error('Failed to fetch place details');

    const data = await response.json();
    displayPlaceDetails(data);
  } catch (error) {
    console.error(error);
    alert('Error loading place details.');
  }
}

function displayPlaceDetails(place) {
  const detailsContainer = document.getElementById('place-details');
  const reviewsContainer = document.getElementById('reviews');

  if (!detailsContainer) return;

  const amenities = Array.isArray(place.amenities) ? place.amenities : [];
  const reviews = Array.isArray(place.reviews) ? place.reviews : [];

  detailsContainer.innerHTML = `
    <h2>${place.name ?? 'Place'}</h2>
    <div class="place-info">
      <p><strong>Host:</strong> ${place.host ?? '—'}</p>
      <p><strong>Price:</strong> $${place.price_per_night ?? '—'}</p>
      <p><strong>Description:</strong> ${place.description ?? '—'}</p>
      <p><strong>Amenities:</strong> ${amenities.length ? amenities.join(', ') : 'No amenities listed'}</p>
    </div>
  `;

  if (reviewsContainer) {
    reviewsContainer.innerHTML = '<h3>Reviews</h3>';
    if (!reviews.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No reviews yet.';
      reviewsContainer.appendChild(empty);
    } else {
      reviews.forEach((review) => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        reviewCard.innerHTML = `
          <p><strong>${review.user ?? 'Anonymous'}:</strong> ${review.comment ?? ''}</p>
          <p>Rating: ${review.rating ?? '-'} / 5</p>
        `;
        reviewsContainer.appendChild(reviewCard);
      });
    }
  }
}


async function submitReview(token, placeId, comment, rating) {
  try {
    const response = await fetch(`http://localhost:5000/api/places/${placeId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ comment, rating })
    });

    if (response.ok) {
      alert('Review submitted successfully!');
      document.getElementById('review-form').reset();
    } else {
      const errorData = await response.json();
      alert('Failed to submit review: ' + (errorData.message || response.statusText));
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    alert('An error occurred while submitting the review.');
  }
}
