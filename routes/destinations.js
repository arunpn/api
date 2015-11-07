'use strict'

var g = require('co-express')
    , request = require('co-request')
    , querystring = require('querystring')

/**
 * Models
 */
var Destination = require('../models/destination')


let GOOGLE_API_KEY = 'AIzaSyB5Q4l1SFgRemCPGFtmXYQyj_tpjKXpB-0'
let YELP_OAUTH_CONSUMER_KEY = '8Bi6DFWjnldZgFpnb0Rl7g'
let YELP_OAUTH_CONSUMER_SECRET = 'oQwVUPVZzSMW4HSII0NfSadBuqE'
let YELP_OAUTH_TOKEN = 'kHOEFyvtDyUC7j-5nJ4MHfg_otpKSBcu'
let YELP_OAUTH_TOKEN_SECRET = 'A0gM8aHoJ7tjP3UKTKaoPMrysdk'
let YELP_OAUTH_SIGNATURE_METHOD = 'HMAC-SHA1'

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

    router.route('/destinations/top')
        .get(getTop)

    router.route('/destination/')
        .get(getDetails)
}

/**
 * Returns top destinations based on a location
 */
var getTop = g(function* (req, res, next) {
  req.query = req.query || {}
  req.query.origincountry = req.query.origincountry || 'BR'
  req.query.lookbackweeks = req.query.lookbackweeks || 8
  req.query.topdestinations = req.query.topdestinations || req.query.limit || 5
  delete req.query.limit

  var sabre_query = querystring.stringify(req.query)

  var sabre_options = {
    url: `https://api.test.sabre.com/v1/lists/top/destinations?${sabre_query}`,
    headers: {
      'Authorization': 'Bearer T1RLAQITHiOB25iRslvyGrLuQDLlWioUNBBKWV7H/qncjBelC1wBzfPEAACgDnwfU7sLqEgGwMMFm9AqZrKkj/oKU9Zs2udW3vS8LX506n7wQCajp7SS8H3dIiMhk0LmJIhubQV69WCqVLYts+YAewkeMQelymqP/cL6HchZGpvTAsFOKO3qU/31zDtBAcKbuzLd0vjdn7fMf6TGyNkE72LpNSL8SbZpileBL0RU9qJC61uAeTlA7CrWG09ECO9u3Nc+SejAB8AQoPpK8g**'
    }
  }

  var sabre_response = yield request(sabre_options)
  var result = {status: sabre_response.statusCode}

  if (sabre_response.error || sabre_response.statusCode != 200) {
    result.error = sabre_response.error
  } else {
    var body = JSON.parse(sabre_response.body)

    result.data = []
    for(let _d of body.Destinations) {
      var d = {}
      d.city = _d.Destination.CityName || _d.Destination.MetropolitanAreaName || ''
      d.country = _d.Destination.CountryName || ''
      d.region = _d.Destination.RegionName || ''
      d.image = ''

      var destination = yield Destination.findOne({
        attributes : Destination.attr,
        where      : {
          city    : d.city,
          country : d.country
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

      result.data.push(d)
    }
  }

  res.setHeader('Content-Type', 'application/json')
  res.send(result)
})

/**
* Returns top destinations based on a location
*/
var getDetails = g(function* (req, res, next) {
  req.query = req.query || {}
  req.query.location = req.query.location || 'Sao Paulo, Brazil'
  req.query.sort = req.query.sort || 2
  req.query.limit = req.query.limit || 5
  req.query.radius_filter = req.query.radius_filter || 20000
  req.query.category_filter = req.query.category_filter || 'landmarks'

  //https://api.yelp.com/v2/search/?location=Sao Paulo, Brazil&sort=2&limit=5&radius_filter=20000&category_filter=landmarks
  var result = {}
  yelp.search(req.query, g(function*(error, data) {
    result = {}

    if (error) {
      result.status = 400
      result.error = error

    } else {
      result.status = 200
      result.data = []

      for(let _b of data.businesses) {
        let b = {
          name: _b.name,
          rating: _b.rating,
          review_text: _b.snippet_text,
          review_image: _b.snippet_image_url,
          review_count: _b.review_count,
          phone: _b.display_phone,
          latitude: _b.location.coordinate.latitude,
          longitude: _b.location.coordinate.longitude,
          images: []
        }

        var url = `http://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=${b.name}, ${req.query.location}&as_filetype=jpg&imgsz=large&imgtype=photo&key=${GOOGLE_API_KEY}`
        var google_response = yield request(url)

        if (!google_response.error && google_response.statusCode == 200) {
          var images = JSON.parse(google_response.body).responseData.results

          b.images = []
          for(var i = 0; i < 4 && i < images.length; i++) {
            var image = {
              width: images[i].width,
              height: images[i].height,
              url: images[i].url
            }

            b.images.push(image)
          }

          result.data.push(b)
        }
      }
    }

    res.setHeader('Content-Type', 'application/json')
    res.send(result)
  }))
})

/**
 * Expose routes/destination
 */
exports = module.exports = destination
