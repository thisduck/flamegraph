# inspired by https://github.com/brendangregg/FlameGraph
require 'base64'
require 'erb'

class Flamegraph::Renderer
  def initialize(stacks)
    @stacks = stacks
  end

  def graph_html(embed_resources)
    body = ERB.new(read('ui/flamegraph.html.erb')).result
    body.sub!('/**INCLUDES**/', includes(embed_resources))
    body.sub!('/**DATA**/', ::JSON.generate(graph_data))
    body
  end

  def graph_data
    table = []
    prev = []
    prev_parent = []

    # a 2d array makes collapsing easy
    @stacks.each_with_index do |stack, pos|

      next unless stack

      col = []
      new_col = false

      reversed_stack = stack.reverse
      reversed_stack.map{|r| r.to_s}.each_with_index do |frame, i|
        parent_frame = i > 0 ? reversed_stack[i - 1] : nil

        if !prev[i].nil? && !new_col
          last_col = prev[i]
          frame_match = last_col[0] == frame
          parent_match = parent_frame.nil? || prev_parent[i].nil? || parent_frame == prev_parent[i]

          if frame_match && parent_match
            last_col[1] += 1
            col << nil
            next
          else
            new_col = true
          end
        end

        prev[i] = [frame, 1]
        prev_parent[i] = parent_frame
        col << prev[i]
      end
      prev = prev[0..col.length-1].to_a
      table << col
    end

    data = []

    # a 1d array makes rendering easy
    table.each_with_index do |col, col_num|
      col.each_with_index do |row, row_num|
        next unless row && row.length == 2
        data << {
          :x => col_num + 1,
          :y => row_num + 1,
          :width => row[1],
          :frame => row[0]
        }
      end
    end

    data
  end

  private

  def include_files
    [
      'https://cdnjs.cloudflare.com/ajax/libs/jquery/1.9.1/jquery.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/1.3.1/lodash.min.js'
    ]
  end

  def includes(embed_resources)
    include_files.map do |file|
      if embed_resources
        embed(file)
      else
        link(file)
      end
    end.join("\n")
  end

  def embed(file)
    file = file.split('/').last
    body = read("ui/vendor/#{ file }")
    return "<script src='data:text/javascript;base64,#{Base64.encode64(body)}'></script>" if file =~ /\.js$/
    return "<link rel='stylesheet' href='data:text/css;base64,#{Base64.encode64(body)}' />" if file =~ /\.css$/

    ''
  end

  def link(file)
    return "<script src='#{file}'></script>" if file =~ /\.js$/
    return "<link rel='stylesheet' href='#{file}' />" if file =~ /\.css$/

    ''
  end

  def read(file)
    IO.read(::File.expand_path(file, ::File.dirname(__FILE__)))
  end

end

