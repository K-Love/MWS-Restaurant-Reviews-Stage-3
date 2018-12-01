let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const favorite = document.getElementById('favorite-restaurant');
  if (restaurant.is_favorite === 'true') {
    favorite.classList.add('active');
    favorite.setAttribute('aria-pressed', 'true');
    favorite.innerHTML = 'Remove ${restaurant.name} as a favorite';
    favorite.title = 'Remove ${restaurant.name} as a favorite';
  } else {
    favorite.setAttribute('aria-pressed', 'false');
    favorite.innerHTML = 'Add ${restaurant.name} as a favorite';
    favorite.title = 'Add ${restaurant.name} as a favorite';
  }
  favorite.addEventListener('click', (evt) => {
    evt.preventDefault();
    if (favorite.classList.contains('active')) {
      favorite.setAttribute('aria-pressed', 'false');
      favorite.innerHTML = 'Add ${restaurant.name} as a favorite';
      favorite.title = 'Add ${restaurant.name} as a favorite';
      DBHelper.unMarkFavorite(restaurant.id);
    } else {
      favorite.setAttribute('aria-pressed', 'true');
      favorite.innerHTML = 'Remove ${restaurant.name} as a favorite';
      favorite.title = 'Remove ${restaurant.name} as a favorite';
      DBHelper.markFavorite(restaurant.id);
    }
    favorite.classList.toggle('active');

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  const altText =' visit ' + restaurant.name + ' in ' + restaurant.neighborhood;
  image.title = altText;
  image.alt = altText;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
},

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
},

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
},

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
},

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
},

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
});

// Add new review button
const form = document.getElementById('new-review-form');
form.addEventListener('add', newReview, false);

var focusableElementsString = 'a[href], area[href], input:not([disabled]),' +
  'select:not([disabled]), textarea:not([disabled]), button:not([disabled]),' + 
  'iframe, object, embed, [tabindex="0"], [contenteditable]';

// Convert NodeList to Array
focusElements = Array.prototype.slice.call(focusElements);

var firstTabStop = focusElements[0];
var lastTabStop = focusElements[focusElements.length - 1];

// Focus first child
// firstTabStop.focus();
const reviewer = document.getElementById('reviewer');
reviewer.focus();

function trapTab(e) {
  if (e.keyCode === 9) {

    if (e.shiftKey) {
      if (document.activeElement === firstTabStop) {
        e.preventDefault();
        lastTabStop.focus();
      }

    } else {
      if (document.activeElement === lastTabStop) {
        e.preventDefault();
        firstTabStop.focus();
      }
    }
  }

const newReview = (e) => {
e.preventDefault();

const name = document.querySelector('#reviewer').value;
const rating = document.querySelector('input[name=rate]:checked').value;
const comments = document.querySelector('#restaurant-comments').value;

DBHelper.newRestaurantReview(self.restaurant.id, name, rating, comments,
  (error, review) => {
  console.log('callback');
  if (error) {
    console.log('Error adding review');
  } else {
    console.log(review);
    window.location.href = `/restaurant.html?id=${self.restaurant.id}`;
  }
});
};

const setFocus = (evt) => {
const rateRadios = document.getElementsByName('rating');
const rateRadiosArr = Array.from(ratingRadios);
const anyChecked = ratingRadiosArr.some(radio => { 
  return radio.checked === true; 
});
if (!anyChecked) {
  const oneStar = document.getElementById('oneStar');
  oneStar.focus();
}
};

const navRadio = (evt) => {
const oneStar = document.getElementById('oneStar');  
const twoStars = document.getElementById('twoStars');  
const threeStars = document.getElementById('threeStars');  
const fourStars = document.getElementById('fourStars');  
const fiveStars = document.getElementById('fiveStars');  

if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(evt.key)) {
  evt.preventDefault();
  // console.log('attempting return');
  if (evt.key === 'ArrowRight' || evt.key === 'ArrowDown') {
    switch(evt.target.id) {
      case 'oneStar':
        star2.focus();
        star2.checked = true;
        break;
      case 'twoStars':
        star3.focus();
        star3.checked = true;
        break;
      case 'threeStars':
        star4.focus();
        star4.checked = true;
        break;
      case 'fourStars':
        star5.focus();
        star5.checked = true;
        break;
      case 'fiveStars':
        star1.focus();
        star1.checked = true;
        break;
    }
  } else if (evt.key === 'ArrowLeft' || evt.key === 'ArrowUp') {
    switch(evt.target.id) {
      case 'oneStar':
        star5.focus();
        star5.checked = true;
        break;
      case 'twoStars':
        star1.focus();
        star1.checked = true;
        break;
      case 'threeStars':
        star2.focus();
        star2.checked = true;
        break;
      case 'fourStars':
        star3.focus();
        star3.checked = true;
        break;
      case 'fiveStars':
        star4.focus();
        star4.checked = true;
        break;
    }
  }
}
};

const saveAddReview = (e) => {
  e.preventDefault();
  const form = e.target;

  if (form.checkValidity()) {
    console.log('is valid');

    const restaurant_id = self.restaurant.id;
    const name = document.querySelector('#reviewer').value;
    const rating = document.querySelector('input[name=rate]:checked').value;
    const comments = document.querySelector('#reviewComments').value;
  
    // attempt save to database server
    DBHelper.createRestaurantReview(restaurant_id, name, rating, comments,
      (error, review) => {
      console.log('got callback');
      form.reset();
      if (error) {
        console.log('We are offline. Review has been saved to the queue.');
        window.location.href =
          `/restaurant.html?id=${self.restaurant.id}&isOffline=true`;
      } else {
        console.log('Received updated record from DB Server', review);
        DBHelper.createIDBReview(review); // write record to local IDB store
        window.location.href = `/restaurant.html?id=${self.restaurant.id}`;
      }
    });
  }
};

static buildReview(restaurant_id, name, rating, comments, callback) {
  const url = DBHelper.DATABASE_URL + '/reviews/';
  const headers = { 'Content-Type': 'application/form-data' };
  const method = 'POST';
  const data = {
    restaurant_id: restaurant_id,
    name: name,
    rating: +rating,
    comments: comments
  };

  const body = JSON.stringify(data);
  // const body = data;

  fetch(url, {
    headers: headers,
    method: method,
    body: body
  })
    .then(response => response.json())
    .then(data => callback(null, data))
    .catch(err => {
      // We are offline...
      // Save review to local IDB
      DBHelper.buildReview(data)
        .then(review_key => {
          // Get review_key and save it with review to offline queue
          console.log('returned review_key', review_key);
          DBHelper.addRequestToQueue(url, headers, method, data, review_key)
            .then(offline_key => console.log('offline_key', offline_key));
        });
      callback(err, null);
    });
}