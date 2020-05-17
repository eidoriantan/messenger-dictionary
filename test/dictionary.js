
const dictionary = require('../src/dictionary.js')
const should = require('should')

process.env.DEBUG = true

describe('Dictionary', () => {
  it('Get definitions', async () => {
    const response = await dictionary.getDef('body')
    should.ok(response)
    should.notEqual(response, '')
  })

  it('Get definitions of a non-existent word', async () => {
    const response = await dictionary.getDef('adajbwasdgvys')
    const result = response.indexOf('Word was not found') > -1
    should.ok(result)
  })
})
