'use strict'

var g = require('co-express')
    , Sequelize = require('sequelize')
    , sequelize = require('../config/database')().sequelize

/**
 * The place model
 */
var Place = sequelize.define('place', {
    destinationId : { type : Sequelize.STRING },
    weight        : { type : Sequelize.STRING },
    name          : { type : Sequelize.STRING },
    rating        : { type : Sequelize.INTEGER },
    review_text   : { type : Sequelize.STRING },
    review_image  : { type : Sequelize.STRING },
    review_count  : { type : Sequelize.INTEGER },
    phone         : { type : Sequelize.STRING },
    latitude      : { type : Sequelize.STRING },
    longitude     : { type : Sequelize.STRING },
    place         : { type : Sequelize.STRING, primaryKey : true }
})

var PlaceImage = sequelize.define('placeImage', {
    url     : { type : Sequelize.STRING }
})

/**
 * Creates the relationship
 */
Place.hasMany(PlaceImage)

/**
 * Creates the relationship
 */
PlaceImage.belongsTo(Place)

/**
 * The place attributes
 */
Place.attr = {
    /* all */
}

/**
 * The placeImage attributes
 */
PlaceImage.attr = {
    /* all */
}

/**
 * Expose models/place
 */
module.exports.Place = Place
module.exports.PlaceImage = PlaceImage
