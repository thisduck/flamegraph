import _ from 'lodash';
import * as d3 from 'd3';
import $ from 'jquery';
import randomColor from 'randomcolor';
import uniqueColor from './unique-color.js';
import PIXEL_RATIO from './pixel-ratio.js';
import Color from 'color';
import ScaleCache from './scale-cache.js';
import GemData from './gem-data.js';
import NodesByFrame from './nodes-by-frame.js';

export default class Graph {

  constructor({nodes}) {
    this.nodes = nodes;
    window.graph = this;
    console.log(this);
    this.zoomScale = 1;
    this.textWidths = {};

    this.width = $(window).width();
    this.height = $(window).height() / 1.2;

    this.colorNodeMapping = {};

    this.setupGraph();
    this.preProcess();
  }

  highlightGem(gem) {
    this.nodes.forEach((n) => n.highlight = false);

    if (gem) {
      GemData.nodes(gem).forEach((node) => node.highlight = true);
    }

    this.rescaleCanvas();
  }

  set highlightedNode(node) {
    if (this.nodeHighlight == node) return;

    this.nodeHighlight = node;

    if (this.zooming) return;

    if (node) {
      this.nodeHighlight.highlight = true;
      NodesByFrame.nodes( node.frame ).forEach((n) => n.highlight = true);
      $('.info').text(node.frame);
    }

    this.rescaleCanvas();
  }

  preProcess() {
    this.colors = {};
    this.maxX = 0;
    this.maxY = 0;

    _.each(this.nodes, (node) => {
      this.maxX = Math.max(this.maxX, node.x + node.width);
      this.maxY = Math.max(this.maxY, node.y);
      this.colors[node.method] = this.colors[node.method] || randomColor({seed: node.method});

      GemData.add(node);
      NodesByFrame.add(node);

      node.color = GemData.color(node.gem);

      var color = Color(node.color);
      node.textColor = color.isDark() ? "lightyellow" : "black";

      node.highlightColor = color.lighten(0.5);
      node.highlightTextColor = node.highlightColor.isDark() ? "lightyellow" : "black";

      node.uniqueColor = uniqueColor();
      this.colorNodeMapping[node.uniqueColor] = node;

      node.graphText = node.method;
    });

    this.xScale = d3.scale.linear()
      .domain([0, this.maxX])
      .range([0, this.width]);


    this.yScale = d3.scale.linear()
      .domain([0, this.maxY])
      .range([0, this.height]);

    ScaleCache.xScale = this.xScale;
    ScaleCache.yScale = this.yScale;

    _.each(this.nodes, (node) => {
      node.x_y_width_height = [
        ScaleCache.x(node.x - 1),
        ScaleCache.y(this.maxY - node.y),
        ScaleCache.x(node.width),
        ScaleCache.y(1),
      ];

      this.canvasContext.fillStyle = node.textColor;
      this.canvasContext.font = `0.75px Arial`;
      var method = node.method;
      // while ( this.canvasContext.measureText(`${method}....`).width > ScaleCache.x(node.width - 0.05) ) {
      //   method = method.slice(0, -1);
      // }

      // if (method != node.method) {
      //   method = `${method}...`;
      // }
      var textWidth = this.textWidths[method] || this.canvasContext.measureText(method).width; 
      this.textWidths[method] = this.textWidths[method] || textWidth;
      if (textWidth > ScaleCache.x(node.width - 0.05) ) {
        node.graphText = "";
      }
    });
  }

  setupGraph() {

    this.canvas = d3.select(".graph")
      .append("canvas")
      .attr("width", this.width * PIXEL_RATIO)
      .attr("height", this.height * PIXEL_RATIO)
      .attr("style", `width: ${this.width}px; height: ${this.height}px;`)
      .on('mousemove', () => {

        // get mousePositions from the main canvas
        var mouseX = (d3.event.layerX || d3.event.offsetX) * PIXEL_RATIO;
        var mouseY = (d3.event.layerY || d3.event.offsetY) * PIXEL_RATIO;

        var col = this.hiddenCanvasContext.getImageData(mouseX, mouseY, 1, 1).data;
        var colKey = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';

        var node = this.colorNodeMapping[colKey];

        this.nodes.forEach((node) => node.highlight = false);

        this.highlightedNode = node;

      });

    this.canvas.call(
      d3.behavior.zoom()
      .scaleExtent([1, Infinity])
      .on("zoom", () => this.canvasZoom())
      .on("zoomend", () => this.canvasZoomEnd())
    );

    this.canvasContext = this.canvas.node().getContext("2d");
    this.canvasContext.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);

    var element = document.createElement('canvas');
    this.hiddenCanvas = d3.select(element)
      .attr("width", this.width * PIXEL_RATIO)
      .attr("height", this.height * PIXEL_RATIO)
      .attr("style", `width: ${this.width}px; height: ${this.height}px;`);


    this.hiddenCanvasContext = this.hiddenCanvas.node().getContext("2d");
    this.hiddenCanvasContext.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
  }

  draw() {
    this.drawCanvas(this.canvasContext);
    this.drawCanvas(this.hiddenCanvasContext);
  }

  visibleNodes() {
    return _.filter(this.nodes, (node) => {
      if (this.zoomScale * ScaleCache.x(node.width) > 3) {
        return true;
      }
      return false;
    });
  }

  nodesToDraw() {
    if (this.zooming) {
      return this.visibleNodes();
    } else {
      return this.nodes;
    }
  }

  canvasZoom() {
    clearTimeout(this.zoomEndTimeout);
    this.zoomScale = d3.event.scale;
    this.zoomEvent = d3.event;
    this.zooming = true;
    this.rescaleCanvas();
  }

  canvasZoomEnd() {
    this.zooming = false;
    this.zoomEndTimeout = setTimeout(() => {
      this.rescaleCanvas();
    }, 100);
  }

  rescaleCanvas() {
    var contexts = [this.canvasContext, this.hiddenCanvasContext];
    contexts.forEach((context) => {
      context.save();
      context.clearRect(0, 0, this.width, this.height);
      if (this.zoomEvent) {
        context.translate(this.zoomEvent.translate[0], this.zoomEvent.translate[1]);
        context.scale(this.zoomEvent.scale, this.zoomEvent.scale);
      }
      this.drawCanvas(context);
      context.restore();
    });
  }

  drawNode(context, node) {
    var displayContext = context == this.canvasContext;

    context.beginPath();
    context.rect(
      ...node.x_y_width_height
    );
    var nodeColor = node.color;
    var textColor = node.textColor;
    if (node.highlight) {
      nodeColor = node.highlightColor;
      textColor = node.highlightTextColor;
    }
    context.fillStyle = (displayContext ? nodeColor : node.uniqueColor);
    context.fill();


    if (displayContext) {

      if (this.zoomScale * ScaleCache.x(node.width) > 1) {
        context.lineWidth = ScaleCache.y(0.05);
        context.strokeStyle = "black";
        context.stroke();
      }
      var fontSize = 0.6 * ScaleCache.y(1);
      if ((this.zoomScale * ScaleCache.y(1) > 5)) {
        context.fillStyle = textColor;
        context.font = `${fontSize}px Arial`;
        context.fillText(
          node.graphText,
          ScaleCache.x(node.x - 1) + ScaleCache.y(0.2),
          ScaleCache.y(this.maxY - node.y) + ScaleCache.y(0.6)
        );
      }
    }

    context.closePath();
  }

  drawCanvas(context) {
    this.nodesToDraw().forEach((node) => {
      this.drawNode(context, node);
    });
  }
};
