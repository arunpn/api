'use strict'

var fb = require('fb')

/**
 * Expose misc/facebookAuth
 */
exports = module.exports = (accessToken) => {
    return new Promise(function(resolve, reject) {
        fb.setAccessToken(accessToken);
        fb.api('me', function(fbRes) {
            resolve(fbRes)
        })
    })
}
