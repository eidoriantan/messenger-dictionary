
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
