const HyperswarmUniversalChat = require('./')

const chat = new HyperswarmUniversalChat()

const url = new URL(window.location.href)
let channelName = url.searchParams.get('channel')

if(!channelName) {
  channelName = prompt('Enter a channel name, or default to global') || 'global'
  url.searchParams.set('channel', channelName)
  window.location.href = url.href
}

const channel = chat.channel(channelName)

const output = $('#output')
const input = $('#input')
const inputform = $('#inputform')

console.log('* Connecting to channel', channelName)

let peerCount = 0

channel.on('peer', (peer) => {
  const id = peerCount++
  log('* connected peer',id)
  peer.once('disconnected', () => {
    log('* disconnected peer',id)
  })
})

channel.on('message', (peer, {message}) => {
  log('<', message)
})

inputform.addEventListener('submit', (e) => {
  e.preventDefault()
  const message = input.value
  input.value = ''
  channel.send(message)
  log('>', message)
})

function log(...messages) {
  console.log(...messages)
  output.innerText += messages.join(' ') + '\n'
}

function $(selector) {
  return document.querySelector(selector)
}
