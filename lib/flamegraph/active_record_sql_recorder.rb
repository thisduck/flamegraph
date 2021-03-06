require 'active_record/connection_adapters/abstract/database_statements'
require 'newrelic_rpm'

module Flamegraph
  class SQLRunner # :nodoc:
    attr_reader :sql
    def initialize(sql)
      @sql = sql
    end

    def self.run(sql, function)
      instance = new(sql)
      instance.run(function)
    end

    def run(function)
      if Thread.current[:sql_flame]
        recorder.send method_name, function
      else
        function.call
      end
    end

    private

    def method_name
      @method_name ||=
        begin
          sql_statement = sql.respond_to?(:to_sql) ? sql.to_sql : sql
          obfuscated_sql = NewRelic::Agent::Database.obfuscate_sql(sql_statement)
          ascii_sql = obfuscated_sql.gsub(/[^A-Za-z0-9]/) { |s| '_a' + s.ord.to_s }
          "sql_flame_#{ascii_sql}"
        end
    end

    def recorder
      Flamegraph::SQLRecorder.instance method_name
    end
  end

  class SQLRecorder # :nodoc:
    def self.instance(method_name)
      # filename is on its own so that it is not filtered as part of the flamegraph gem.
      class_eval <<-CODE, 'sql_recorder.rb', __LINE__ + 1
        def #{method_name}(function)
          function.call
        end
      CODE

      new
    end
  end
end

module ActiveRecord
  module ConnectionAdapters # :nodoc:
    module DatabaseStatements # :nodoc:

      def insert_with_flame(arel, name = nil, pk = nil, id_value = nil, sequence_name = nil, binds = [])
        function = lambda do
          insert_without_flame(arel, name, pk, id_value, sequence_name, binds)
        end

        Flamegraph::SQLRunner.run(arel, function)
      end
      alias_method_chain :insert, :flame

      def update_with_flame(arel, name = nil, binds = [])
        function = lambda do
          update_without_flame(arel, name, binds)
        end

        Flamegraph::SQLRunner.run(arel, function)
      end
      alias_method_chain :update, :flame

      def delete_with_flame(arel, name = nil, binds = [])
        function = lambda do
          delete_without_flame(arel, name, binds)
        end

        Flamegraph::SQLRunner.run(arel, function)
      end
      alias_method_chain :delete, :flame

      def select_with_flame(sql, name = nil, binds = [])
        function = lambda do
          select_without_flame(sql, name, binds)
        end

        Flamegraph::SQLRunner.run(sql, function)
      end
      alias_method_chain :select, :flame
    end
  end
end
