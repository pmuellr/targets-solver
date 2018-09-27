'use strict'

exports.timer = timer
exports.DEBUG = process.env.DEBUG != null
exports.leftPad = leftPad
exports.rightPad = rightPad
exports.parsePoint = parsePoint
exports.printSection = printSection
exports.createIterator = createIterator

const PointPattern = /^(\d+),(\d+)$/

// create a timer; returns function, which when called, returns elapsed ms
function timer () {
  const start = Date.now()

  return function stopTimer () {
    return Date.now() - start
  }
}

// uh huh
function leftPad (s, length, pad = ' ') {
  s = `${s}`
  while (s.length < length) s = `${pad}${s}`
  return s
}

// yup
function rightPad (s, length, pad = ' ') {
  s = `${s}`
  while (s.length < length) s = `${s}${pad}`
  return s
}

// parse a point string into {x, y}; eg, '3,4' =>{x: 3, y: 4}
function parsePoint (string) {
  const match = string.match(PointPattern)
  if (match == null) throw new Error(`invalid point string ${string}`)
  return { x: match[1], y: match[2] }
}

function printSection (label) {
  console.log('')
  console.log('---------------------------------------------------------------')
  console.log(label)
  console.log('---------------------------------------------------------------')
}

// create an iterator given an init and next function
function createIterator (state, nextFn) {
  class CreatedIterator {
    constructor () {
      this.state = state
    }

    [Symbol.iterator] () {
      return this
    }

    next () {
      const doneSignal = {}
      const item = nextFn(this.state, doneSignal)

      if (item === doneSignal) return { done: true }

      return {
        done: false,
        value: item
      }
    }
  }

  return new CreatedIterator()
}
