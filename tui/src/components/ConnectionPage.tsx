import { TextAttributes } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { useEffect, useMemo, useState } from "react"
import { Client } from "pg"
import type { Connection } from "../connections"

type SchemaData = Array<{
  name: string
  tables: Array<{
    name: string
    columns: Array<{ name: string; dataType: string }>
  }>
}>

type TreeRow = {
  id: string
  label: string
  level: number
  kind: "schema" | "table" | "column"
  schemaName: string
  tableName?: string
}

export function ConnectionPage({
  connection,
  onBackHint,
}: {
  connection: Connection
  onBackHint: string
}) {
  const [schemaData, setSchemaData] = useState<SchemaData | null>(null)
  const [schemaError, setSchemaError] = useState<string | null>(null)
  const [showSchemaBrowser, setShowSchemaBrowser] = useState(false)
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set())
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    let cancelled = false

    const loadSchema = async () => {
      setSchemaData(null)
      setSchemaError(null)

      let client: Client | null = null
      try {
        client = new Client({ connectionString: connection.url })
        await client.connect()

        const schemasResult = await client.query<{
          schema_name: string
        }>(
          "select schema_name from information_schema.schemata where schema_name not in ('pg_catalog','information_schema') order by schema_name"
        )

        const tablesResult = await client.query<{
          table_schema: string
          table_name: string
        }>(
          "select table_schema, table_name from information_schema.tables where table_type = 'BASE TABLE' and table_schema not in ('pg_catalog','information_schema') order by table_schema, table_name"
        )

        const columnsResult = await client.query<{
          table_schema: string
          table_name: string
          column_name: string
          data_type: string
        }>(
          "select table_schema, table_name, column_name, data_type from information_schema.columns where table_schema not in ('pg_catalog','information_schema') order by table_schema, table_name, ordinal_position"
        )

        const schemaMap = new Map<
          string,
          {
            tables: Map<string, { columns: Array<{ name: string; dataType: string }> }>
          }
        >()

        for (const row of schemasResult.rows) {
          schemaMap.set(row.schema_name, { tables: new Map() })
        }

        for (const row of tablesResult.rows) {
          if (!schemaMap.has(row.table_schema)) {
            schemaMap.set(row.table_schema, { tables: new Map() })
          }
          const schema = schemaMap.get(row.table_schema)!
          if (!schema.tables.has(row.table_name)) {
            schema.tables.set(row.table_name, { columns: [] })
          }
        }

        for (const row of columnsResult.rows) {
          if (!schemaMap.has(row.table_schema)) {
            schemaMap.set(row.table_schema, { tables: new Map() })
          }
          const schema = schemaMap.get(row.table_schema)!
          if (!schema.tables.has(row.table_name)) {
            schema.tables.set(row.table_name, { columns: [] })
          }
          schema.tables.get(row.table_name)!.columns.push({
            name: row.column_name,
            dataType: row.data_type,
          })
        }

        const schemas = Array.from(schemaMap.keys()).sort((a, b) => a.localeCompare(b))
        const data: SchemaData = schemas.map((schemaName) => {
          const tables = Array.from(schemaMap.get(schemaName)!.tables.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([tableName, tableData]) => ({
              name: tableName,
              columns: tableData.columns,
            }))
          return { name: schemaName, tables }
        })

        if (!cancelled) {
          setSchemaData(data)
        }
      } catch (err) {
        if (!cancelled) {
          setSchemaError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (client) {
          await client.end().catch(() => undefined)
        }
      }
    }

    void loadSchema()

    return () => {
      cancelled = true
    }
  }, [connection.url])

  const treeRows = useMemo<TreeRow[]>(() => {
    if (!schemaData) {
      return []
    }
    const rows: TreeRow[] = []
    for (const schema of schemaData) {
      const schemaExpanded = expandedSchemas.has(schema.name)
      rows.push({
        id: `schema:${schema.name}`,
        label: `${schemaExpanded ? "▾" : "▸"} ${schema.name}`,
        level: 0,
        kind: "schema",
        schemaName: schema.name,
      })
      if (schemaExpanded) {
        for (const table of schema.tables) {
          const tableKey = `${schema.name}.${table.name}`
          const tableExpanded = expandedTables.has(tableKey)
          rows.push({
            id: `table:${tableKey}`,
            label: `${tableExpanded ? "▾" : "▸"} ${table.name}`,
            level: 1,
            kind: "table",
            schemaName: schema.name,
            tableName: table.name,
          })
          if (tableExpanded) {
            if (table.columns.length === 0) {
              rows.push({
                id: `column:${tableKey}:(no-columns)`,
                label: "(no columns)",
                level: 2,
                kind: "column",
                schemaName: schema.name,
                tableName: table.name,
              })
            } else {
              for (const column of table.columns) {
                rows.push({
                  id: `column:${tableKey}:${column.name}`,
                  label: `${column.name}: ${column.dataType}`,
                  level: 2,
                  kind: "column",
                  schemaName: schema.name,
                  tableName: table.name,
                })
              }
            }
          }
        }
        if (schema.tables.length === 0) {
          rows.push({
            id: `table:${schema.name}:(no-tables)`,
            label: "(no tables)",
            level: 1,
            kind: "table",
            schemaName: schema.name,
          })
        }
      }
    }
    return rows
  }, [expandedSchemas, expandedTables, schemaData])

  useEffect(() => {
    if (!showSchemaBrowser) {
      return
    }
    setSelectedIndex((prev) => Math.min(prev, Math.max(treeRows.length - 1, 0)))
  }, [showSchemaBrowser, treeRows.length])

  const schemaBrowserContent = useMemo(() => {
    if (schemaError) {
      return <text fg="#FF0000">Schema load failed: {schemaError}</text>
    }
    if (!schemaData) {
      return <text attributes={TextAttributes.DIM}>Loading schema...</text>
    }
    if (treeRows.length === 0) {
      return <text attributes={TextAttributes.DIM}>No schemas found.</text>
    }
    return (
      <scrollbox focused>
        <box flexDirection="column" gap={0}>
          {treeRows.map((row, idx) => (
            <text
              key={row.id}
              attributes={idx === selectedIndex ? TextAttributes.INVERSE : TextAttributes.NONE}
            >
              {"  ".repeat(row.level)}
              {row.label}
            </text>
          ))}
        </box>
      </scrollbox>
    )
  }, [schemaData, schemaError, selectedIndex, treeRows])

  useKeyboard((key) => {
    if (!showSchemaBrowser) {
      if (key.name === "s") {
        setShowSchemaBrowser(true)
      }
      return
    }

    if (key.name === "q" || key.name === "escape") {
      setShowSchemaBrowser(false)
      return
    }

    if (key.name === "j") {
      setSelectedIndex((prev) => Math.min(prev + 1, Math.max(treeRows.length - 1, 0)))
      return
    }
    if (key.name === "k") {
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
      return
    }
    if (key.name === "g") {
      setSelectedIndex(0)
      return
    }
    if (key.name === "G") {
      setSelectedIndex(Math.max(treeRows.length - 1, 0))
      return
    }

    if (key.name === "return") {
      const row = treeRows[selectedIndex]
      if (!row) {
        return
      }
      if (row.kind === "schema") {
        setExpandedSchemas((prev) => {
          const next = new Set(prev)
          if (next.has(row.schemaName)) {
            next.delete(row.schemaName)
          } else {
            next.add(row.schemaName)
          }
          return next
        })
      } else if (row.kind === "table" && row.tableName) {
        const tableKey = `${row.schemaName}.${row.tableName}`
        setExpandedTables((prev) => {
          const next = new Set(prev)
          if (next.has(tableKey)) {
            next.delete(tableKey)
          } else {
            next.add(tableKey)
          }
          return next
        })
      }
    }
  })

  return (
    <box flexDirection="column" flexGrow={1} padding={1} gap={1}>
      <box alignItems="center" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD}>{connection.name}</text>
        <text attributes={TextAttributes.DIM}>{onBackHint}</text>
      </box>
      {showSchemaBrowser ? (
        <box flexDirection="column" gap={1} flexGrow={1}>
          <text attributes={TextAttributes.DIM}>
            Schema browser — j/k move, Enter toggle, q to close
          </text>
          {schemaBrowserContent}
        </box>
      ) : (
        <box flexDirection="column" gap={1} flexGrow={1}>
          <text attributes={TextAttributes.DIM}>Connection URL:</text>
          <text selectable>{connection.url}</text>
          <text> </text>
          <text attributes={TextAttributes.DIM}>Created:</text>
          <text>{new Date(connection.createdAt).toLocaleString()}</text>
          <text> </text>
          <text attributes={TextAttributes.DIM}>Press s to browse schema</text>
        </box>
      )}
    </box>
  )
}
