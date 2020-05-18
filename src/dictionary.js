
/**
 *  Copyright 2020 Adriane Justine Tan
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const request = require('./utils/request.js')

const API = 'https://dictionaryapi.com/api/v3/references/ithesaurus/json'
const API_KEY = process.env.API_KEY

/**
 *  Gets the word's definitions using the Merriam-Webster's
 *
 *    @param {string} word    The word to get the definitions from
 *    @return {string} result
 */
async function getDef (word) {
  word = word.toLowerCase()
  const params = new URLSearchParams()
  params.set('key', API_KEY)

  const url = `${API}/${word}?${params.toString()}`
  const response = await request('GET', url)
  const body = response.body
  let result = ''

  if (typeof body === 'string') {
    result = body
  } else if (body.length === 0 || typeof body[0] === 'string') {
    result += 'Word was not found. Did you mean:\r\n'
    result += body.map(word => `"${word}"`).join(', ') + '?'
  } else if (typeof body[0] === 'object') {
    let count = 0
    body.forEach(item => {
      if (item.meta.id !== word) return

      count++
      result += `*Word:* ${item.meta.id}\r\n`
      item.shortdef.forEach((def, index) => {
        result += `Definition ${index + 1}:\r\n`
        result += def + '\r\n\r\n'
      })
    })

    result = `${count} word(s) was found\r\n\r\n` + result
  }

  return result
}

module.exports = { getDef }
