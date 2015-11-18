'use strict'

var g = require('co-express')
  , Sequelize = require('sequelize')
  , sequelize = require('../config/database')().sequelize

var searchImages = require('../misc/search-images.js')

/**
 * The city model
 */
var City = sequelize.define('city', {
  id        : { type : Sequelize.INTEGER, primaryKey : true },
  reference : { type : Sequelize.STRING, primaryKey : true  },
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
City.createFromLocation = g(function* (location) {

})

/**
 * Creates a city from an object
 */
City.createFromObject = g(function* (_city) {

  // Checks if city exists on database
  var city = yield City.findOne({
    attributes  : City.attr,
    where       : {
      reference : _city.reference
    }
  })

  if (city) return city.dataValues

  // Search for an image
  var images = yield searchImages(_city.city, 1) || []
  _city.picture = images.length >= 1 ? images[0].url : null

  // Creates city
  return (yield City.create(_city)).dataValues;

})

/**
 * Expose models/city
 */
exports = module.exports = City
