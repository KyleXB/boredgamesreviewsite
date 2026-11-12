// Express IWebAPI - Mounts presentation layer controllers
const express = require('express')
const app = express()

app.use(express.json())

// Mount controllers
app.use('/api/accounts', require('./controllers/accountController'))
app.use('/api/games', require('./controllers/gameController'))
app.use('/api/reviews', require('./controllers/reviewController'))
app.use('/api/moderation', require('./controllers/moderationController'))
app.use('/api/recommendations', require('./controllers/recommendationController'))

const PORT = process.env.PORT || 3001
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
  })
}

module.exports = app

