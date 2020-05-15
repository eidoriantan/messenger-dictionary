
const request = require('./utils/request.js')

const API = 'https://www.dictionaryapi.com/api/v3/references/ithesaurus/json'
const API_KEY = process.env.API_KEY

async function getDef (word) {
  const params = new URLSearchParams()
  params.set('key', API_KEY)

  const url = `${API}/${word}?${params.toString()}`
  const response = await request('GET', url)
  let result = ''

  if (Array.isArray(response.body)) {
    result += 'Word was not found. Did you mean:\r\n'
    result += response.body.join(', ')
  } else {
    result += 'Definitions:\r\n'
    response.body.shortdef.forEach((def, index) => {
      result += `Definition ${index + 1}:\r\n`
      result += def + '\r\n\r\n'
    })
  }

  return result
}

module.exports = { getDef }
