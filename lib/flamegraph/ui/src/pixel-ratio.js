// PIXEL_RATIO from https://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas
const PIXEL_RATIO = (function () {
  var ctx = document.createElement("canvas").getContext("2d"),
    dpr = window.devicePixelRatio || 1,
    bsr = ctx.webkitBackingStorePixelRatio ||
    ctx.mozBackingStorePixelRatio ||
    ctx.msBackingStorePixelRatio ||
    ctx.oBackingStorePixelRatio ||
    ctx.backingStorePixelRatio || 1;

  return dpr / bsr;
})();
export default PIXEL_RATIO;
