// processing and distribution server
initWebServer()
//initDataServer()

// set up web server
function initWebServer () {
    const express = require('express')
    const path = require('path')
    const app = express()
    app.use(express.static(path.join(__dirname, '/public')))
    app.listen(3000, () => console.log('Web Server listening on port 3000!'))
}