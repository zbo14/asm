'use strict'

const {expect} = require('chai')
const {describe, it} = require('mocha')
const newStateMachine = require('../src')
const {EventEmitter} = require('events')

const go = {
  'name': 'go',
  'from': 'red', 
  'to': 'green'
}

const slow = {
  'name': 'slow',
  'from': 'green', 
  'to': 'yellow'
}

const stop = {
  'name': 'stop',
  'from': 'yellow',
  'to': 'red'
}

const sm = newStateMachine({
  'init': 'red',
  'changes': [
    go, 
    slow, 
    stop
  ]
})

const withDifferentEmitters = () => {
  it('creates state machines with different emitters', () => {
    const sm1 = newStateMachine({
      'emitter': new EventEmitter(),
      'init': 'red',
      'changes': [
        go, 
        slow, 
        stop
      ]
    })
    const sm2 = newStateMachine({
      'emitter': 'notAnEventEmitter',
      'init': 'red',
      'changes': [
        go, 
        slow, 
        stop
      ]
    })
    expect(sm1 instanceof EventEmitter).to.be.true 
    expect(sm2 instanceof EventEmitter).to.be.true 
  })
}

const unexpectedInitState = () => {
  it('creates state machine with unexpected initial state', (done) => {
    try {
      newStateMachine({
        'init': 'blue',
        'changes': [
          go, 
          slow, 
          stop
        ]
      })
    } catch (err) {
      expect(err).to.be.an('error')
      done()
    }
  })
}

const changeAlreadyRegistered = () => {
  it('tries to create state machine with change already registered', (done) => {
    try {
      newStateMachine({
        'init': 'red',
        'changes': [
          go, 
          slow, 
          stop, 
          go
        ]
      })
    } catch (err) {
      expect(err).to.be.an('error')
      done()
    }
  })
}

const changeSuccess = (change) => {
  it(`does ${change.name}`, (done) => {
    sm.once('gotState', (state1) => {
      expect(state1).to.equal(change.from)
      sm.emit(change.name)
      sm.once('gotState', (state2) => {
        expect(state2).to.equal(change.to)
        done()
      })
      sm.emit('getState')
    })
    sm.emit('getState')
  })
}

const changeFail = (change) => {
  it(`fails to ${change.name}`, (done) => {
    sm.once('gotState', (state) => {
      expect(state).to.not.equal(change.from)
      sm.once('error', (err) => {
        expect(err).to.be.an('error')
        expect(err.message).to.include('expected state')
        done()
      })
      sm.emit(change.name)
    })
    sm.emit('getState')
  })
}

const removeChangeSuccess = (change) => {
  it(`removes ${change.name}`, (done) => {
    sm.once('gotChanges', (changes1) => {
      expect(changes1).to.include(change.name)
      sm.emit('removeChange', change.name)
      sm.once('gotChanges', (changes2) => {
        expect(changes2).to.not.include(change.name)
        done()
      })
      sm.emit('getChanges')
    })
    sm.emit('getChanges')
  })
}

const removeChangeFail = (change) => {
  it(`fails to remove ${change.name}`, (done) => {
    sm.once('gotChanges', (changes) => {
      expect(changes).to.not.include(change.name)
      sm.emit('removeChange', change.name)
      sm.once('error', (err) => {
        expect(err).to.be.an('error')
        expect(err.message).to.include('unexpected change')
        done()
      })
      sm.emit('getChanges')
    })
    sm.emit('getChanges')
  })
}

const addChangeSuccess = (change) => {
  it(`adds ${change.name}`, (done) => {
    sm.once('gotChanges', (changes1) => {
      expect(changes1).to.not.include(change.name)
      sm.once('registerChange', () => {
        sm.once('gotChanges', (changes2) => {
          expect(changes2).to.include(change.name)
          done()
        })
        sm.emit('getChanges')
      })
      sm.emit('addChange', change)
    })
    sm.emit('getChanges')
  })
}

const addChangeFail = (change) => {
  it(`fails to add ${change.name}`, (done) => {
    sm.once('gotChanges', (changes) => {
      expect(changes).to.include(change.name)
      sm.emit('addChange', change)
      sm.once('error', (err) => {
        expect(err).to.be.an('error')
        done()
      })
      sm.emit('getChanges')
    })
    sm.emit('getChanges')
  })
}

describe('asm', () => {
  changeFail(slow)
  changeFail(stop)
  changeSuccess(go)
  changeFail(go)
  changeFail(stop)
  changeSuccess(slow)
  changeFail(go)
  changeFail(slow)
  changeSuccess(stop)
  changeFail(slow)
  changeFail(stop)
  removeChangeSuccess(go)
  removeChangeFail(go)
  removeChangeSuccess(slow)
  removeChangeFail(slow)
  removeChangeSuccess(stop)
  removeChangeFail(stop)
  addChangeSuccess(go)
  addChangeFail(go)
  addChangeSuccess(slow)
  addChangeFail(slow)
  addChangeSuccess(stop)
  addChangeFail(stop)
  unexpectedInitState()
  changeAlreadyRegistered()
  withDifferentEmitters()
})