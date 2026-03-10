import EmptyState from './EmptyState'
import Skeleton from './Skeleton'

// Props: columns=[{key, label, render}], data=[], loading=false, onRowClick, emptyMessage='Sin datos'
export default function DataTable({ columns = [], data = [], loading = false, onRowClick, emptyMessage = 'Sin datos' }) {
  if (loading) return (
    <div style={{ padding: '1rem' }}>
      <Skeleton height="2rem" count={5} />
    </div>
  )

  if (!data.length) return (
    <EmptyState icon="📋" title={emptyMessage} />
  )

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map(col => <th key={col.key}>{col.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={() => onRowClick?.(row)}
              style={onRowClick ? { cursor: 'pointer' } : {}}
            >
              {columns.map(col => (
                <td key={col.key}>
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
