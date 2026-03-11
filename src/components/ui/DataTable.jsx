import { useState, useMemo } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import EmptyState from './EmptyState'

/**
 * DataTable — Full-featured sortable data table.
 *
 * @param {Array<{key: string, label: string, render?: function, sortable?: boolean, align?: string}>} columns
 * @param {Array<object>} data
 * @param {boolean} loading
 * @param {function} onRowClick
 * @param {string} emptyMessage
 * @param {string} emptyIcon - Heroicon component for empty state
 * @param {React.ReactNode} emptyAction - CTA button for empty state
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  onRowClick,
  emptyMessage = 'No data yet',
  emptyDescription,
  emptyIcon,
  emptyAction,
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    const col = columns.find(c => c.key === sortKey)
    if (!col) return data

    return [...data].sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      const sa = String(va).toLowerCase()
      const sb = String(vb).toLowerCase()
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
    })
  }, [data, sortKey, sortDir, columns])

  if (loading) {
    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {columns.map(col => <th key={col.key}>{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key}>
                    <div className="skeleton" style={{ height: 16, borderRadius: 4 }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!data.length) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyMessage}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return null
    const Icon = sortDir === 'asc' ? ChevronUpIcon : ChevronDownIcon
    return <Icon width={12} height={12} style={{ marginLeft: 4, opacity: 0.6 }} />
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={col.sortable !== false ? () => handleSort(col.key) : undefined}
                style={{
                  cursor: col.sortable !== false ? 'pointer' : 'default',
                  textAlign: col.align || 'left',
                  userSelect: 'none',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {col.label}
                  {col.sortable !== false && <SortIcon colKey={col.key} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={() => onRowClick?.(row)}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map(col => (
                <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
