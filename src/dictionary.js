
/**
 *  Messenger Dictionary
 *  Copyright (C) 2020 Adriane Justine Tan
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const request = require('./utils/request.js')

const API = 'https://dictionaryapi.com/api/v3/references/collegiate/json'
const API_KEY = process.env.API_KEY

/**
 *  Gets the word's definitions using the Merriam-Webster's
 *
 *    @param {string} word    The word to get the definitions from
 *    @return {string} result
 */
async function getDef (word) {
  word = word.replace(/[?%&]/g, '')

  const params = new URLSearchParams()
  params.set('key', API_KEY)

  const url = `${API}/${encodeURIComponent(word)}?${params.toString()}`
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
      const meta = item.meta
      const fl = item.fl || 'unknown'

      if (meta.id.split(':')[0] !== word && !meta.stems.includes(word) &&
        item.shortdef.length === 0) return

      count++
      result += `*Word:* ${meta.id} (${fl})\r\n`
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
