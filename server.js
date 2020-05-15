
const express = require('express')
const crypto = require('crypto')

const request = require('./src/utils/request.js')
const getProof = require('./src/utils/proof.js')
const dictionary = require('./src/dictionary.js')

const app = express()

const FB_ENDPOINT = 'https://graph.facebook.com/v7.0/me'

const ACCESS_TOKEN = process.env.ACCESS_TOKEN
const VALIDATION_TOKEN = process.env.VALIDATION_TOKEN
const APP_SECRET = process.env.APP_SECRET

const PORT = process.env.PORT || 8080
const DEBUG = process.env.DEBUG || false

if (!ACCESS_TOKEN || !VALIDATION_TOKEN || !APP_SECRET) {
  throw new Error('Access, App Secret and/or validation token was not defined')
}

app.use(express.json({
  verify: (req, res, buf) => {
    const signature = req.get('x-hub-signature')
    if (!signature) throw new Error('No signature')

    const elements = signature.split('=')
    const method = elements[0]
    const hash = elements[1]
    const expected = crypto.createHmac(method, APP_SECRET)
      .update(buf)
      .digest('hex')

    if (hash !== expected) throw new Error('Invalid signature')
  }
}))

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const verifyToken = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && verifyToken === VALIDATION_TOKEN) {
    res.status(200).send(challenge)
    return true
  } else {
    res.status(403).send('Verification token does not match!')
    return false
  }
})

app.post('/webhook', (req, res) => {
  const data = req.body
  if (data.object !== 'page') {
    console.error('Object is not a page: ')
    console.error(data)
    res.status(403).send('Object is not a page')
    return false
  }

  data.entry.forEach(entry => {
    entry.messaging.forEach(event => {
      if (DEBUG) {
        console.log('A new event was received: ')
        console.log(event)
      }

      handleEvent(event)
    })
  })

  res.status(200).send('Success')
  return true
})

/**
 *  Handles all events that are received through webhook. All received events
 *  are executed asynchronously.
 *
 *    @param {object} event    Event object sent by Facebook
 *    @return void
 */
function handleEvent (event) {
  if (event.message) {
    receivedMessage(event)
  } else {
    console.error('Unknown/unsupported event:')
    console.error(event)
  }
}

/**
 *  Handles all messages received.
 *
 *    @param {object} event    Event object sent by Facebook
 *    @return void
 */
async function receivedMessage (event) {
  const senderID = event.sender.id
  const message = event.message
  const text = message.text

  if (DEBUG) console.log(`Message was received with text: ${text}`)
  await sendTyping(senderID)

  const response = await dictionary.getDef(text)
  await sendMessage(senderID, response)
}

/**
 *  Sends a message to user by calling Messenger's Send API.
 *
 *    @param {string} psid    User's page-scoped ID
 *    @param {string} text    The message to send
 *    @return void
 */
async function sendMessage (psid, text) {
  const params = new URLSearchParams()
  params.set('access_token', ACCESS_TOKEN)
  params.set('appsecret_proof', getProof())

  const url = `${FB_ENDPOINT}/messages?${params.toString()}`
  const data = {
    messaging_type: 'RESPONSE',
    recipient: { id: psid },
    message: { text }
  }

  if (DEBUG) console.log(`Sending user "${psid}": ${text}`)
  await request('POST', url, {}, data)
}

/**
 *  Sends user a typing on indicator.
 *
 *    @param {string} psid    User's page-scoped ID
 */
async function sendTyping (psid) {
  const params = new URLSearchParams()
  params.set('access_token', ACCESS_TOKEN)
  params.set('appsecret_proof', getProof())
  const url = `${FB_ENDPOINT}/messages?${params.toString()}`
  const data = {
    messaging_type: 'RESPONSE',
    recipient: { id: psid },
    sender_action: 'typing_on'
  }

  if (DEBUG) { console.debug('Sending user typing on action') }
  await request('POST', url, {}, data)
}

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

module.exports = { app, server }
