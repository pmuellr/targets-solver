'use strict'

exports.solve = solve

const utils = require('./utils')
const Board = require('./board')
const Pieces = require('./pieces')

// Let's break this into two separate problems:
//
// - calculate all the possible boards that have arrows placed
//   that satisfy the row and column sum constraints
//
// - for each board, see if the arrows can be aimed to satisfy
//   the arrow/target constraints
//
// Having these separate lets us do things like calculate
// board-specific optimizations that would be difficult if
// if we did both at the same time.

function solve ({ rowSums, colSums, targets }) {
  validate({ rowSums, colSums, targets })

  const rows = rowSums.length
  const cols = colSums.length

  // create the initial board
  const targetBoard = Board.create(rows, cols, rowSums, colSums)

  // add the targets
  for (let target of targets) {
    targetBoard.setPiece(target.x, target.y, Pieces.createTarget())
  }

  // print it
  utils.printSection('target board')
  targetBoard.print()

  // create the array of arrows
  const arrows = []
  for (let i = 0; i <= targets.length; i++) {
    arrows.push(Pieces.createArrow())
  }

  utils.printSection('creating arrow board possibilities')
  const timerArrowBoards = utils.timer()
  const arrowBoards = createArrowBoards(targetBoard, targets.length)

  utils.printSection(`arrow board possibilities: ${arrowBoards.length}; ${timerArrowBoards().toLocaleString()} ms`)

  let count
  if (utils.DEBUG) {
    count = 0
    for (let arrowBoard of arrowBoards) {
      console.log(`board ${utils.leftPad(count, 4)}: signature: ${arrowBoard.signature}`)
      console.log('')
      arrowBoard.print()
      count++
    }
  }

  utils.printSection(`checking board arrows`)
  console.log('')

  let solvedBoard

  count = 0
  for (let arrowBoard of arrowBoards) {
    count++

    const timerCheckBoards = utils.timer()
    solvedBoard = checkBoardArrows(arrowBoard)
    console.log(`board: ${count}: ${timerCheckBoards()} ms`)

    if (solvedBoard != null) break
  }

  utils.printSection(`final answer ...`)

  if (solvedBoard == null) {
    console.log('no solution!')
  } else {
    solvedBoard.print()
  }
}

// create arrow boards recursively
function createArrowBoards (board, arrows, lastX, lastY, arrowBoards) {
  debugLog(`createArrowBoards: arrows: ${arrows}; lastXY: ${lastX},${lastY}`)

  // initialize the result, if not passed in (only the first time!)
  if (arrowBoards == null) arrowBoards = []

  // stop recursing, we found one!
  if (arrows === 0) {
    debugLog(`  arrows: ${arrows}; solved!`)
    arrowBoards.push(board.clone())
    return arrowBoards
  }

  // get the next arrow
  const arrow = Pieces.createArrow()

  // for (let { x, y } of board.emptyCellsFrom(lastX, lastY)) {
  while (true) {
    const locationNextEmpty = board.nextEmptyCellFrom(lastX, lastY)
    if (locationNextEmpty == null) {
      debugLog(`  arrows: ${arrows}; no where to put an arrow!`)
      return arrowBoards
    }

    let { x, y } = locationNextEmpty

    // try adding it at the next possible location
    debugLog(`  arrows: ${arrows}; ${x},${y} finding next arrow location`)
    const location = addNextArrow(board, arrow, x, y)

    // if we can't add it, failure!
    if (location == null) {
      debugLog(`  arrows: ${arrows}; no where to put an arrow!`)
      return arrowBoards
    }

    debugLog(`  arrows: ${arrows}; ${location.x},${location.y} new arrow location: =>`)
    if (utils.DEBUG) board.print()
    debugLog('')

    // if we can add it, recurse!
    arrowBoards = createArrowBoards(board, arrows - 1, location.x, location.y, arrowBoards)

    // we're going to move the arrow on the next iteration of the loop,
    // so remove it from board
    board.removePiece(location.x, location.y)

    lastX = location.x
    lastY = location.y
  }
}

// check to see if the board's arrows can be pointed successfully
function checkBoardArrows (board) {
  setLegalArrowDirections(board)
  return tryArrows(board, board.arrows)
}

// cycle through all combination of legal arrow directions looking for solution
function tryArrows (board, arrows) {
  // all arrows have been set, check to see if all targets hit
  if (arrows.length === 0) {
    return checkAllTargetsHit(board)
  }

  const arrow = arrows.shift()

  for (let legalDirection of arrow.legalDirections) {
    arrow.direction = legalDirection.direction
    const solvedBoard = tryArrows(board, arrows)
    if (solvedBoard != null) return solvedBoard
  }

  arrows.unshift(arrow)
}

// try the combination of arrows with directions to see if all targets hit
function checkAllTargetsHit (board) {
  const targets = new Set(board.targets)

  for (let arrow of board.arrows) {
    const target = arrow.legalDirections
      .filter(ld => ld.direction === arrow.direction)
      .map(ld => ld.target)[0]

    targets.delete(target)
  }

  if (targets.size === 0) return board
}

// Find all possible legal arrow directions for a board,
// directions in which can hit a target.
// Add that array of directions to the arrow as `legalDirections`
function setLegalArrowDirections (board) {
  for (let arrow of board.arrows) {
    arrow.legalDirections = getLegalArrowDirectionsForArrow(board, arrow)
    debugLog(`  arrow: ${arrow.getLocation()} => ${arrow.legalDirections.map(ld => ld.direction).join(' ')}`)
  }
}

// find the legal arrow directions for a single arrow for a board
function getLegalArrowDirectionsForArrow (board, arrow) {
  const legalDirections = []

  for (let direction = 1; direction <= 8; direction++) {
    const target = arrow.targetInDirection(board, direction)
    if (target == null) continue
    legalDirections.push({ direction, target })
  }

  return legalDirections
}

// add an arrow at the next valid location after {lastX, lastY}
function addNextArrow (board, arrow, lastX, lastY) {
  for (let { x, y } of board.emptyCellsFrom(lastX, lastY, true)) {
    if (!board.roomForArrow(x, y)) continue

    board.setPiece(x, y, arrow)
    return { x, y }
  }

  return null
}

// validate input, throwing error if something is wrong
function validate ({ rowSums, colSums, targets }) {
  const rowTotal = arraySum(rowSums)
  const colTotal = arraySum(colSums)

  if (rowTotal !== colTotal) {
    throw new Error(`row total ${rowTotal} not equal to col total ${colTotal}`)
  }

  if (targets.length !== rowTotal) {
    throw new Error(`row total ${rowTotal} not equal to number of targets ${targets.length}`)
  }

  for (let target of targets) {
    if (target.x > colSums.length || target.x < 0) {
      throw new Error(`target (${target.x}, ${target.y}) has invalid x value`)
    }
    if (target.y > rowSums.length || target.y < 0) {
      throw new Error(`target (${target.x}, ${target.y}) has invalid y value`)
    }
  }
}

// return the sum of an array of numbers
function arraySum (numbers) {
  let sum = 0
  for (let number of numbers) sum += number
  return sum
}

// log a message - uncomment / comment to enable / disable
function debugLog (message) {
  if (!utils.DEBUG) return
  console.log(message)
}
