'use strict'
const log4js = require('log4js')
const express = require('express')
const graphqlHTTP = require('express-graphql')
const bcrypt = require('bcrypt')

const createRoot = require('./createRoot')
const schema = require('./schema')

function createApiServer ({
  logger,
  rankingEntryRepository,
  legacyUserApiKey,
  legacyUserRepository
} = { }) {
  const app = express()

  // Logging
  if (logger) {
    app.use(log4js.connectLogger(logger, { level: log4js.levels.INFO }))
  }

  // Legacy user
  app.use('/legacyusers', createLegacyUserApi(legacyUserApiKey, legacyUserRepository))

  // GraphQL
  if (rankingEntryRepository) {
    const rootValue = createRoot({ rankingEntryRepository })
    app.use(graphqlHTTP({ schema, rootValue, graphiql: true }))
  }

  return app
}

function createLegacyUserApi (apiKey, legacyUserRepository) {
  const router = express.Router()
  router.use(require('body-parser').urlencoded({ extended: false }))
  router.use(function (req, res, next) {
    if (req.body.apiKey !== apiKey) {
      res.status(400).json({ error: 'Invalid API key.' })
      return
    }
    next()
  })

  router.post('/check', function (req, res, next) {
    // TODO: playerIdOrEmail
    const usernameOrEmail = String(req.body.usernameOrEmail)
    const password = String(req.body.password)
    Promise.resolve(authenticate(usernameOrEmail, password))
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: 'Unauthenticated' })
        return
      }
      res.json(formatUser(user))
    })
    .catch(next)
  })

  router.post('/get', function (req, res, next) {
    const email = String(req.body.email)
    Promise.resolve(legacyUserRepository.findByEmail(email))
    .then((user) => {
      if (!user) {
        res.status(404).json({ error: 'Not found' })
        return
      }
      res.json(formatUser(user))
    })
    .catch(next)
  })

  return router

  function formatUser (user) {
    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    }
  }

  function authenticate (playerIdOrEmail, password) {
    return Promise.resolve(legacyUserRepository.findByEmail(playerIdOrEmail))
    .then((user) => {
      if (!user) return false
      return bcrypt.compare(password, user.hashedPassword).then((result) =>
        result && user
      )
    })
  }
}

module.exports = createApiServer
