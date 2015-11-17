'use strict'

// Loads environment variables
require('dotenv').load()

var express = require('express')
    , bodyParser = require('body-parser')
    , app = express()
    , router = express.Router()

var routes = require('./routes/main')(router)
    , errHandler = require('./misc/error-handler')
    , formatter = require('./misc/formatter')

/**
 * Configure the middlewares
 */
app.use(bodyParser.urlencoded({ extended : true }))
app.use('/docs', express.static('docs'));
app.use(errHandler)
app.use(formatter)
app.use((req, res, next) => {
    console.log("["+req.method+"] "+req.url)
    next()
})

/**
 * Configure the app routes
 */
app.use('/', router)

app.use('/images', express.static('images'));
/**
 * Runs the server
 */
app.listen(process.env.PORT, () => {
    console.log('Running at :' + process.env.PORT)
})
