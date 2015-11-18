'use strict'

/**
 * Loads the libraries
 */
var g            = require('co-express')
  , request      = require('co-request')
  , yelpSearch   = require('../misc/yelp-search')
  , searchImages = require('../misc/search-images.js')

/**
 * Loads the models
 */
var City    = require('../models/city')
  , Place   = require('../models/place')
  , User    = require('../models/user')

/**
 * Generates the place route
 * @param express.Router router
 */
exports = module.exports = (router) => {
  let root = '/places'

  router.route(root + '/search')
    .get(search)

  router.route('/cities/:id' + root + '/search')
    .get(getCity, search)

}

/**
 * Returns a list of places based on a city, radius or location
 * @query (opt) city      Place city
 * @query (opt) country   Place country
 * @query (opt) radius    Place radius
 * @query (opt) latitude  Place latitude (must come with radius)
 * @query (opt) longitude Place longitude (must come with radius)
 */
var search = g(function* (req, res, next) {
  var city      = req.query.city      || ''
  var country   = req.query.country   || ''
  var radius    = req.query.radius    || ''
  var latitude  = req.query.latitude  || ''
  var longitude = req.query.longitude || ''
  var limit     = req.query.limit     || 10
  var offset    = req.query.offset    || 0

  // City is a required parameter
  if (city == '') {
    res.err(res.errors.QUERY_IS_EMPTY, 400)
    return
  }

  // Lookup for city
  var city = yield City.createFromLocation(city, country)

  // Couldn't create it, error
  if (!city) {
    console.log("create error: \r\n", destination)
    res.err(res.errors.FAILED_TO_CREATE_DESTINATION, 400)
    return
  }

  // Search for places within given city
  var places = yield Place.findAll({
    attributes : Place.attr,
    where : {
      cityId : city.id
    },
    limit   : limit,
    offset  : offset,
    include : [ Place.Image ]
  })

  // If found enough places, return
  if (places.length == limit) {
    res.spit(places)
    return
  }

  places = []
  var promises = []

  // Search for places on Yelp API
  var data = yield yelpSearch({
    location        : city.name + ', ' + city.country,
    sort            : 2,
    radius_filter   : 20000,
    category_filter : 'landmarks',
    limit           : limit,
    offset          : offset
  })

  if (data.error) {
    console.log("yelp error: \r\n", error)
    res.err(res.errors.FAILED_TO_SEARCH_YELP, 400)
    return
  }

  // Creates all places
  for (let _data of data.businesses) {
    let _place = {
      cityId      : city.id,
      name        : _data.name,
      rating      : _data.rating,
      reviewText  : _data.snippet_text,
      reviewImage : _data.snippet_image_url,
      reviewCount : _data.review_count,
      telephone   : _data.display_phone,
      location    : _data.location.coordinate.latitude,
      longitude   : _data.location.coordinate.longitude
    }

    // Lookup for place
    let place = yield Place.findOne({
      attributes : Place.attr,
      where      : {
        cityId : _place.cityId,
        name   : _place.name
      }
    })

    // Creates the place
    if (!place) {
      promises.push(Place.createNested(_place, city))
    } else {
      places.push(place)
    }
  }

  // Concatenate everything
  places = places.concat(yield promises)

  res.spit(places)

})

var getCity = g(function* (req, res, next) {
  var city = (yield City.findOne({
    attributes : City.attr,
    where : {
      id : req.params.id
    }
  })).dataValues

  if (!city) {
    res.err(res.errors.CITY_NOT_FOUND, 404)
    return
  }

  req.query.city    = city.name
  req.query.country = city.country

  next()
})
