// Props: width='100%', height='1rem', borderRadius='4px', count=1
export default function Skeleton({ width = '100%', height = '1rem', borderRadius = '4px', count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ width, height, borderRadius, marginBottom: count > 1 ? '0.5rem' : 0 }}
        />
      ))}
    </>
  )
}
