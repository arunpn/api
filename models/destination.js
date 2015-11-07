'use strict'

var g = require('co-express')
    , Sequelize = require('sequelize')
    , sequelize = require('../config/database')().sequelize

/**
 * The destination model
 */
var Destination = sequelize.define('destination', {
    city    : { type : Sequelize.STRING, primaryKey : true },
    country : { type : Sequelize.STRING, primaryKey : true },
    region  : { type : Sequelize.STRING },
    image   : { type : Sequelize.STRING }
})

/**
 * The destination attributes
 */
Destination.attr = {
    /* all */
}

/**
 * Expose models/destination
 */
exports = module.exports = Destination
