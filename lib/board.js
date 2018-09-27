'use strict'

exports.create = create

const utils = require('./utils')

// return a new board
function create (rows, cols, rowSums, colSums) {
  return new Board(rows, cols, rowSums, colSums)
}

// models the board
class Board {
  // initialize the board
  constructor (rows, cols, rowSums, colSums) {
    // as a little hack, we'll prepend a null to the sums arrays,
    // so we can 1-index them

    rowSums = rowSums.slice()
    rowSums.unshift(null)

    colSums = colSums.slice()
    colSums.unshift(null)

    this._rows = rows
    this._cols = cols
    this._rowSums = rowSums
    this._colSums = colSums
    this._pieces = new Map()
  }

  get rows () { return this._rows }
  get cols () { return this._cols }

  isEmpty (x, y) {
    return this.getPiece(x, y) == null
  }

  isArrow (x, y) {
    const piece = this.getPiece(x, y)
    if (piece == null) return false
    return piece.isArrow
  }

  isTarget (x, y) {
    const piece = this.getPiece(x, y)
    if (piece == null) return false
    return piece.isTarget
  }

  getPiece (x, y) {
    const point = `${x},${y}`
    return this._pieces.get(point)
  }

  // add a piece to the board
  setPiece (x, y, piece) {
    const point = `${x},${y}`
    this._pieces.set(point, piece)
    piece.setLocation(x, y)
  }

  // remove a piece from the board
  removePiece (x, y) {
    const piece = this.getPiece(x, y)
    if (piece == null) return

    const point = `${x},${y}`
    this._pieces.delete(point)
    piece.setLocation(null, null)
  }

  get arrows () {
    return Array.from(this._pieces.values())
      .filter(piece => piece.isArrow)
  }

  get targets () {
    return Array.from(this._pieces.values())
      .filter(piece => piece.isTarget)
  }

  // return the next cell after x,y, moving l->r, t->b; null returns first cell
  nextCellFrom (x, y) {
    if (x == null) return { x: 1, y: 1 }

    if (x < this.cols) {
      x++
      return { x, y }
    }

    x = 1
    y++

    if (y > this.rows) return null

    return { x, y }
  }

  // return the next empty cell after x,y, moving l->r, t->b; null returns first cell
  nextEmptyCellFrom (x, y) {
    while (true) {
      const location = this.nextCellFrom(x, y)
      if (location == null) return null

      x = location.x
      y = location.y

      if (this.isEmpty(x, y)) return { x, y }
    }
  }

  // iterator returning empty cells starting after x,y , moving l->r, t->b
  emptyCellsFrom (x, y, includePoint) {
    const board = this

    const state = {
      x: x,
      y: y,
      includePoint: !!includePoint,
      first: true
    }

    function next (state, done) {
      if (state.includePoint && state.first) {
        if (board.isEmpty(state.x, state.y)) {
          state.first = false
          return { x: state.x, y: state.y }
        }
      }

      state.first = false
      while (true) {
        const nextLocation = board.nextCellFrom(state.x, state.y)
        if (nextLocation == null) return done

        state.x = nextLocation.x
        state.y = nextLocation.y

        if (board.isEmpty(state.x, state.y)) {
          return { x: state.x, y: state.y }
        }
      }
    }

    return utils.createIterator(state, next)
  }

  // return whether there is room for an arrow at the location
  roomForArrow (x, y) {
    if (!this.isEmpty(x, y)) return false

    const colSum = this._colSums[x]
    const rowSum = this._rowSums[y]

    if (colSum === 0 || rowSum === 0) return false

    let arrowsInCol = 0
    let arrowsInRow = 0

    for (let ty = 1; ty <= this._rows; ty++) {
      if (this.isArrow(x, ty)) {
        arrowsInCol++
        if (arrowsInCol >= colSum) return false
      }
    }

    for (let tx = 1; tx <= this._rows; tx++) {
      if (this.isArrow(tx, y)) {
        arrowsInRow++
        if (arrowsInRow >= rowSum) return false
      }
    }

    return true
  }

  // create a board just like this one
  clone () {
    // have to fix up the sums arrays since we hacked them
    const rowSums = this._rowSums.slice()
    rowSums.shift()

    const colSums = this._colSums.slice()
    colSums.shift()

    const clone = new Board(this.rows, this.cols, rowSums, colSums)
    for (let y = 1; y <= this._rows; y++) {
      for (let x = 1; x <= this._cols; x++) {
        const piece = this.getPiece(x, y)
        if (piece == null) continue

        const clonePiece = piece.clone()
        clone.setPiece(x, y, clonePiece)
      }
    }

    return clone
  }

  // return a string which uniquely describes the arrows placed in the board
  get signature () {
    const arrows = []

    for (let y = 1; y <= this._rows; y++) {
      for (let x = 1; x <= this._cols; x++) {
        const piece = this.getPiece(x, y)
        if (piece == null) continue
        if (!piece.isArrow) continue
        arrows.push(`${piece.getLocation()};${piece.direction}`)
      }
    }

    return arrows.join('-')
  }

  // print the board
  print () {
    console.log('')

    let rowSep = ''
    for (let x = 1; x <= this._cols; x++) {
      rowSep += '┼───'
    }
    rowSep += '┼'

    console.log(rowSep)

    for (let y = 1; y <= this._rows; y++) {
      let rowLine = ''
      for (let x = 1; x <= this._cols; x++) {
        const piece = this.getPiece(x, y)
        const char = piece ? `${piece}` : ' '
        rowLine += `│ ${char} `
      }
      rowLine += `│ ${this._rowSums[y]}`
      console.log(rowLine)
      console.log(rowSep)
    }

    let colSums = ''
    for (let x = 1; x <= this._cols; x++) {
      colSums += `  ${this._colSums[x]} `
    }
    colSums += ' '

    console.log(colSums)
  }
}
