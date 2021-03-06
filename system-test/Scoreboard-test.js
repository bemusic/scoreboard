const assert = require('assert')
const { step, action } = require('prescript')
const { graphql } = require('./lib/common')

step('Register players', () => {
  step('Register flicknote', () => graphql(`mutation { registerPlayer(name: "flicknote") { id } }`))
  step('Link account flicknote', () => graphql(`mutation { linkPlayer(jwt: "valid.flicknote.a") { id, linked } }`))

  step('Register dtinth', () => graphql(`mutation { registerPlayer(name: "dtinth") { id } }`))
  step('Link account dtinth', () => graphql(`mutation { linkPlayer(jwt: "valid.dtinth.b") { id, linked } }`))
})

step('Obtain player token', () => {
  step('Obtain playerToken for flicknote', () => graphql(`mutation { authenticatePlayer(jwt: "valid.flicknote.a") { playerToken } }`))
  step('Ensure correct token', () => action(state => {
    assert.equal(state.response.data.data.authenticatePlayer.playerToken, 'valid.flicknote')
  }))
  step('Renew playerToken for flicknote', () => graphql(`mutation { renewPlayerToken(playerToken: "valid.flicknote") { playerToken } }`))
  step('Ensure correct token', () => action(state => {
    assert.equal(state.response.data.data.renewPlayerToken.playerToken, 'valid.flicknote')
  }))
})

step('Save flicknote score', () => graphql(`mutation {
  registerScore(
    playerToken: "valid.flicknote",
    md5: "01234567012345670123456701234567",
    playMode: "BM",
    input: {
      score: 400000,
      combo: 50,
      total: 150,
      count: [ 10, 20, 30, 40, 50 ],
      log: "ABCX"
    }
  ) {
    resultingRow { rank, entry { id, playCount, score, combo, count, player { name } } }
    level { leaderboard { rank, entry { id, score, combo, count, player { name } } } }
  }
}`))

step('Save dtinth score', () => graphql(`mutation {
  registerScore(
    playerToken: "valid.dtinth",
    md5: "01234567012345670123456701234567",
    playMode: "BM",
    input: {
      score: 300000,
      combo: 50,
      total: 150,
      count: [ 10, 20, 30, 40, 50 ],
      log: "ABCX"
    }
  ) {
    resultingRow { rank, entry { id, playCount, score, combo, count, player { name } } }
    level { leaderboard { rank, entry { id, score, combo, count, player { name } } } }
  }
}`))
step('Verify result', () => action(state => {
  const { data } = state.response.data
  assert.equal(data.registerScore.resultingRow.rank, 2)
  assert.equal(data.registerScore.resultingRow.entry.playCount, 1)
}))

step('Load single score', () => graphql(`query {
  chart (md5: "01234567012345670123456701234567") {
    level (playMode: "BM") {
      myRecord (playerToken: "valid.dtinth") {
        rank, entry { score }
      }
    }
  }
}`))
step('Verify result', () => action(state => {
  const { data } = state.response.data
  assert.equal(data.chart.level.myRecord.rank, 2)
  assert.equal(data.chart.level.myRecord.entry.score, 300000)
}))

step('Save another score', () => graphql(`mutation {
  registerScore(
    playerToken: "valid.dtinth",
    md5: "01234567012345670123456701234568",
    playMode: "BM",
    input: {
      score: 200000,
      combo: 20,
      total: 20,
      count: [ 10, 10, 10, 10, 10 ],
      log: "ABCX"
    }
  ) {
    resultingRow { entry { id } }
  }
}`))
step('Load multiple scores', () => graphql(`query {
  me (playerToken: "valid.dtinth") {
    records (md5s: [
      "01234567012345670123456701234567",
      "01234567012345670123456701234568",
      "01234567012345670123456701234569"
    ]) {
      md5, playMode, entry { score }
    }
  }
}`))
step('Verify result', () => action(state => {
  const { data } = state.response.data
  assert.equal(data.me.records.length, 2)
  assert.equal(typeof data.me.records[0].entry.score, 'number')
}))
