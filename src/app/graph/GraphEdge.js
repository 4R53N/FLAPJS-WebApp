import GraphElement from 'graph/GraphElement.js';

class GraphEdge extends GraphElement
{
  constructor(id, from, to)
  {
    super(id);

    if (!from) throw new Error("Source of edge cannot be null.");

    this._from = from;
    this._to = to;

    this._label = "";
  }

  setSourceNode(node)
  {
    if (!node) throw new Error("Source of edge cannot be null.");

    this._from = node;
    return this;
  }

  getSourceNode()
  {
    return this._from;
  }

  changeDestinationNode(node)
  {
    this._to = node;
  }

  getDestinationNode()
  {
    return this._to;
  }

  setEdgeLabel(label)
  {
    this._label = label;
  }

  getEdgeLabel()
  {
    return this._label;
  }

  getStartPoint(dst={x: 0, y: 0})
  {
    const from = this._from;
    dst.x = from.x;
    dst.y = from.y;
    return dst;
  }

  getCenterPoint(dst={x: 0, y: 0})
  {
    const from = this._from;
    const to = this._to;
    if (this.isPlaceholder())
    {
      dst.x = from.x + from.getNodeSize() / 2;
      dst.y = from.y + from.getNodeSize() / 2;
    }
    else
    {
      dst.x = from.x + (to.x - from.x) / 2;
      dst.y = from.y + (to.y - from.y) / 2;
    }
    return dst;
  }

  getEndPoint(dst={x: 0, y: 0})
  {
    if (this.isPlaceholder())
    {
      const from = this._from;
      dst.x = from.x + from.getNodeSize();
      dst.y = from.y + from.getNodeSize();
    }
    else
    {
      const to = this._to;
      dst.x = to.x;
      dst.y = to.y;
    }
    return dst;
  }

  isPlaceholder()
  {
    return this.to == null;
  }

  isSelfLoop()
  {
    return this.from == this.to;
  }
}

export default GraphEdge;