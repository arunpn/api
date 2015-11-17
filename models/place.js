'use strict'

var g = require('co-express')
    , Sequelize = require('sequelize')
    , sequelize = require('../config/database')().sequelize

/**
 * The place model
 */
var Place = sequelize.define('place', {
    id          : { type : Sequelize.INTEGER, primaryKey : true },
    cityId      : { type : Sequelize.INTEGER },
    name        : { type : Sequelize.STRING  },
    rating      : { type : Sequelize.INTEGER },
    reviewText  : { type : Sequelize.STRING  },
    reviewImage : { type : Sequelize.STRING  },
    reviewCount : { type : Sequelize.INTEGER },
    telephone   : { type : Sequelize.STRING  },
    location    : { type : Sequelize.STRING  }
})

/**
 * The place image model
 */
var PlaceImage = sequelize.define('placeImage', {
    placeId : { type : Sequelize.INTEGER },
    url     : { type : Sequelize.STRING  }
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

// Associates PlaceImage with Place
Place.Image = PlaceImage

/**
 * Expose models/place
 */
exports = module.exports = Place
