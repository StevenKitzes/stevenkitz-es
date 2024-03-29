let DEBUG = true

const log = (msg) => {
  if (DEBUG) console.log(msg)
}
const error = (msg) => {
  console.log(`ERROR: ${msg}`)
}

// start and end both inclusive
const randInt = (start, end) => {
  const span = end - start + 1
  return Math.floor(Math.random() * span) + start
}
const coinToss = () => {
  return randInt(0, 1) ? true : false
}

function Box(red, green, blue, bloom, spanId) {
  this.red = red
  this.green = green
  this.blue = blue
  this.bloom = bloom
  this.spanId = spanId
  this.originColor = null
}

// set up DOM with boxes
const initBoxes = (boxSize, displayElement, boxData, boxDataStage) => {
  const displayWidth = displayElement.clientWidth
  const displayHeight = displayElement.clientHeight

  const height = Math.ceil(displayHeight / boxSize)
  const width = Math.ceil(displayWidth / boxSize)

  for (let row = 0; row < height; row++) {
    boxData.push([])
    boxDataStage.push([])
    for (let col = 0; col < width; col++) {
      const span = document.createElement('span')
      const red = 0
      const green = 0
      const blue = 0
      const bloom = 0
      const spanId = `box-${displayElement.id}-${row}-${col}`
      boxData[row].push(new Box(red, green, blue, bloom, spanId))
      boxDataStage[row].push(new Box(red, green, blue, bloom, spanId))

      span.id = spanId
      span.style.backgroundColor = `rgb(${red}, ${green}, ${blue})`
      span.style.height = `${boxSize}px`
      span.style.left = `${col * boxSize}px`
      span.style.position = 'absolute'
      span.style.top = `${row * boxSize}px`
      span.style.width = `${boxSize}px`
      displayElement.appendChild(span)
    }
  }
}

const enforceColorBoundsOnBox = (box) => {
  if (box.red < 0) box.red = 0
  if (box.green < 0) box.green = 0
  if (box.blue < 0) box.blue = 0
  if (box.red > 100) box.red = 100
  if (box.green > 100) box.green = 100
  if (box.blue > 100) box.blue = 100
}

const colorDrift = (factor) => {
  return randInt(-factor, factor)
}

// returns ref to its interval to be canceled if a new loop is started
const startLoop = (bloomDecayMax, bloomFactor, bloomInitial, bloomOdds, bloomSpreadOdds, boxData, boxDataStage, colorDriftFactor, frameDelay) => {
  return setInterval(() => {
    // general strategy: READ from boxData to WRITE to boxDatastage
    // fuss around and customize values in boxDataStage, maintaining frame-wise original,
    // pristine state in boxData; when done, write colors from boxDateStage to DOM, as well
    // as back to boxData

    // for each box:
    // if i have bloom:
    //   average me with self and other bloom neighbors ONLY for those neighbors with higher bloom count than mine
    //   reduce my remaining bloom count
    // if i don't have bloom:
    //   average me with all neighbors
    //   weight the average toward boxes with bloom
    //   chance of catching some amount of bloom and becoming a bloom box

    // step: populate stage data from boxData
    boxData.forEach((row, r) => {
      row.forEach((currentBox, c) => {
        boxDataStage[r][c].red = currentBox.red
        boxDataStage[r][c].green = currentBox.green
        boxDataStage[r][c].blue = currentBox.blue
      })
    })

    // step: seed new blooms
    if (randInt(0, bloomOdds) === 0) {
      const x = randInt(0, boxDataStage[0].length - 1)
      const y = randInt(0, boxDataStage.length - 1)
      boxDataStage[y][x].red = randInt(0, 255)
      boxDataStage[y][x].green = randInt(0, 255)
      boxDataStage[y][x].blue = randInt(0, 255)
      boxDataStage[y][x].bloom = bloomInitial
      boxDataStage[y][x].originColor = {
        red: boxDataStage[y][x].red,
        green: boxDataStage[y][x].green,
        blue: boxDataStage[y][x].blue,
      }
    }
    
    // step: apply bloom/averaging rules
    boxDataStage.forEach((row, r) => {
      row.forEach((box, c) => {
        // If current has bloom, avg w self's origin and other higher bloom neightbors and reduce bloom
        if (box.bloom > 0) {
          if (DEBUG) document.getElementById(box.spanId).innerHTML = 'B'
          const avg = {
            red: box.originColor.red,
            green: box.originColor.green,
            blue: box.originColor.blue,
            count: 1
          }
          if (c > 0 && boxData[r][c-1].bloom >= box.bloom) {
            const other = boxData[r][c-1]
            avg.red += other.red
            avg.green += other.green
            avg.blue += other.blue
            avg.count++
          }
          if (c < row.length - 1 && boxData[r][c+1].bloom >= box.bloom) {
            const other = boxData[r][c+1]
            avg.red += other.red
            avg.green += other.green
            avg.blue += other.blue
            avg.count++
          }
          if (r > 0 && boxData[r-1][c].bloom >= box.bloom) {
            const other = boxData[r-1][c]
            avg.red += other.red
            avg.green += other.green
            avg.blue += other.blue
            avg.count++
          }
          if (r < boxDataStage.length - 1 && boxData[r+1][c].bloom >= box.bloom) {
            const other = boxData[r+1][c]
            avg.red += other.red
            avg.green += other.green
            avg.blue += other.blue
            avg.count++
          }
          box.red = avg.red / avg.count
          box.green = avg.green / avg.count
          box.blue = avg.blue / avg.count
          box.bloom--
          if (box.bloom < 1) {
            box.originColor = null
          }
        }
        // If box lacks bloom, avg w all neighbors; weight bloom neighbors; maybe catch their bloom
        else if (box.bloom < 1) {
          if (DEBUG) document.getElementById(box.spanId).innerHTML = ''
          const avg = {
            red: box.red,
            green: box.green,
            blue: box.blue,
            count: 1
          }
          let maxNeighborBloom = 0
          let newOrigin = null
          if (c > 0) {
            const other = boxData[r][c-1]
            avg.red += other.red * (other.bloom > 0 ? bloomFactor : 1)
            avg.green += other.green * (other.bloom > 0 ? bloomFactor : 1)
            avg.blue += other.blue * (other.bloom > 0 ? bloomFactor : 1)
            avg.count += (other.bloom > 0 ? bloomFactor : 1)
            if (other.bloom - bloomDecayMax > maxNeighborBloom) {
              maxNeighborBloom = other.bloom
              newOrigin = other.originColor
            }
          }
          if (c < row.length - 1) {
            const other = boxData[r][c+1]
            avg.red += other.red * (other.bloom > 0 ? bloomFactor : 1)
            avg.green += other.green * (other.bloom > 0 ? bloomFactor : 1)
            avg.blue += other.blue * (other.bloom > 0 ? bloomFactor : 1)
            avg.count += (other.bloom > 0 ? bloomFactor : 1)
            if (other.bloom - bloomDecayMax > maxNeighborBloom) {
              maxNeighborBloom = other.bloom
              newOrigin = other.originColor
            }
          }
          if (r > 0) {
            const other = boxData[r-1][c]
            avg.red += other.red * (other.bloom > 0 ? bloomFactor : 1)
            avg.green += other.green * (other.bloom > 0 ? bloomFactor : 1)
            avg.blue += other.blue * (other.bloom > 0 ? bloomFactor : 1)
            avg.count += (other.bloom > 0 ? bloomFactor : 1)
            if (other.bloom - bloomDecayMax > maxNeighborBloom) {
              maxNeighborBloom = other.bloom
              newOrigin = other.originColor
            }
          }
          if (r < boxDataStage.length - 1) {
            const other = boxData[r+1][c]
            avg.red += other.red * (other.bloom > 0 ? bloomFactor : 1)
            avg.green += other.green * (other.bloom > 0 ? bloomFactor : 1)
            avg.blue += other.blue * (other.bloom > 0 ? bloomFactor : 1)
            avg.count += (other.bloom > 0 ? bloomFactor : 1)
            if (other.bloom - bloomDecayMax > maxNeighborBloom) {
              maxNeighborBloom = other.bloom
              newOrigin = other.originColor
            }
          }
          box.red = avg.red / avg.count
          box.green = avg.green / avg.count
          box.blue = avg.blue / avg.count
          if (randInt(0, bloomSpreadOdds) === 0) {
            box.bloom = Math.max(maxNeighborBloom - randInt(1, bloomDecayMax), 0)
            if (box.bloom > 0) box.originColor = newOrigin
          }
        }
      })
    })
    
    // step: apply drift
    boxDataStage.forEach(row => {
      row.forEach(box => {
        box.red += colorDrift(colorDriftFactor)
        box.green += colorDrift(colorDriftFactor)
        box.blue += colorDrift(colorDriftFactor)
      })
    })

    // step: enforce bounds on stage before writing to boxData and DOM
    boxDataStage.forEach(row => {
      row.forEach(box => enforceColorBoundsOnBox(box))
    })

    // step: write fussed stage to DOM and boxData
    boxDataStage.forEach((row, r) => {
      row.forEach((currentBox, c) => {
        document.getElementById(currentBox.spanId).style.backgroundColor =
          `rgb(${currentBox.red}, ${currentBox.green}, ${currentBox.blue})`
        boxData[r][c].red = currentBox.red
        boxData[r][c].green = currentBox.green
        boxData[r][c].blue = currentBox.blue
        boxData[r][c].bloom = currentBox.bloom
        boxData[r][c].originColor = currentBox.originColor
        })
    })
  }, frameDelay)
}

// returns ref to its interval for cancelation in case of a new loop start
const colorClouds = (args = {}) => {
  const bloomDecayMax = args.bloomDecayMax || 5
  const bloomFactor = args.bloomFactor || 3
  const bloomInitial = args.bloomInitial || 200
  const bloomOdds = args.bloomOdds || 100
  const bloomSpreadOdds = args.bloomSpreadOdds || 20
  const boxSize = args.boxSize || 20
  const colorDriftFactor = args.colorDriftFactor || 5
  const elementId = args.elementId || 'color-clouds'
  const frameDelay = args.frameDelay || 100
  DEBUG = args.debug || false

  const displayElement = document.getElementById(elementId)
  if (!displayElement) {
    return error(`unable to find DOM element with the provided id: ${elementId}`)
  }

  if (window.getComputedStyle(displayElement).position !== 'relative') {
    displayElement.style.backgroundColor = 'black'
    displayElement.style.color = 'white'
    displayElement.innerHTML = 'Sorry, color clouds cannot render in this element!'
    return error(`this feature only available for use with DOM elements with the 'relative' position style`)
  }

  // clean target element's content
  displayElement.innerHTML = ""

  const boxData = []
  const boxDataStage = []

  initBoxes(boxSize, displayElement, boxData, boxDataStage)

  // return ref to the loop interval from setInterval
  return startLoop(bloomDecayMax, bloomFactor, bloomInitial, bloomOdds, bloomSpreadOdds, boxData, boxDataStage, colorDriftFactor, frameDelay)
}

if(document.readyState === 'complete') {
  colorClouds({ bloomOdds: 10, boxSize: 10 })
} else {
  window.addEventListener('load', () => {
    colorClouds({ bloomOdds: 10, boxSize: 10 })
  })  
}
