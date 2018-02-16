'use strict'

const {EventEmitter} = require('events')

module.exports = ({emitter, init, changes}) => {
  if (!(emitter instanceof EventEmitter)) {
    emitter = new EventEmitter()
  }

  let found = false,
      state = init

  emitter.on('registerChange', (change) => {
    emitter.on(change.name, () => {
      setImmediate(() => {
        if (state === change.from) {
          state = change.to
          return
        }
        const err = new Error(`expected state "${state}", got "${change.from}"`)
        emitter.emit('error', err)
      })
    })
  })

  changes.forEach((change) => {
    if (emitter.eventNames().includes(change.name)) {
      throw new Error(`change "${change.name}" already registered`)
    }
    emitter.emit('registerChange', change)
    if (!found && (init === change.from || init === change.to)) {
      found = true
    }
  })

  if (!found) {
    throw new Error(`unexpected initial state: "${init}"`)
  }

  emitter.on('addChange', ({name, from, to}) => {
    setImmediate(() => {
      if (emitter.eventNames().includes(name)) {
        const err = new Error(`change "${name}" already registered`)
        return emitter.emit('error', err)
      }
      emitter.emit('registerChange', {
        'name': name, 
        'from': from, 
        'to': to
      })
    })
  })

  emitter.on('removeChange', (name) => {
    setImmediate(() => {
      if (emitter.eventNames().includes(name)) {
        return emitter.removeAllListeners(name)
      }
      const err = new Error(`unexpected change: "${name}"`)
      emitter.emit('error', err)
    })
  })

  emitter.on('getState', () => {
    setImmediate(() => {
      emitter.emit('gotState', state)
    })
  })

  emitter.on('getChanges', () => {
    setImmediate(() => {
      emitter.emit('gotChanges', emitter.eventNames())
    })
  })

  return emitter
}