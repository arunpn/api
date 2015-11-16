'use strict'

var errors = {
    /**
     * Errors code and description
     */
    '100' : 'Unknown error',
    '101' : 'Query cannot be empty',
    '102' : 'Failed to create destination',
    '103' : 'Failed to search for location',
    '104' : 'Failed to get top destinations',
    '105' : 'Failed to search on Yelp',

    /**
     * Helpers
     */
    UNKNOWN_ERROR : 100,
    QUERY_IS_EMPTY : 101,
    FAILED_TO_CREATE_DESTINATION : 102,
    FAILED_TO_SEARCH_LOCATION : 103,
    FAILED_TO_GET_TOP_DESTINATIONS : 104,
    FAILED_TO_SEARCH_YELP : 105,
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

    res.errors = errors

    next()
}
