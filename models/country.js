'use strict'

var g = require('co-express')
  , Sequelize = require('sequelize')
  , sequelize = require('../config/database')().sequelize

/**
 * The country model
 */
var Country = sequelize.define('country', {
  id : {
    type          : Sequelize.INTEGER,
    primaryKey    : true,
    autoIncrement : true
  },
  name : { type : Sequelize.STRING },
  code : { type : Sequelize.STRING }
})

/**
 * The country attributes
 */
Country.attr = {
  /* all */
}

/**
 * Expose models/country
 */
exports = module.exports = Country
