'use strict'

var g = require('co-express')
    , fs = require('fs')
    , request5 = require('request')
    , request = require('co-request')
    , querystring = require('querystring')

var requestPipToFile = function(url, filepath) {
    return new Promise(function(resolve, reject) {
        try {
            var stream = fs.createWriteStream(filepath);
            stream.on('finish', function() {
                console.log("pipe finish");
                return resolve(true);
            });
            return request5(url).pipe(stream);
        } catch (e) {
            return reject(e);
        }
    });
};

/**
 * Models
 */
var Destination = require('../models/destination')
var _Place = require('../models/place')
var Place = _Place.Place
var PlaceImage = _Place.PlaceImage

let GOOGLE_API_KEY = 'AIzaSyB5Q4l1SFgRemCPGFtmXYQyj_tpjKXpB-0'
let YELP_OAUTH_CONSUMER_KEY = '8Bi6DFWjnldZgFpnb0Rl7g'
let YELP_OAUTH_CONSUMER_SECRET = 'oQwVUPVZzSMW4HSII0NfSadBuqE'
let YELP_OAUTH_TOKEN = 'kHOEFyvtDyUC7j-5nJ4MHfg_otpKSBcu'
let YELP_OAUTH_TOKEN_SECRET = 'A0gM8aHoJ7tjP3UKTKaoPMrysdk'
let YELP_OAUTH_SIGNATURE_METHOD = 'HMAC-SHA1'
let SABRE_AUTH_HEADER = 'Bearer T1RLAQITHiOB25iRslvyGrLuQDLlWioUNBBKWV7H/qncjBelC1wBzfPEAACgDnwfU7sLqEgGwMMFm9AqZrKkj/oKU9Zs2udW3vS8LX506n7wQCajp7SS8H3dIiMhk0LmJIhubQV69WCqVLYts+YAewkeMQelymqP/cL6HchZGpvTAsFOKO3qU/31zDtBAcKbuzLd0vjdn7fMf6TGyNkE72LpNSL8SbZpileBL0RU9qJC61uAeTlA7CrWG09ECO9u3Nc+SejAB8AQoPpK8g**'

var yelp = require('yelp').createClient({
  consumer_key: YELP_OAUTH_CONSUMER_KEY,
  consumer_secret: YELP_OAUTH_CONSUMER_SECRET,
  token: YELP_OAUTH_TOKEN,
  token_secret: YELP_OAUTH_TOKEN_SECRET
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
  req.query.limit = req.query.limit || 3

  var destinations = yield Destination.findAll({
    attributes : Destination.attr,
    where : {
      reference : {
        $like : '%'+req.query.query+'%'
      }
    },
    limit : req.query.limit,
    order : ['weight']
  })

  var sent = false

  if (destinations.length == req.query.limit) {
    res.spit(destinations)
    sent = true
  }

  req.query.query = req.query.query || ""
  req.query.query = req.query.query.replace(/[ ,]/g, ".")

  var sabre_query = querystring.stringify(req.query)

  var sabre_options = {
    url: `https://api.test.sabre.com/v1/lists/utilities/geoservices/autocomplete?${sabre_query}`,
    headers: {
      'Authorization': SABRE_AUTH_HEADER
    }
  }

  var sabre_response = yield request(sabre_options)

  if (sabre_response.error || sabre_response.statusCode != 200) {
    console.log("sabre error: \r\n", sabre_response.error)
    res.err(res.errors.FAILED_TO_SEARCH_LOCATION, sabre_response.statusCode)
    sent = true

  } else {
    var body = JSON.parse(sabre_response.body)

    var result = []
    var time = new Date().getTime()
    var i = 0

    for(let _city of body.Response.grouped["category:CITY"].doclist.docs) {
      var item = {}
      item.city = _city.city
      item.country = _city.country
      item.latitude = _city.latitude
      item.longitude = _city.longitude

      if(item.city && item.country)
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
  req.query.limit = req.query.limit || 5

  var destinations = yield Destination.findAll({
    attributes : Destination.attr,
    limit : req.query.limit,
    order : ['weight']
  })

  var sent = false

  if (destinations.length + 1 >= req.query.limit) {
    res.spit(destinations)
    sent = true
  }

  req.query = req.query || {}
  req.query.origincountry = req.query.origincountry || 'BR'
  req.query.lookbackweeks = req.query.lookbackweeks || 8
  req.query.topdestinations = req.query.topdestinations || req.query.limit || 5
  delete req.query.limit

  var sabre_query = querystring.stringify(req.query)

  var sabre_options = {
    url: `https://api.test.sabre.com/v1/lists/top/destinations?${sabre_query}`,
    headers: {
      'Authorization': SABRE_AUTH_HEADER
    }
  }

  var sabre_response = yield request(sabre_options)

  if (sabre_response.error || sabre_response.statusCode != 200) {
    if(!sent) {
      console.log("sabre error: \r\n", sabre_response.error)
      res.err(res.errors.FAILED_TO_GET_TOP_DESTINATIONS, sabre_response.statusCode)
      sent = true
    }

  } else {
    var body = JSON.parse(sabre_response.body)

    var result = []

    var date = new Date().getTime()
    var i = 0

    for(let _d of body.Destinations) {
      var d = {}
      d.weight = "" + date + (i++)
      d.city = _d.Destination.CityName || _d.Destination.MetropolitanAreaName || ''
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

  if(!destination || !destination.reference) {
    console.log("create error: \r\n", destination)
    res.err(res.errors.FAILED_TO_CREATE_DESTINATION, 400)
    return
  }

  var places = yield Place.findAll({
    attributes : Place.attr,
    where : {
      destinationId : destination.reference
    },
    limit : req.query.limit,
    include : [PlaceImage]
  })

  if (places.length + 1 >= req.query.limit) {
    res.spit(places)
    sent = true
    res.spit(places)
  }

  req.query.limit++

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

      var date = new Date().getTime()
      var i = 0

      for(let _b of data.businesses) {
        let b = {
          place: _b.name + ", " + destination.reference,
          destinationId: destination.reference,
          weight: "" + date + (i++),
          name: _b.name,
          rating: _b.rating,
          review_text: _b.snippet_text,
          review_image: _b.snippet_image_url,
          review_count: _b.review_count,
          phone: _b.display_phone,
          latitude: _b.location.coordinate.latitude,
          longitude: _b.location.coordinate.longitude
        }

        let place = yield Place.findOne({
          attributes : Place.attr,
          where      : {
            place : b.place
          }
        })

        if (!place && b.destinationId) {
          place = (yield Place.create(b)).dataValues;
        }

        place.images = yield getImagesFromLocation(place.place)
        saveImages(place.images, place.place)

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
  d.image = d.image || ''
  d.reference = d.reference || d.city + ", " + d.country

  var destination = yield Destination.findOne({
    attributes  : Destination.attr,
    where       : {
      reference : d.reference
    }
  })

  if (destination)
    return destination;

  var images = yield getImagesFromLocation(d.reference, 1) || []
  d.image = images.length >= 1 ? images[0].url : null

  return (yield Destination.create(d)).dataValues;
})


var createDestinationFromLocationIfNotExists = g(function* (location, limit) {
  if(!location) return null

  var query = {}
  query.category = query.category || 'CITY'
  query.limit = query.limit || 3
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

  var sabre_options = {
   url: `https://api.test.sabre.com/v1/lists/utilities/geoservices/autocomplete?${sabre_query}`,
   headers: {
     'Authorization': SABRE_AUTH_HEADER
   }
  }

  var sabre_response = yield request(sabre_options)

  if (sabre_response.error || sabre_response.statusCode != 200)
   return null

  var body = JSON.parse(sabre_response.body)

  var cities = body.Response.grouped["category:CITY"].doclist.docs
  var item = cities.length > 0 ? cities[0] : null

  if(item == null || !item.city || !item.country)
   return null

  var city = {}
  city.reference = item.city + ", " + item.country
  city.city = item.city
  city.country = item.country
  city.latitude = item.latitude
  city.longitude = item.longitude

  return createDestinationFromObjectIfNotExists(city)
})


var getImagesFromLocation = g(function* (location, limit) {
  limit = limit || 4
  console.log("getImagesFromLocation", location, limit)

  var url = `http://ajax.googleapis.com/ajax/services/search/images?v=1.0&as_filetype=jpg&imgsz=large&imgtype=photo&key=${GOOGLE_API_KEY}&q=${location}`
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

var saveImages = g(function* (images, placeReference, limit) {
  if(!placeReference) return false
  limit = limit > 0 ? limit : 4

  var placeImage = yield PlaceImage.findOne({
    attributes : PlaceImage.attr,
    where      : {
      placePlace : placeReference
    }
  })

  if(placeImage)
    return false

  for(let i = 0; i < limit && i < images.length; i++) {
    yield PlaceImage.create({
      placePlace : placeReference,
      url : images[i].url
    })
  }

  return true
})

/**
 * Expose routes/destination
 */
exports = module.exports = destination
