'use strict'

var errors = {
    /**
     * Errors code and description
     */
    '100' : 'Unknown error',
    '101' : 'Query cannot be empty',

    /**
     * Helpers
     */
    UNKNOWN_ERROR : 100,
    QUERY_IS_EMPTY : 101
}

/**
 * Expose misc/erros
 *
 * It modifies the response when an error is found.
 *
 * @param res The response handler.
 * @param code The intern error code.
 * @param status The HTTP/1.1 response code.
 */
exports = module.exports = (req, res, next) => {

    res.err = (code, status) => {
        var description = '[ \'#' + code + '\', \''

        description += errors[code] + '\' ]'

        res.writeHead(status, description, {'content-type' : 'text/plain'})
        res.end()
    }

    res.errs = errors

    next()
}
