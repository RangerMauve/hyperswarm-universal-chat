const HyperswarmUniversalChat = require('./')

const chat1 = new HyperswarmUniversalChat()
const chat2 = new HyperswarmUniversalChat()

const CHANNEL_NAME = `EXAMPLE`

console.log('Connecting to channel', CHANNEL_NAME)

const channel1 = chat1.channel(CHANNEL_NAME)
const channel2 = chat2.channel(CHANNEL_NAME)

channel1.on('peer', () => {
  console.log('Chat1 saw peer')
  channel1.send("Hey, I'm chat1")
})
channel2.on('peer', () => {
  console.log('Chat2 saw')
  channel1.send("Hey, I'm chat2")
})

channel1.on('message', (peer, {message}) => {
  console.log(`chat1: ${message}`)
})
channel2.on('message', (peer, {message}) => {
  console.log(`chat2: ${message}`)
})
