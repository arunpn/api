'use strict'

/**
 * Loads the libraries
 */
var g = require('co-express')
    , request = require('co-request')

/**
 * Loads the models
 */
var User = require('../models/user')

/**
 * Generates the user route
 * @param express.Router router
 */
exports = module.exports = (router) => {
    let root = '/users'

    router.route(root + '/me')
        .get(User.authenticator, me)
}

/**
 * Returns the current user
 */
var me = g(function* (req, res, next) {
    res.spit(req.user)
})
