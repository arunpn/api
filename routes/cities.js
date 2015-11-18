'use strict'

/**
 * Loads the libraries
 */
var g       = require('co-express')
  , request = require('co-request')

/**
 * Loads the models
 */
var City  = require('../models/city')
  , User  = require('../models/user')

/**
 * Generates the city route
 * @param express.Router router
 */
exports = module.exports = (router) => {
  let root = '/cities'

  router.route(root + '/search')
    .get(User.authenticator, search)

  router.route(root + '/:id')
    .get(User.authenticator, get)
}

/**
 * Returns a list of cities based on search queries
 * @query (opt) name     City name
 * @query (opt) country  City country
 * @query (opt) region   City region
 */
var search = g(function* (req, res, next) {
  let name     = req.query.name     || ''
  let country  = req.query.country  || ''
  let region   = req.query.region   || ''

  let cities = yield City.findAll({
    attributes : City.attr,
    where : {
      $and : [
        { name    : { $like : '%'+ name    +'%' } },
        { country : { $like : '%'+ country +'%' } },
        { region  : { $like : '%'+ region  +'%' } }
      ]
    },
    limit  : req.query.limit,
    offset : req.query.offset
  })

  // Load cities from the third-party API
  if (cities.length == 0) {
    // Load here from Sabre or Google
  }

  res.spit(cities)
})

/**
 * Returns an city by id
 */
var get = g(function* (req, res, next) {
  let id = req.params.id

  let city = yield City.findOne({
    attributes : City.attr,
    where : {
      id : id
    }
  })

  if (city == null) {
    res.err(res.errors.CITY_ID_NOT_FOUND, 404)
  } else {
    res.spit(city)
  }
})
