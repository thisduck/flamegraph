import randomColor from 'randomcolor';
import _ from 'lodash';

class NodesByGem {
  constructor() {
    this._nodes = {};
    this._gems = {};
  }

  add(node) {
    this._nodes[node.gem] = this._nodes[node.gem] || [];
    this._nodes[node.gem].push(node);

    this._gems[node.gem] = this._gems[node.gem] || {color: randomColor({seed: node.gem})};
  }

  gem(gem) {
    return this._gems[gem];
  }

  color(gem) {
    return this.gem(gem).color;
  }

  get gems() {
    return _.keys(this._gems);
  }

  nodes(gem) {
    return this._nodes[gem];
  }
}

export default (new NodesByGem);
