import Eventable from 'util/Eventable.js';
import { NODE_RADIUS, SELF_LOOP_HEIGHT, PLACEHOLDER_LENGTH } from 'config.js';

import DFA from 'machine/DFA.js';
import NFA from 'machine/NFA.js';

import Node from './Node.js';
import Edge from './Edge.js';

//nodeCreate(node) - Whenever a new node is created
//nodeDestroy(node) - Whenever a node is destroyed (even on clear)
//nodeLabel(node, newLabel, oldLabel) - Whenever a node label changes
//edgeCreate(edge) - Whenever a new edge is created
//edgeDestroy(edge) - Whenever an edge is destroyed (even on clear)
//edgeLabel(edge, newLabel, oldLabel) - Whenever a node label changes
//edgeDestination(edge, newDestination, oldDestination) - Whenever a node changes destination
//toggleAccept(node) - Whenever a node changes to an accept state, or vice versa
//newInitial(node, oldNode) - Whenever a node becomes the initial state; oldNode could be null
//markDirty(graph) - Whenever the graph is marked dirty
class NodalGraph
{
  constructor(nodes=[], edges=[])
  {
    this.nodes = nodes;
    this.edges = edges;

    this._machine = null;
  }

  newNode(x, y, label)
  {
    const result = new Node(this, x, y, label);
    if (this.nodes.length == 0)
    {
      this.emit("newInitial", result, null);
    }
    this.nodes.push(result);
    this.emit("nodeCreate", result);

    this.markDirty();
    return result;
  }

  deleteNode(node)
  {
    //Make sure that any connections to this node are resolved before removal
    let edge = null;
    for(let i = this.edges.length - 1; i >= 0; --i)
    {
      edge = this.edges[i];
      if (edge.from == node)
      {
        //Delete any edges that have this node as a source
        this.edges.splice(i, 1);
        this.emit("edgeDestroy", edge);
      }
      else if (edge.to == node)
      {
        //Return any edges that have this node as a destination
        edge.makePlaceholder();
      }
    }
    let nodeIndex = this.nodes.indexOf(node);
    this.nodes.splice(nodeIndex, 1);
    if (nodeIndex == 0)
    {
      this.emit("newInitial", this.getStartNode(), node);
    }
    this.emit("nodeDestroy", node);

    this.markDirty();
  }

  newEdge(from, to, label)
  {
    const result = new Edge(this, from, to, label);
    this.edges.push(result);
    this.emit("edgeCreate", result);

    this.markDirty();
    return result;
  }

  deleteEdge(edge)
  {
    this.edges.splice(this.edges.indexOf(edge), 1);
    this.emit("edgeDestroy", edge);

    this.markDirty();
  }

  deleteAll()
  {
    for(let node of this.nodes)
    {
      this.emit("nodeDestroy", node);
    }
    this.nodes.length = 0;

    for(let edge of this.edges)
    {
      this.emit("edgeDestroy", edge);
    }
    this.edges.length = 0;

    this.markDirty();
  }

  setStartNode(node)
  {
    if (this.nodes.length <= 1) return;

    this.nodes.splice(this.nodes.indexOf(node), 1);
    const prevNode = this.nodes[0];
    this.nodes.unshift(node);
    this.emit("newInitial", node, prevNode);

    this.markDirty();
  }

  getStartNode()
  {
    return this.nodes.length > 0 ? this.nodes[0] : null;
  }

  getBoundingRect() {
    var minNX = Number.MAX_VALUE;
    var minNY = Number.MAX_VALUE;
    var maxNX = 0;
    var maxNY = 0;
    this.nodes.forEach(function (node) {
      if(node.x < minNX) minNX = node.x;
      if(node.x > maxNX) maxNX = node.x;
      if(node.y < minNY) minNY = node.y;
      if(node.y > maxNY) maxNY = node.y;
    });
    minNX -= NODE_RADIUS;
    minNY -= NODE_RADIUS;
    maxNX += NODE_RADIUS;
    maxNY += NODE_RADIUS;

    var minEX = Number.MAX_VALUE;
    var minEY = Number.MAX_VALUE;
    var maxEX = 0;
    var maxEY = 0;
    this.edges.forEach(function (edge) {
      const startpoint = edge.getStartPoint();
      const endpoint = edge.getEndPoint();
      const center = edge.getCenterPoint();

      minEX = Math.min(minEX, startpoint.x, endpoint.x, center.x);
      minEY = Math.min(minEY, startpoint.y, endpoint.y, center.y);
      maxEX = Math.max(maxEX, startpoint.x, endpoint.x, center.y);
      maxEY = Math.max(maxEY, startpoint.y, endpoint.y, center.y);
    });

    const result = {
      minX: minNX < minEX ? minNX : minEX,
      minY: minNY < minEY ? minNY : minEY,
      maxX: maxNX > maxEX ? maxNX : maxEX,
      maxY: maxNY > maxEY ? maxNY : maxEY,
      width: 0,
      height: 0
    };
    result.width = result.maxX - result.minX;
    result.height = result.maxY - result.minY;
    return result;
  }


  copyGraph(graph)
  {
    this.deleteAll();
    this.nodes = this.nodes.concat(graph.nodes);
    this.edges = this.edges.concat(graph.edges);

    this.markDirty();
  }

  markDirty()
  {
    const prevMachine = this._machine;
    this._machine = null;
    this.emit("markDirty", this);
  }

  isDirty()
  {
    return !this._machine;
  }

  static parseJSON(data)
  {
    const nodeLength = data.nodeCount;
    const edgeLength = data.edgeCount;

    if (nodeLength < 0) throw new Error("Invalid graph data: negative number of nodes.");
    if (edgeLength < 0) throw new Error("Invalid graph data: negative number of edges.");

    const dst = new NodalGraph(new Array(nodeLength), new Array(edgeLength));

    //The initial node is always saved/loaded first!
    for(let i = 0; i < nodeLength; ++i)
    {
      const node = data.nodes[i];
      const newNode = new Node(dst, node.x || 0, node.y || 0, node.label || "q?");
      newNode.accept = node.accept;
      dst.nodes[i] = newNode;
    }

    for(let i = 0; i < edgeLength; ++i)
    {
      const edge = data.edges[i];

      if (edge.from >= nodeLength || edge.from < 0) throw new Error("Invalid edge from data: node index \'" + edge.from + "\' out of bounds.");

      const newEdge = new Edge(dst, dst.nodes[edge.from], edge.to < 0 ? null : dst.nodes[edge.to], edge.label || "0");
      newEdge.quad.x = edge.quadx || 0;
      newEdge.quad.y = edge.quady || 0;
      dst.edges[i] = newEdge;
    }

    return dst;
  }

  toJSON()
  {
    const nodeLength = this.nodes.length;
    const edgeLength = this.edges.length;

    const data = {
      nodeCount: nodeLength,
      nodes: new Array(nodeLength),
      edgeCount: edgeLength,
      edges: new Array(edgeLength)
    };

    for(let i = 0; i < nodeLength; ++i)
    {
      const node = this.nodes[i];
      data.nodes[i] = {
        x: node.x,
        y: node.y,
        label: node.label,
        accept: node.accept
      };
    }

    for(let i = 0; i < edgeLength; ++i)
    {
      const edge = this.edges[i];
      data.edges[i] = {
        from: this.nodes.indexOf(edge.from),
        to: this.nodes.indexOf(edge.to),
        quadx: edge.quad.x,
        quady: edge.quad.y,
        label: edge.label
      };
    }

    return data;
  }

  toDFA(dst=null)
  {
    const result = dst || new DFA();
    if (!(result instanceof DFA))
      throw new Error("Trying to parse graph mismatched machine type.");
    fillFSA(this, result);
    return result;
  }

  toNFA(dst=null)
  {
    console.error("RAWR! I am a T-Rex!");
    return this._toNFA(dst);
  }

  //TODO: NEVER CALL THIS DIRECTLY (Only FSABuilder is allowed.) Will be deprecated later.
  _toNFA(dst=null)
  {
    const result = dst || new NFA();
    if (!(result instanceof NFA))
      throw new Error("Trying to parse graph mismatched machine type.");
    fillFSA(this, result);
    return result;
  }
}
//Mixin Eventable
Eventable.mixin(NodalGraph);

function fillFSA(graph, fsa)
{
  if (graph.nodes.length <= 0) return fsa;

  //Create all the nodes
  for(const node of graph.nodes)
  {
    try
    {
      let state = node.label;
      fsa.newState(state);

      //Set final state
      if (node.accept)
      {
        fsa.setFinalState(state, true);
      }
    }
    catch(e)
    {
      throw e;
    }
  }

  //Create all the edges
  for(const edge of graph.edges)
  {
    //Ignore any incomplete edges
    if (edge.isPlaceholder()) continue;
    const from = edge.from;
    const to = edge.to;
    if (from instanceof Node && to instanceof Node)
    {
      const labels = edge.label.split(",");
      for(const label of labels)
      {
        try
        {
          fsa.newTransition(from.label, to.label, label);
        }
        catch(e)
        {
          throw e;
        }
      }
    }
  }

  //Set start state
  let startState = graph.getStartNode().label;
  fsa.setStartState(startState);

  return fsa;
}

function lerp(a, b, dt)
{
  return a * (1 - dt) + b * dt;
}

export default NodalGraph;
