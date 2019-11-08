const DEBOUNCE_DURATION         = 1000
const DOT_COUNT                 = 50
const DOT_SIZE_MINIMUM          = 5
const DOT_SIZE_VARIANCE         = 5
const HORIZONTAL_SPEED_MINIMUM  = 4000
const HORIZONTAL_SPEED_VARIANCE = 4000
const VERTICAL_SPEED_MINIMUM    = 4000
const VERTICAL_SPEED_VARIANCE   = 4000
const CONTAINER_NAME            = 'canvas'
const OVERFLOW_FACTOR           = 3
const OVERFLOW                  = (DOT_SIZE_MINIMUM + DOT_SIZE_VARIANCE) * OVERFLOW_FACTOR

const DOT_COUNT_LIGHT           = Math.floor(DOT_COUNT / 3)

if(document.readyState === 'complete') {
  init()
} else {
  window.addEventListener('load', () => {
    init()
  })
}

let debouncer = null

let canvas, width, height

let smallScreen = false

let container = document.getElementById(CONTAINER_NAME)

function init() {
  canvas = SVG()
    .addTo('#' + CONTAINER_NAME)

  window.addEventListener('resize', () => {
    if(debouncer) return
    debouncer = setTimeout(() => {
      debouncer = null
      run()
    }, DEBOUNCE_DURATION)
  })

  run()
}

function reset() {
  width = container.clientWidth
  height = container.clientHeight

  smallScreen = height < 750 ? true : false

  canvas.size(width, height)
  canvas.clear()
}

function run() {
  if(debouncer) return
  
  console.log('(re)starting graphics!')
  
  reset()
  
  const dotSpacing = height / (smallScreen ? DOT_COUNT_LIGHT : DOT_COUNT)
  let rects = []
  let y = 0

  while(y < height) {
    const dotSize = Math.floor(Math.random() * DOT_SIZE_VARIANCE + DOT_SIZE_MINIMUM)
    let r = canvas.rect(dotSize, dotSize)
    r.y(y)
    rects.push(r)
    y += dotSpacing
  }

  rects.forEach(r => {
    
    // lor: left or right
    let lor = Math.floor(Math.random() * 2)
    // cos: circle or square
    let cos = Math.floor(Math.random() * 2)

    let startColor = '#000'
    let endColor = '#f54'

    let startRadius = cos ? r.width()/2 : 0
    let endRadius = cos ? 0 : r.width()/2

    let startX = lor ? leftMostX() : rightMostX(r)
    let endX = lor ? rightMostX(r) : leftMostX()

    let times = Infinity
    let swing = true

    r.fill(startColor)
    r.radius(startRadius, startRadius)
    r.x(startX)
    
    // horizontal
    r.animate(Math.random() * HORIZONTAL_SPEED_VARIANCE + HORIZONTAL_SPEED_MINIMUM, 0, 'absolute')
    .loop(times, swing)
    .ease('<>')
    .attr({
      fill: endColor,
      rx: endRadius,
      ry: endRadius,
      x: endX
    })
    .loops(Math.random() * 2)
    
    // vertical
    r.animate(Math.random() * VERTICAL_SPEED_VARIANCE + VERTICAL_SPEED_MINIMUM, 0, 'absolute')
    .loop(times, swing)
    .ease('<>')
    .attr({
      y: r.y() + (Math.random() * height - (height/2))
    })
    .loops(Math.random() * 2)
  })

}

function clearCanvas() {
  let node = document.getElementById('canvas')
  while(node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

function leftMostX() {
  return 0 - OVERFLOW
}
function rightMostX(dot) {
  return width - dot.width() + OVERFLOW
}