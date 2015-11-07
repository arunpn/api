'use strict'

var isArray = require('./is-array')

/**
 * Expose misc/format
 */
exports = module.exports = (req, res, next) => {

    res.spit = (data, status, format) => {
        status = status || 200
        format = format || 'json'

        var spittle = data;

        if (format == 'json') {
            spittle = {
                'data' : isArray(data) ? data : [data]
            }
        } else if (format == 'xml') {

        }

        res.status(status).send(spittle)
    }

    next()
}
