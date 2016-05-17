'use strict'

var g            = require('co-express')
  , Sequelize    = require('sequelize')
  , sequelize    = require('../config/database')().sequelize
  , searchImages = require('../misc/search-images.js')

var City = require('./city')

/**
  * The place model
  */
var Place = sequelize.define('place', {
  id : {
    type          : Sequelize.INTEGER,
    primaryKey    : true,
    autoIncrement : true
  },
  cityId    : { type : Sequelize.INTEGER },
  name      : { type : Sequelize.STRING  },
  latitude  : { type : Sequelize.DOUBLE  },
  longitude : { type : Sequelize.DOUBLE  },
  address   : { type : Sequelize.STRING  },
  postcode  : { type : Sequelize.STRING  },
  email     : { type : Sequelize.STRING  },
  website   : { type : Sequelize.STRING  },
  telephone : { type : Sequelize.STRING  },
  factualId : { type : Sequelize.STRING  }
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
Place.belongsTo(City)

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
PlaceImage.attr = [
  'url'
]

// Associates PlaceImage with Place
Place.Image = PlaceImage

Place.createNested = g(function* (_place, city) {
  // Creates the place
  var place = (yield Place.create(_place)).dataValues;

  // Lookup for images
  var location = `${place.name}, ${city.name} - ${city.country}`
  place.images = yield searchImages(location)

  // Insert them on the database
  for (let image of place.images) {

    var placeImage = yield Place.Image.findOne({
      attributes : Place.Image.attr,
      where : {
        placeId : place.id,
        url     : image.url
      }
    })

    if (placeImage) continue

    image = (yield Place.Image.create({
      placeId : place.id,
      url     : image.url
    })).dataValues

  }

  return place
})

/**
  * Expose models/place
  */
exports = module.exports = Place
