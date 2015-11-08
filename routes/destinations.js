'use strict'

var g = require('co-express')
    , request = require('co-request')
    , querystring = require('querystring')

/**
 * Models
 */
var Destination = require('../models/destination')
var Place = require('../models/place')

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
        .get(getDetails)
}

/**
 * Returns a list of cities based on search query
 */
var search = g(function* (req, res, next) {
  if(!req.query.query) res.err(res.errors.QUERY_IS_EMPTY, 400)
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

  var sabre_query = querystring.stringify(req.query)

  var sabre_options = {
    url: `https://api.test.sabre.com/v1/lists/utilities/geoservices/autocomplete?${sabre_query}`,
    headers: {
      'Authorization': SABRE_AUTH_HEADER
    }
  }

  var sabre_response = yield request(sabre_options)

  if (sabre_response.error || sabre_response.statusCode != 200) {
    res.err(res.errors.UNKNOWN_ERROR, sabre_response.statusCode)

  } else {
    var body = JSON.parse(sabre_response.body)

    var result = []
    var time = new Date().getTime()
    var i = 0

    for(let _city of body.Response.grouped["category:CITY"].doclist.docs) {
      var d = {}
      d.weight = time + (i++) + ""
      d.city = _city.city
      d.country = _city.countryName
      d.region = _city.stateName
      d.image = ''
      d.reference = _city.city + ', ' + _city.country

      var destination = yield Destination.findOne({
        attributes : Destination.attr,
        where      : {
          reference : d.reference
        }
      })

      if (!destination) {
        var url = `http://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=${d.city}, ${d.country}&as_filetype=jpg&imgsz=large&imgtype=photo&key=${GOOGLE_API_KEY}`
        var google_response = yield request(url)

        if (!google_response.error && google_response.statusCode == 200) {
          var images = JSON.parse(google_response.body).responseData.results

          if(images.length > 0) {
            d.image = images[0].url
          }
        }

        yield Destination.create(d);
      } else {
        d = destination
      }

      if(d.city && d.country)
        result.push(d)
    }

    if (!sent) {
      res.setHeader('Content-Type', 'application/json')
      res.spit(result)
    }
  }
})

/**
 * Returns top destinations based on a location
 */
var getTop = g(function* (req, res, next) {

  req.query.limit = req.query.limit || 5

  var destinations = yield Destination.findAll({
    attributes : Destination.attr,
    limit : req.query.limit,
    order : ['weight']
  })

  var sent = false

  if (destinations.length == req.query.limit) {
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
  var result

  if (sabre_response.error || sabre_response.statusCode != 200) {
    result.error = sabre_response.error
  } else {
    var body = JSON.parse(sabre_response.body)

    result = []

    var date = new Date().getTime()
    var i = 0

    for(let _d of body.Destinations) {
      var d = {}
      d.weight = "" + date + (i++)
      d.city = _d.Destination.CityName || _d.Destination.MetropolitanAreaName || ''
      d.country = _d.Destination.CountryName || ''
      d.region = _d.Destination.RegionName || ''
      d.image = ''
      d.reference = d.city + ", " + d.country

      var destination = yield Destination.findOne({
        attributes : Destination.attr,
        where      : {
          reference : d.reference
        }
      })

      if (!destination) {
        var url = `http://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=${d.city}, ${d.country}&as_filetype=jpg&imgsz=large&imgtype=photo&key=${GOOGLE_API_KEY}`
        var google_response = yield request(url)

        if (!google_response.error && google_response.statusCode == 200) {
          var images = JSON.parse(google_response.body).responseData.results

          if(images.length > 0) {
            d.image = images[0].url
          }
        }

        yield Destination.create(d);
      } else {
        d = destination
      }

      result.push(d)
    }
  }

  if (!sent) {
    res.setHeader('Content-Type', 'application/json')
    res.spit(result)
  }
})

/**
* Returns top destinations based on a location
*/
var getDetails = g(function* (req, res, next) {
  req.query = req.query || {}
  req.query.location = req.query.location || 'Sao Paulo, Brazil'
  req.query.sort = req.query.sort || 2
  req.query.radius_filter = req.query.radius_filter || 20000
  req.query.category_filter = req.query.category_filter || 'landmarks'
  req.query.limit = req.query.limit || 5

  var places = yield Place.findAll({
    attributes : Place.attr,
    where : {
      destinationId : req.query.location
    },
    limit : req.query.limit,
    include : [Place.Images],
    order : ['weight']
  })

  var sent = false

  places = JSON.parse(JSON.stringify(places))

  if (places.length >= req.query.limit) {
    for (var i=0; i<places.length; i++) {
      places[i].images = places[i]['place-images']
      delete places[i]['place-images']
    }

    sent = true
    res.spit(places)
  }

  req.query.limit++
  
  //https://api.yelp.com/v2/search/?location=Sao Paulo, Brazil&sort=2&limit=5&radius_filter=20000&category_filter=landmarks
  var result = []

  yelp.search(req.query, g(function*(error, data) {
    if (error) {
      res.err(res.errors.UNKNOWN_ERROR, 400)
      sent = true

    } else {
      result = []

      var date = new Date().getTime()
      var i = 0
      
      for(let _b of data.businesses) {
        var b = {
          weight: "" + date + (i++),
          destinationId: req.query.location,
          name: _b.name,
          rating: _b.rating,
          review_text: _b.snippet_text,
          review_image: _b.snippet_image_url,
          review_count: _b.review_count,
          phone: _b.display_phone,
          latitude: _b.location.coordinate.latitude,
          longitude: _b.location.coordinate.longitude,
          place: _b.location.coordinate.latitude + "," + _b.location.coordinate.longitude
        }

        let place = yield Place.findOne({
          attributes : Place.attr,
          where      : {
            place : b.place
          }
        })

        if (!place) {
          yield Place.create(b);

          var url = `http://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=${b.name}, ${req.query.location}&as_filetype=jpg&imgsz=large&imgtype=photo&key=${GOOGLE_API_KEY}`
          var google_response = yield request(url)

          if (!google_response.error && google_response.statusCode == 200) {
            var images = JSON.parse(google_response.body).responseData.results

            b.images = []
            for(let i = 0; i < 4 && i < images.length; i++) {
              var image = {
                width: images[i].width,
                height: images[i].height,
                url: images[i].url
              }

              b.images.push(image)

              yield Place.Images.create({
                placePlace : b.place,
                url : image.url
              })
            }
          }
        }

        result.push(b)
      }
    }

    if (!sent) {
      res.setHeader('Content-Type', 'application/json')
      res.spit(result)
    }
  }))
})

/**
 * Expose routes/destination
 */
exports = module.exports = destination
