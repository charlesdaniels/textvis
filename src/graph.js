par2sent_strength = 0.3
par2par_strength = 0.2
sent2sent_strength = 0.4
relation_strength = 0.0

paragraphs = [
    {
        "index": 0,
        "sentences": [
            {"index": 0, "words": "This is the first sentence."},
            {"index": 1, "words": "This is the second sentence."},
        ]
    },
    {
        "index": 1,
        "sentences": [
            {"index": 0, "words": "Another sentence!"},
            {"index": 1, "words": "Wow, such sentence, very words."},
        ]
    },
    {
        "index": 2,
        "sentences": [
            {"index": 0, "words": "Yo dawg, I heard you liked words."},
            {"index": 1, "words": "So I put some words in this sentence."},
            {"index": 2, "words": "So you can word while you word."},
            {"index": 3, "words": "All the test data is belong to me."},
        ]
    }
]

relations = [
    {
        "from": {"paragraph": 0, "sentence": 1},
        "to": {"paragraph": 2, "sentence": 3},
        "annotation": "Informative data provided by API client."
    },
    {
        "from": {"paragraph": 1, "sentence": 0},
        "to": {"paragraph": 2, "sentence": 1},
        "annotation": "This should be a tooltip."
    }
]

/* build representation of text */
nodes = []
links = []
prev_par = null
for (par of paragraphs) {

    /* paragraph container nodes */
    nodes.push({
        id: par.index,
        label: `paragraph ${par.index}`,
        level: 1,
        align: 100,
    })

    prev = null;
    for (sent of par.sentences) {

        /* sentence nodes */
        nodes.push({
            id: `${par.index},${sent.index}`,
            label: `(${sent.index}) sent.words`,
            level: 2,
            align: 700,
        })

        /* link sentence to it's paragraph container */
        links.push({
            source: `${par.index},${sent.index}`,
            target: par.index,
            strength: par2sent_strength,
            annotation: "structural",
        });

        /* link sentence to previous sentence */
        if (prev !== null) {
            links.push({
                source: `${par.index},${sent.index}`,
                target: `${par.index},${prev.index}`,
                strength: sent2sent_strength,
                annotation: "structural",
            })
        }

        prev = sent;
    }

    /* link paragraph to previous paragraph */
    if (prev_par !== null){
        links.push({
            source: par.index,
            target: prev_par.index,
            strength: par2par_strength,
            annotation: "structural",
        })
    }

    prev_par = par;
}

/* build up representation of relations */
for (relation of relations) {
    links.push({
        source: `${relation.from.paragraph},${relation.from.sentence}`,
        target: `${relation.to.paragraph},${relation.to.sentence}`,
        annotation: relation.annotation,
        strength: relation_strength,
    })
}


function getNeighbors(node) {
  return links.reduce(function (neighbors, link) {
      if (link.target.id === node.id) {
        neighbors.push(link.source.id)
      } else if (link.source.id === node.id) {
        neighbors.push(link.target.id)
      }
      return neighbors
    },
    [node.id]
  )
}

function isNeighborLink(node, link) {
  return link.target.id === node.id || link.source.id === node.id
}


function getNodeColor(node, neighbors) {
  if (Array.isArray(neighbors) && neighbors.indexOf(node.id) > -1) {
    return node.level === 1 ? 'blue' : 'green'
  }

  return node.level === 1 ? 'red' : 'gray'
}


function getLinkColor(node, link) {
  // return isNeighborLink(node, link) ? 'green' : link.stroke;

}

function getTextColor(node, neighbors) {
  return Array.isArray(neighbors) && neighbors.indexOf(node.id) > -1 ? 'green' : 'black'
}

function alignForce(alpha) {
    /* try to align each node to a specific x */
    for (node of nodes) {
        if (node.align == null) { continue }

        node.vx += (node.align - node.x) * 0.2 * alpha;
    }
}

var width = window.innerWidth
var height = window.innerHeight

var svg = d3.select('svg')
svg.attr('width', width).attr('height', height)

// simulation setup with all forces
var linkForce = d3
  .forceLink()
  .id(function (link) { return link.id })
  .strength(function (link) { return link.strength })

var simulation = d3
  .forceSimulation()
  .force('link', linkForce)
  .force('charge', d3.forceManyBody().strength(-120))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force("align", alignForce)

var dragDrop = d3.drag().on('start', function (node) {
  node.fx = node.x
  node.fy = node.y
}).on('drag', function (node) {
  simulation.alphaTarget(0.7).restart()
  node.fx = d3.event.x
  node.fy = d3.event.y
}).on('end', function (node) {
  if (!d3.event.active) {
    simulation.alphaTarget(0)
  }
  node.fx = null
  node.fy = null
})

function selectNode(selectedNode) {
  var neighbors = getNeighbors(selectedNode)

  // we modify the styles to highlight selected nodes
  nodeElements.attr('fill', function (node) { return getNodeColor(node, neighbors) })
  textElements.attr('fill', function (node) { return getTextColor(node, neighbors) })
  linkElements.attr('stroke', function (link) { return getLinkColor(selectedNode, link) })
}

var linkElements = svg.append("g")
  .attr("class", "links")
  .selectAll("line")
  .data(links)
  .enter().append("line")
    .attr("stroke-width", 1)
	  .attr("stroke", "rgba(50, 50, 50, 0.2)")

var nodeElements = svg.append("g")
  .attr("class", "nodes")
  .selectAll("circle")
  .data(nodes)
  .enter().append("circle")
    .attr("r", 10)
    .attr("fill", getNodeColor)
    .call(dragDrop)
    // .on('click', selectNode)

var textElements = svg.append("g")
  .attr("class", "texts")
  .selectAll("text")
  .data(nodes)
  .enter().append("text")
    .text(function (node) { return  node.label })
	  .attr("font-size", 15)
	  .attr("dx", 15)
    .attr("dy", 4)

simulation.nodes(nodes).on('tick', () => {
  nodeElements
    .attr('cx', function (node) { return node.x })
    .attr('cy', function (node) { return node.y })
  textElements
    .attr('x', function (node) { return node.x })
    .attr('y', function (node) { return node.y })
  linkElements
    .attr('x1', function (link) { return link.source.x })
    .attr('y1', function (link) { return link.source.y })
    .attr('x2', function (link) { return link.target.x })
    .attr('y2', function (link) { return link.target.y })

    linkElements.attr('stroke', function (link) {
        if (link.annotation == "structural") {
            return "#E5E5E5"
        } else {
            return "black"
        }
    });

})

simulation.force("link").links(links)
