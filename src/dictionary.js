
const request = require('./utils/request.js')

const API = 'https://dictionaryapi.com/api/v3/references/ithesaurus/json'
const API_KEY = process.env.API_KEY

async function getDef (word) {
  const params = new URLSearchParams()
  params.set('key', API_KEY)

  const url = `${API}/${word}?${params.toString()}`
  const response = await request('GET', url)
  let result = ''

  const defToString = object => {
    let string = `*Word*: ${object.meta.id}\r\n`
    object.shortdef.forEach((def, index) => {
      string += `Definition ${index + 1}:\r\n`
      string += def + '\r\n\r\n'
    })

    return string
  }

  if (Array.isArray(response.body)) {
    console.log('ARRAY')
    if (typeof response.body[0] === 'string') {
      result += 'Word was not found. Did you mean:\r\n'
      result += response.body.join(', ') + '?'
    } else {
      result += `${response.body.length} word(s) was found\r\n`
      response.body.forEach(word => {
        result += defToString(word)
      })
    }
  } else result += defToString(response.body)

  return result
}

module.exports = { getDef }
