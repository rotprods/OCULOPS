/**
 * Badge — Small status or label indicator.
 *
 * @param {React.ReactNode} children - Badge content
 * @param {'default'|'primary'|'success'|'warning'|'danger'|'info'} variant
 * @param {'sm'|'md'} size
 */
export default function Badge({ children, variant = 'default', size = 'sm' }) {
  return <span className={`badge badge-${variant} badge-${size}`}>{children}</span>
}
