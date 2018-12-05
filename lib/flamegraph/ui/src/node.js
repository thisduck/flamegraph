import PathCache from './path-cache.js';

export default class Node {
  constructor({id, data}) {
    this._data = data;
    this.id = id;
  }

  get x() {
    return this._data.x;
  }

  get y() {
    return this._data.y;
  }

  get width() {
    return this._data.width;
  }

  get frame() {
    return this._data.frame;
  }

  get gem() {
    return PathCache.gem(this.frame);
  }

  get shortMethod() {
    return PathCache.shortMethod(this.frame);
  }

  get fullMethod() {
    return PathCache.fullMethod(this.frame);
  }

  get file() {
    return PathCache.file(this.frame);
  }

  backtrace(nodes) {
    for(var i = 0; i < nodes.length; i++){
      if(this === nodes[i]){ break; }
    }

    var trace = [this];
    var depth = this.y;

    while(i > 0){
      if(depth == -1) break;

      if(nodes[i].y === depth - 1) {
        trace.push(nodes[i]);
        depth--;
      }

      i--;
    }

    return trace;
  }
};
