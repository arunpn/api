'use strict'

var g = require('co-express')
  , Sequelize = require('sequelize')
  , sequelize = require('../config/database')().sequelize
  , sabre     = require('../misc/sabre-api')

var searchImages = require('../misc/search-images.js')

/**
 * The city model
 */
var City = sequelize.define('city', {
  id : {
    type          : Sequelize.INTEGER,
    primaryKey    : true,
    autoIncrement : true
  },
  name      : { type : Sequelize.STRING },
  country   : { type : Sequelize.STRING },
  latitude  : { type : Sequelize.DOUBLE },
  longitude : { type : Sequelize.DOUBLE },
  picture   : { type : Sequelize.STRING }
})

/**
 * The city attributes
 */
City.attr = {
  /* all */
}

/**
 * Creates a city from a location
 */
City.createFromLocation = g(function* (name, country) {
  if (!name || !country) return null

  // Lookup for city
  var city = yield City.findOne({
    attributes : City.attr,
    where      : {
      name    : { $like : '%'+ name    +'%' },
      country : { $like : '%'+ country +'%' }
    }
  })

  // If exists, return it
  if (city)
    return city.dataValues

  // Creates the Sabre search object
  var query = {}
  query.category  = 'CITY'
  query.limit     = 1
  query.query     = decodeURIComponent(name + ', ' + country).replace(/[ ,]/g, '.')

  var sabreQuery = querystring.stringify(query)
  var sabreToken = yield sabre.getAppToken()

  var options = {
    url: `https://api.test.sabre.com/v1/lists/utilities/geoservices/autocomplete?${sabreQuery}`,
    headers: {
      'Authorization': `${sabreToken.type} ${sabreToken.token}`
    }
  }

  // Request information from Sabre
  var sabreRes = yield request(options)

  if (sabreRes.error || sabreRes.statusCode != 200) {
    console.log("sabre error: ", sabreRes.statusCode, sabreRes.error)

    // Access denied, token is probably expired
    if(sabreRes.statusCode == 401) {
      yield AppToken.refresh(sabre.ID)
      return yield City.createFromLocation(name, country)
    }

    return null
  }

  // Creates the object from the response
  var body = JSON.parse(sabreRes.body)

  var cities = body.Response.grouped["category:CITY"].doclist.docs
  var item   = cities.length > 0 ? cities[0] : null

  if (item == null || !item.city || !item.country)
    return null

  // Prepares for insertion
  var city = {}
  city.name      = item.city
  city.country   = item.country
  city.latitude  = item.latitude
  city.longitude = item.longitude

  return City.createFromObject(city)
})

/**
 * Creates a city from an object
 */
City.createFromObject = g(function* (_city) {

  // Checks if city exists on database
  var city = yield City.findOne({
    attributes : City.attr,
    where      : {
      name    : _city.name,
      country : _city.country,
    }
  })

  if (city) return city.dataValues

  console.log('searching for images');

  // Search for an image
  var images = yield searchImages(_city.name, 1) || []
  _city.picture = images.length >= 1 ? images[0].url : null

  console.log('images searched');

  // Creates city
  return (yield City.create(_city)).dataValues;

})

/**
 * Expose models/city
 */
exports = module.exports = City
