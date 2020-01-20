const EventEmitter = require('events')
const hyperswarm = require('hyperswarm')
const sodium = require('sodium-universal')
const ndjson = require('ndjson')

const { crypto_generichash, crypto_generichash_BYTES } = sodium

class HyperswarmUniversalChat extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.swarm = opts.swarm || hyperswarm(opts)
    this.channels = new Set()

    this.handleConnection = this.handleConnection.bind(this)

    this.swarm.on('connection', this.handleConnection)
  }

  handleConnection (connection, info) {
    const peer = new Peer(connection, info)
    this.emit('peer', peer)
  }

  channel (name) {
    const key = Buffer.alloc(crypto_generichash_BYTES)

    crypto_generichash(key, Buffer.from(name))

    const keyString = key.toString('hex')

    const channel = new Channel(this, keyString, name)

    this.swarm.join(key, {
      announce: true,
      lookup: true
    })

    this.emit('channel', channel)

    channel.once('closed', () => {
      this.swarm.leave(key)
    })

    return channel
  }

  destroy (cb) {
    this.swarm.removeListener('connection', this.handleConnection)
    this.swarm.destroy(cb)
    this.emit('destroyed')
  }
}

module.exports = HyperswarmUniversalChat

class Channel extends EventEmitter {
  constructor (chat, key, name) {
    super()

    this.name = name
    this.key = key
    this.chat = chat
    this.peers = new Set()

    this.handlePeer = this.handlePeer.bind(this)

    this.chat.on('peer', this.handlePeer)
  }

  handlePeer (peer) {
    peer.once('channel', (channel) => {
      if (channel === this.key) {
        this.addPeer(peer)
      }
    })
  }

  addPeer (peer) {
    this.peers.add(peer)
    this.emit('peer', peer)

    peer.once('disconnected', () => {
      this.peers.delete(peer)
      this.emit('peer-disconnected', peer)
    })
    peer.on('message', (data) => {
      this.emit('message', peer, data)
    })
  }

  send (message) {
    this.broadcast({
      type: 'message',
      message
    })
  }

  broadcast (data) {
    for (const peer of this.peers) {
      peer.send(data)
    }
  }

  close () {
    this.chat.removeListener('peer', this.handlePeer)

    for (const peer of this.peers) {
      peer.destroy()
    }

    this.emit('closed')

    this.chat = null
  }
}

class Peer extends EventEmitter {
  constructor (connection, info) {
    super()

    const peer = info.peer

    this.connection = connection
    this.incoming = ndjson.parse()
    this.outgoing = ndjson.stringify()

    connection.pipe(this.incoming)
    this.outgoing.pipe(connection)

    this.incoming.on('data', (data) => {
      this.emit('data', data)
      const { type } = data

      this.emit(type, data)
    })

    this.connection.on('error', (e) => {
      this.emit('connection-error', e)
    })

    this.connection.once('close', () => {
      this.emit('disconnected')
    })

    if (peer && peer.topic) {
      const channel = peer.topic.toString('hex')
      this.send({
        type: 'handshake',
        channel
      })
      setTimeout(() => {
        this.emit('channel', channel)
      }, 0)
    } else {
      this.once('handshake', ({ channel }) => {
        this.send({
          type: 'handshake',
          channel
        })
        this.emit('channel', channel)
      })
    }
  }

  send (data) {
    this.outgoing.write(data)
  }

  destroy () {
    this.connection.end()
  }
}
