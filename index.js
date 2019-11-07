if(document.readyState === 'complete') {
  init()
} else {
  window.addEventListener('load', () => {
    init()
  })
}

let debouncer = null

let canvas, width, height

function init() {
  canvas = SVG()
    .addTo('#canvas')

  window.addEventListener('resize', () => {
    if(debouncer) return
    debouncer = setTimeout(() => {
      debouncer = null
      run()
    }, 1000)
  })

  run()
}

function reset() {
  width = document.body.scrollWidth
  height = document.body.scrollHeight

  canvas.size(width, height)
  canvas.clear()
}

function run() {
  if(debouncer) return
  
  console.log('starting graphics!')
  
  reset()
  
  const dotSpacing = height / 50
  let rects = []
  let y = 0

  while(y < height) {
    const dotSize = Math.floor(Math.random() * 5 + 5)
    let r = canvas.rect(dotSize, dotSize)
    r.y(y)
    rects.push(r)
    y += dotSpacing
  }

  rects.forEach(r => {
    
    // lor: left or right
    let lor = Math.floor(Math.random() * 2)

    let startColor = '#000'
    let endColor = '#f54'

    let startX = lor ? 0 : width - r.width()
    let endX = lor ? width - r.width() : 0

    let times = Infinity
    let swing = true

    r.x(startX)
    r.fill(startColor)
    
    // horizontal
    r.animate(Math.random() * 4000 + 1000, 0, 'absolute')
    .loop(times, swing)
    .ease('<>')
    .attr({
      fill: endColor,
      rx: r.width()/2,
      ry: r.width()/2,
      x: endX
    })
    .loops(Math.random() * 2)
    
    // vertical
    r.animate(Math.random() * 4000 + 4000, 0, 'absolute')
    .loop(times, swing)
    .ease('<>')
    .attr({
      y: r.y() + (Math.random() * height)
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