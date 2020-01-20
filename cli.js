const readline = require('readline')
const argv = require('minimist')(process.argv.slice(2));

const HyperswarmUniversalChat = require('./')

const chat = new HyperswarmUniversalChat()

const channelName = argv.channel || 'global'

const channel = chat.channel(channelName)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
})

console.log('* Connecting to channel', channelName)

let peerCount = 0

channel.on('peer', (peer) => {
  const id = peerCount++
  console.log('* connected peer',id)
  peer.once('disconnected', () => {
    console.log('* disconnected peer',id)
  })
})

rl.on('line', (message) => {
  channel.send(message)
})

channel.on('message', (peer, {message}) => {
  console.log('<', message)
})
