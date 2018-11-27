/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL)
      .then(response => {
        if (!response.ok) {
          throw Error('Request failed. Returned status of ${response.statusText}');
        }
        const restaurants = response.json();
        return restaurants;
      })
      .then(restaurants => callback(null, restaurnats))
      .catch(err => callback(err, null));
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.id}-300.jpg`);
  }

  /**
   * Home restaurant image srcset.
   */
  static imageSrcsetHome(restaurant) {
    return (`/img/${restaurant.id}-300.jpg 1x, /img/${restaurant.id}-600_2x.jpg 2x`);
  }

   /**
   * Restaurant page image srcset.
   */
  static imageSrcsetRestaurantPage(restaurant) {
    return (`/img/${restaurant.id}-300.jpg 300w, /img/${restaurant.id}-400.jpg 400w, /img/${restaurant.id}-600_2x.jpg 600w, /img/${restaurant.id}-800_2x.jpg 800w`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}

static newRestaurantReview(id, name, rating, comments, callback) {
  const restaurantData = {
    'restaurant_id': id,
    'name': name,
    'rating': rating,
    'comments': comments
  };
  fetch(DBHelper.DATABASE_URL + '/reviews/', {
    headers: { 'Content-Type': 'application/form-data' }
    method: 'POST',
    body: JSON.stringify(restaurantData)
  })
    .then(response => response.json())
    .then(data => callback(null, restaurantData))
    .catch(err => callback(err, null));
}

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
      DBHelper.buildReview(data)
        .then(review_key => {
          console.log('review_key', review_key);
          DBHelper.addRequestToQueue(url, headers, method, data, review_key)
            .then(offline_key => console.log('offline_key', offline_key));
        });
      callback(err, null);
    });
}

static buildReview(review) {
  return idbKeyValue.setReturnId('reviews', review)
    .then(id => {
      console.log('Created on Reviews', review);
      return id;
    });
}

static addRequest(url, headers, method, data, review_key) {
  const request = {
    url: url,
    headers: headers,
    method: method,
    data: data,
    review_key: review_key
  };
  return idbKeyValue.setReturnId('offline', request)
    .then(id => {
      console.log('Saved offline', request);
      return id;
    });
}