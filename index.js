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
  
  const dotSpacing = 15
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
    let start = lor ? '#000' : '#f54'
    let end = lor ? '#f54' : '#000'
    r.fill(start)
    
    // horizontal
    r.animate({
      duration: Math.random() * 4000 + 1000,
      swing: true,
      times: Infinity,
      when: 'now',
      delay: 0
    })
    .ease('<>')
    .attr({
      fill: end,
      rx: r.width()/2,
      ry: r.width()/2,
      x: width - r.width()
    })
    .loops(Math.random() * 2)
    
    // vertical
    r.animate({
      duration: Math.random() * 4000 + 1000,
      swing: true,
      times: Infinity,
      when: 'now',
      delay: 0
    })
    .ease('<>')
    .attr({
      y: r.y() + (Math.random() * 250) - 125
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