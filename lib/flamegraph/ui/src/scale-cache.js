class ScaleCache {
  constructor() {
    this._y = {};
    this._x = {};
  }

  x(value) {
    if (this._x[value]) return this._x[value];
    this._x[value] = this.xScale(value);
    return this._x[value];
  }

  y(value) {
    if (this._y[value]) return this._y[value];
    this._y[value] = this.yScale(value);
    return this._y[value];
  }
}
export default (new ScaleCache);
