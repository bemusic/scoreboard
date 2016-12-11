const log4js = require('log4js')
const MongoClient = require('mongodb').MongoClient
const Promise = require('bluebird')
const MongoDBRepositoryFactory = require('./MongoDBRepositoryFactory')
const createApiServer = require('./createApiServer')

function main () {
  return Promise.coroutine(function * () {
    const DEFAULT_MONGO_URL = 'mongodb://127.0.0.1:27017/bemuse'
    const db = yield connectMongo(process.env.MONGO_URL || DEFAULT_MONGO_URL)
    const factory = new MongoDBRepositoryFactory({ db })
    const port = +process.env.PORT || 8008
    const app = createApiServer({
      logger: log4js.getLogger('HTTP'),
      // TODO legacyUserApiKey
      // TODO legacyUserRepository
      rankingEntryRepository: factory.createRankingEntryRepository()
    })
    runApiServer(app, port)
  })()
}

main().catch((e) => setTimeout(() => { throw e }))

function connectMongo (mongoUrl) {
  const logger = log4js.getLogger('MongoDB')
  logger.info('Connecting to MongoDB...')
  return MongoClient.connect(mongoUrl).then((db) => {
    logger.info('Connected to MongoDB!')
    return db
  })
}

function runApiServer (app, port) {
  app.listen(port, function (err) {
    if (err) throw err
    const address = this.address()
    log4js.getLogger('HTTP').info('Listening on port ' + address.port)
  })
}
