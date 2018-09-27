#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')

const targetsSolver = require('../lib/targets-solver')

const args = process.argv.slice(2)

const { rowSums, colSums, targets } = parseArgs(args)

function solve () {
  targetsSolver.solve({ rowSums, colSums, targets })
}

setImmediate(solve)

// parse arguments
function parseArgs (args) {
  if (args.length === 0) help()

  const rowSums = []
  const colSums = []
  const targets = []

  let reading = ''

  while (args.length > 0) {
    const arg = args.shift()

    if (arg === 'r:') {
      reading = 'rows'
      continue
    }

    if (arg === 'c:') {
      reading = 'cols'
      continue
    }

    if (arg === 't:') {
      reading = 'targets'
      continue
    }

    if (reading === '') help()

    if (reading === 'rows') {
      rowSums.push(parseNumber(arg))
      continue
    }

    if (reading === 'cols') {
      colSums.push(parseNumber(arg))
      continue
    }

    if (reading === 'targets') {
      targets.push(parsePoint(arg))
      continue
    }
  }

  return { rowSums, colSums, targets }
}

// parse a string into a number
function parseNumber (string) {
  string = string.trim()
  const number = parseInt(string, 10)

  if (isNaN(number)) {
    console.log(`invalid number: ${string}`)
    process.exit(1)
  }

  return number
}

// parse a string into a point
function parsePoint (string) {
  string = string.trim()
  const pattern = /^(\d+),(\d+)$/
  const match = string.match(pattern)

  if (match == null) {
    console.log(`invalid target position ${string}`)
    process.exit(1)
  }

  const x = parseNumber(match[1])
  const y = parseNumber(match[2])

  return { x, y }
}

function help () {
  const readmeName = path.join(__dirname, '..', 'README.md')
  const readme = fs.readFileSync(readmeName, 'utf8')
  console.log(readme)
  process.exit(1)
}
