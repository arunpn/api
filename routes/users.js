'use strict'

/**
 * Loads the libraries
 */
var g = require('co-express')
    , fbAuth = require('../misc/facebook-auth')
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

    router.route(root + '/auth')
        .get(auth)
}

/**
 * Returns the current user
 */
var me = g(function* (req, res, next) {
    res.spit(req.user)
})

/**
 * Authenticates an user from its FB token
 * @query fb_token
 */
var auth = g(function* (req, res, next) {
    let fbToken = req.query.fb_token

    var fbUser = yield fbAuth(fbToken)

    if (fbUser.error) {
        res.err(res.errors.FB_TOKEN_DENIED, 401)
    } else {

    }
})
