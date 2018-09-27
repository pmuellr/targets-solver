'use strict'

exports.createTarget = createTarget
exports.createArrow = createArrow
exports.MAX_TARGET_DIRECTION = 7 // 0 .. 7

function createTarget () { return new Target() }
function createArrow () { return new Arrow() }

const IsTTY = !!process.stdout.isTTY

// base piece functionality
class Piece {
  constructor () {
    this._x = null
    this._y = null
    this._location = null
  }

  get isTarget () { return false }
  get isArrow () { return false }

  get x () { return this._x }
  get y () { return this._y }

  clone () { return new Error('subclass responsibility') }

  setLocation (x, y) {
    if (x == null || y == null) {
      this._location = null
      return
    }

    this._x = x
    this._y = y
    this._location = `${x},${y}`
  }

  getLocation () {
    return this._location
  }
}

// target pieces
class Target extends Piece {
  get isTarget () { return true }
  toString () { return IsTTY ? '🎯' : 'O' }

  clone () {
    const clone = new Target()

    clone.setLocation(this.getLocation())

    return clone
  }
}

// arrow pieces
class Arrow extends Piece {
  constructor () {
    super()
    this._direction = 1
  }

  get isArrow () { return true }
  toString () { return TargetStrings[this._direction] }

  get direction () { return this._direction }

  set direction (value) {
    if (typeof value !== 'number') throw new Error(`invalid direction: ${value}`)
    if (value < 1) throw new Error(`invalid direction: ${value}`)
    if (value > 8) throw new Error(`invalid direction: ${value}`)

    this._direction = value
  }

  get directionSteps () {
    return TargetDirections[this._direction]
  }

  // return the legal target in the specified direction
  targetInDirection (board, direction) {
    let x = this.x
    let y = this.y

    while (true) {
      x += TargetDirections[direction].x
      y += TargetDirections[direction].y

      if (x < 1 || y < 1 || x > board.cols || y > board.rows) return

      const piece = board.getPiece(x, y)
      if (piece == null) continue
      if (piece.isTarget) return piece
      if (piece.isArrow) return
    }
  }

  clone () {
    const clone = new Arrow()

    clone.setLocation(this.getLocation())
    clone.direction = this.direction

    return clone
  }
}

const TargetStrings = [
  null,
  IsTTY ? '⬆️' : '|',
  IsTTY ? '↗️' : '/',
  IsTTY ? '➡️' : '-',
  IsTTY ? '↘️' : '\\',
  IsTTY ? '⬇️' : '|',
  IsTTY ? '↙️' : '/',
  IsTTY ? '⬅️' : '-',
  IsTTY ? '↖️' : '\\'
]

const TargetDirections = [
  null,
  { x: 0, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: -1, y: -1 }
]
