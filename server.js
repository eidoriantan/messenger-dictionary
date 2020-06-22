
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

const express = require('express')
const serveIndex = require('serve-index')
const crypto = require('crypto')

const logger = require('./src/utils/log.js')
const send = require('./src/utils/send.js')
const dictionary = require('./src/dictionary.js')

const ACCESS_TOKEN = process.env.ACCESS_TOKEN
const VALIDATION_TOKEN = process.env.VALIDATION_TOKEN
const APP_SECRET = process.env.APP_SECRET
const PORT = process.env.PORT || 8080
const DEBUG = process.env.DEBUG || false

const app = express()

if (!ACCESS_TOKEN || !VALIDATION_TOKEN || !APP_SECRET) {
  throw new Error('Access, App Secret and/or validation token was not defined')
}

app.use((req, res, next) => {
  res.set('Content-Type', 'text/plain')
  res.set('Content-Language', 'en')
  next()
})

app.use(express.json({
  verify: (req, res, buf) => {
    const signature = req.get('x-hub-signature')
    if (!signature) throw new Error('No signature')

    const elements = signature.split('=')
    const method = elements[0]
    const hash = elements[1]
    const hmac = crypto.createHmac(method, APP_SECRET)
    const expected = hmac.update(buf).digest('hex')

    if (hash !== expected) {
      logger.write('Invalid signature')
      logger.write(`Signature: ${signature}`)
      logger.write('Body:')
      logger.write(req.body)

      res.status(403).send('Invalid signature')
      throw new Error('Invalid signature')
    }
  }
}))

const logs = logger.directory
app.use('/logs', express.static(logs), serveIndex(logs, {
  icons: true,
  view: 'details'
}))

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const verifyToken = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && verifyToken === VALIDATION_TOKEN) {
    res.status(200).send(challenge)
    return true
  } else {
    logger.write('Mode/verification token doesn\'t match')
    logger.write('Parameters:')
    logger.write({ mode, verifyToken, challenge })

    res.status(403).send('Mode/verification token doesn\'t match')
    return false
  }
})

app.post('/webhook', (req, res) => {
  const data = req.body
  if (data.object !== 'page') {
    logger.write('Object is not a page')
    logger.write('Data:')
    logger.write(data)

    res.status(403).send('An error has occurred')
    return false
  }

  data.entry.forEach(entry => {
    entry.messaging.forEach(event => {
      if (DEBUG) {
        console.log('A new event was received: ')
        console.log(event)
      }

      if (event.message) {
        receivedMessage(event)
      } else {
        logger.write('Unknown/unsupported event')
        logger.write('Event:')
        logger.write(event)

        res.status(403).send('Unknown/unsupported event')
        return false
      }
    })
  })

  res.status(200).send('Success')
  return true
})

/**
 *  Handles all messages received.
 *
 *    @param {object} event    Event object sent by Facebook
 *    @return void
 */
async function receivedMessage (event) {
  const senderID = event.sender.id
  const message = event.message
  let text = ''

  if (message.text && typeof message.text === 'string') {
    text = message.text.trim().toLowerCase()
  }

  if (message.attachments) {
    await send(senderID, 'We don\'t currently support handling attachments')
    return
  }

  if (DEBUG) console.log(`Message was received with text: ${text}`)
  await send(senderID, null, 'mark_seen')
  await send(senderID, null, 'typing_on')

  const response = await dictionary.getDef(text)
  await send(senderID, response)
}

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

module.exports = { app, server }
