class NodesByFrame {
  constructor() {
    this._nodes = {};
  }

  add(node) {
    this._nodes[node.frame] = this._nodes[node.frame] || [];
    this._nodes[node.frame].push(node);
  }

  nodes(frame) {
    return this._nodes[frame];
  }
}

export default (new NodesByFrame);
