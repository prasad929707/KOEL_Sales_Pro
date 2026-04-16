export default function Badge({ type = 'teal', children, className = '' }) {
  return (
    <span className={`badge badge--${type} ${className}`}>
      {children}
    </span>
  )
}
