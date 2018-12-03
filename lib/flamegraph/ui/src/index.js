import $ from 'jquery';
import * as d3 from 'd3';
import _ from 'lodash';

import Node from './node.js';
import Graph from './graph.js';
import GemData from './gem-data.js';

$(function() {
  var data = [];
  if (process.env.NODE_ENV == 'development') {
    $.ajax({
      url: './data.json',
      async: false,
      success: function(response) {
        if (typeof response === "string") {
          data = JSON.parse(response);
        } else {
          data = response;
        }
      }
    });
  } else {
    data = window.data;
  }

  var nodes = [];

  for(var i = 0; i < data.length; i++) {
    var node = new Node({id: i, data: data[i]})
    nodes.push(node);
  }

  var width = $(window).width();
  var height = $(window).height() / 1.2;

  $('.graph').width(width).height(height);

  var graph = new Graph({nodes});

  graph.draw();

  // render the legend
  _.each(GemData.gems, function(gem){
    var node = $("<div></div>")
      .css("background-color", GemData.color(gem))
      .text(gem) // + " " + samplePercent(gem.samples.length))
      .on("mouseover", () => graph.highlightGem(gem))
      .on("mouseout", () => graph.highlightGem(null));
    $('.legend').append(node);
  });
});
