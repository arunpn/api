'use strict'

/**
 * Loads the libraries
 */
var g       = require('co-express')
  , request = require('co-request')

/**
 * Loads the models
 */
var City    = require('../models/city')
  , Place   = require('../models/place')
  , User    = require('../models/user')

/**
 * Generates the place route
 * @param express.Router router
 */
exports = module.exports = (router) => {
  let root = '/places'

  router.route(root + '/search').get(User.authenticator, search)
}

/**
 * Returns a list of places based on search queries
 * @query (opt) name     Place name
 * @query (opt) city     Place city
 * @query (opt) radius   Place radius
 * @query (opt) location Place location (must come with radius)
 */
var search = g(function* (req, res, next) {

})
