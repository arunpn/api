'use strict'

var g = require('co-express')
  , Sequelize = require('sequelize')
  , sequelize = require('../config/database')().sequelize

/**
 * The city model
 */
var City = sequelize.define('city', {
  id        : { type : Sequelize.INTEGER, primaryKey : true },
  reference : { type : Sequelize.STRING,  primaryKey : true },
  name      : { type : Sequelize.STRING },
  country   : { type : Sequelize.STRING },
  region    : { type : Sequelize.STRING },
  picture   : { type : Sequelize.STRING }
})

/**
 * The city attributes
 */
City.attr = {
  /* all */
}

/**
 * Expose models/city
 */
exports = module.exports = City
