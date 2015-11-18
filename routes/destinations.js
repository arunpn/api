'use strict'

var g           = require('co-express')
  , fs          = require('fs')
  , request5    = require('request')
  , request     = require('co-request')
  , querystring = require('querystring')
  , sabre       = require('../misc/sabre-api')
  , AppToken    = require('../models/appToken')
  , Destination = require('../models/city')
  , Place       = require('../models/place')
  , PlaceImage  = Place.Image

var yelp = require('yelp').createClient({
  consumer_key: process.env.YELP_OAUTH_CONSUMER_KEY,
  consumer_secret: process.env.YELP_OAUTH_CONSUMER_SECRET,
  token: process.env.YELP_OAUTH_TOKEN,
  token_secret: process.env.YELP_OAUTH_TOKEN_SECRET
})

String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length == 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

/**
 * Generates the destination route
 * @param express.Router router
 */
var destination = (router) => {
    router.route('/search')
        .get(search)

    router.route('/destinations/top')
        .get(getTop)

    router.route('/destination/')
        .get(getAttractions)
}

/**
 * Returns a list of cities based on search query
 */
var search = g(function* (req, res, next) {
  var sent = false

  if(!req.query.query) {
    console.log("search error: empty query \r\n")
    res.err(res.errors.QUERY_IS_EMPTY, 400)
    sent = true
  }

  req.query.category = req.query.category || 'CITY'
  req.query.limit = req.query.limit > 0 ? req.query.limit : 3

  var destinations = yield Destination.findAll({
    attributes : Destination.attr,
    where : {
      reference : {
        $like : '%'+req.query.query+'%'
      }
    },
    limit : req.query.limit
  })

  var sent = false

  if (destinations.length == req.query.limit) {
    res.spit(destinations)
    sent = true
  }

  req.query.query = req.query.query || ""
  req.query.query = req.query.query.replace(/[ ,]/g, ".")

  var sabre_query = querystring.stringify(req.query)
  var sabreToken = yield sabre.getAppToken()

  var options = {
    url: `https://api.test.sabre.com/v1/lists/utilities/geoservices/autocomplete?${sabre_query}`,
    headers: {
      'Authorization': `${sabreToken.type} ${sabreToken.token}`
    }
  }

  var sabre_response = yield request(options)

  if (sabre_response.error || sabre_response.statusCode != 200) {
    console.log("sabre error: \r\n", sabre_response.statusCode, sabre_response.error)

    //access denied, token is probably expired
    if(sabre_response.statusCode == 401) {
      yield AppToken.refresh(sabre.ID)
      return yield search(req, res, next)
    }

    res.err(res.errors.FAILED_TO_SEARCH_LOCATION, sabre_response.statusCode)
    sent = true

  } else {
    var body = JSON.parse(sabre_response.body)

    var result = []

    for(let _city of body.Response.grouped["category:CITY"].doclist.docs) {
      var item = {}
      item.name = _city.city
      item.country = _city.country
      item.latitude = _city.latitude
      item.longitude = _city.longitude

      if(item.name && item.country)
        result.push(item)
    }

    if(!sent) {
      res.setHeader('Content-Type', 'application/json')
      res.spit(result)
    }
  }
})

/**
 * Returns popular destinations based on a location
 */
var getTop = g(function* (req, res, next) {
  req.query.limit = req.query.limit > 0 ? req.query.limit : 5

  var destinations = yield Destination.findAll({
    attributes : Destination.attr,
    limit : req.query.limit
  })

  var sent = false

  if (destinations.length + 1 >= req.query.limit) {
    res.spit(destinations)
    sent = true
  }

  req.query = req.query || {}
  req.query.origincountry = req.query.origincountry || 'BR'
  req.query.lookbackweeks = req.query.lookbackweeks || 8
  req.query.topdestinations = req.query.topdestinations || (req.query.limit > 0 ? req.query.limit : 5)
  delete req.query.limit

  var sabre_query = querystring.stringify(req.query)
  var sabreToken = yield sabre.getAppToken()

  var options = {
    url: `https://api.test.sabre.com/v1/lists/top/destinations?${sabre_query}`,
    headers: {
      'Authorization': `${sabreToken.type} ${sabreToken.token}`
    }
  }

  var sabre_response = yield request(options)

  if (sabre_response.error || sabre_response.statusCode != 200) {
    if(!sent) {
      console.log("sabre error: ", sabre_response.statusCode, sabre_response.error)

      //access denied, token is probably expired
      if(sabre_response.statusCode == 401) {
        yield AppToken.refresh(sabre.ID)
        return yield getTop(req, res, next)
      }

      res.err(res.errors.FAILED_TO_GET_TOP_DESTINATIONS, sabre_response.statusCode)
      sent = true
    }

  } else {
    var body = JSON.parse(sabre_response.body)

    var result = []

    for(let _d of body.Destinations) {
      var d = {}
      d.name = _d.Destination.DestinationName || _d.Destination.MetropolitanAreaName || ''
      d.country = _d.Destination.CountryCode || ''
      d.region = _d.Destination.RegionName || ''

      d = yield createDestinationFromObjectIfNotExists(d)

      result.push(d)
    }
  }

  if (!sent) {
    res.setHeader('Content-Type', 'application/json')
    res.spit(result)
  }
})

/**
* Returns attractions from a location
*/
var getAttractions = g(function* (req, res, next) {
  req.query = req.query || {}
  req.query.location = req.query.location || 'Sao Paulo, BR'
  req.query.sort = req.query.sort || 2
  req.query.radius_filter = req.query.radius_filter || 20000
  req.query.category_filter = req.query.category_filter || 'landmarks'
  req.query.limit = req.query.limit > 0 ? req.query.limit : 5

  var sent = false

  var destination = yield createDestinationFromLocationIfNotExists(req.query.location)

  if(!destination || !destination.id) {
    console.log("create error: \r\n", destination)
    res.err(res.errors.FAILED_TO_CREATE_DESTINATION, 400)
    return
  }

  var places = yield Place.findAll({
    attributes : Place.attr,
    where : {
      cityId : destination.id
    },
    limit : req.query.limit,
    include : [PlaceImage]
  })

  if (places.length + 1 >= req.query.limit) {
    res.spit(places)
    //sent = true
    return 
  }

  //https://api.yelp.com/v2/search/?location=Sao Paulo, Brazil&sort=2&limit=5&radius_filter=20000&category_filter=landmarks
  var result = []

  yelp.search(req.query, g(function*(error, data) {
    if (error) {
      if(!sent) {
        console.log("yelp error: \r\n", error)
        res.err(res.errors.FAILED_TO_SEARCH_YELP, 400)
        sent = true
      }

    } else {
      result = []

      for(let _b of data.businesses) {
        let b = {
          cityId: destination.id,
          name: _b.name,
          rating: _b.rating,
          reviewText: _b.snippet_text,
          reviewImage: _b.snippet_image_url,
          reviewCount: _b.review_count,
          telephone: _b.display_phone,
          location: `${_b.location.coordinate.latitude}, ${_b.location.coordinate.longitude}`
        }

        let place = yield Place.findOne({
          attributes : Place.attr,
          where      : {
            cityId : b.cityId,
            name : b.name
          }
        })

        if (!place && b.cityId) {
          place = (yield Place.create(b)).dataValues;
        }

        var location = `${place.name}, ${destination.reference}`
        place.images = yield getImagesFromLocation(location)
        saveImages(place.images, place.id)

        result.push(place)
      }
    }

    if (!sent) {
      res.setHeader('Content-Type', 'application/json')
      res.spit(result)
    }
  }))
})

var createDestinationFromObjectIfNotExists = g(function*(d) {
  d.picture = d.picture || ''
  d.reference = d.reference || d.name + ", " + d.country

  var destination = yield Destination.findOne({
    attributes  : Destination.attr,
    where       : {
      reference : d.reference
    }
  })

  if (destination)
    return destination;

  var images = yield getImagesFromLocation(d.reference, 1) || []
  d.picture = images.length >= 1 ? images[0].url : null

  return (yield Destination.create(d)).dataValues;
})


var createDestinationFromLocationIfNotExists = g(function* (location, limit) {
  if(!location) return null

  var query = {}
  query.category = query.category || 'CITY'
  query.limit = query.limit > 0 ? query.limit : 3
  query.query = decodeURIComponent(location).replace(/[ ,]/g, '.')
  var sabre_query = querystring.stringify(query)

  var destination = yield Destination.findOne({
    attributes  : Destination.attr,
    where       : {
      reference : location
    }
  })

  if (destination)
   return destination

 var sabreToken = yield sabre.getAppToken()

  var options = {
   url: `https://api.test.sabre.com/v1/lists/utilities/geoservices/autocomplete?${sabre_query}`,
   headers: {
     'Authorization': `${sabreToken.type} ${sabreToken.token}`
   }
  }

  var sabre_response = yield request(options)

  if (sabre_response.error || sabre_response.statusCode != 200) {
    console.log("sabre error: ", sabre_response.statusCode, sabre_response.error)

    //access denied, token is probably expired
    if(sabre_response.statusCode == 401) {
      yield AppToken.refresh(sabre.ID)
      return yield createDestinationFromLocationIfNotExists(location, limit)
    }

    return null
  }

  var body = JSON.parse(sabre_response.body)

  var cities = body.Response.grouped["category:CITY"].doclist.docs
  var item = cities.length > 0 ? cities[0] : null

  if(item == null || !item.city || !item.country)
   return null

  var city = {}
  city.reference = item.city + ", " + item.country
  city.name = item.city
  city.country = item.country
  city.latitude = item.latitude
  city.longitude = item.longitude

  return createDestinationFromObjectIfNotExists(city)
})


var getImagesFromLocation = g(function* (location, limit) {
  limit = limit > 0 ? limit : 4
  console.log("getImagesFromLocation", location, limit)

  var url = `http://ajax.googleapis.com/ajax/services/search/images?v=1.0&as_filetype=jpg&imgsz=large&imgtype=photo&key=${process.env.GOOGLE_API_KEY}&q=${location}`
  var google_response = yield request(url)

  if (!google_response.error && google_response.statusCode == 200) {
      var allImages = JSON.parse(google_response.body).responseData.results
      var images = []

      for(let i = 0; i < limit && i < allImages.length; i++) {
        var image = {
          width: allImages[i].width,
          height: allImages[i].height,
          url: allImages[i].url
        }

        images.push(image)
      }

      return images
  }

  return []
})

var saveImages = g(function* (images, placeId, limit) {
  if(!placeId) return false
  limit = limit > 0 ? limit : 4

  var placeImage = yield PlaceImage.findOne({
    attributes : PlaceImage.attr,
    where      : {
      placeId : placeId
    }
  })

  if(placeImage)
    return false

  for(let i = 0; i < limit && i < images.length; i++) {
    yield PlaceImage.create({
      placeId : placeId,
      url : images[i].url
    })
  }

  return true
})

/**
 * Expose routes/destination
 */
exports = module.exports = destination
