
export function Skeleton({ width = '100%', height = 16, radius = 8, style }) {
  return (
    <span
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  )
}

export function SummarySkeleton() {
  return (
    <div className="summary-grid">
      <div className="summary-card summary-card-hero skeleton-card">
        <Skeleton width="45%" height={13} />
        <Skeleton width="70%" height={38} style={{ marginTop: 14 }} />
        <Skeleton width="55%" height={13} style={{ marginTop: 16 }} />
      </div>
      {[0, 1].map((index) => (
        <div key={index} className="summary-card summary-card-plain">
          <Skeleton width={38} height={38} radius={10} />
          <Skeleton width="55%" height={12} style={{ marginTop: 14 }} />
          <Skeleton width="72%" height={28} style={{ marginTop: 10 }} />
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, index) => (
        <div className="txn-row" key={index}>
          <Skeleton width={40} height={40} radius={11} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Skeleton width={`${45 + ((index * 13) % 35)}%`} height={13} />
            <Skeleton width="32%" height={11} style={{ marginTop: 8 }} />
          </div>
          <Skeleton width={74} height={15} />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = 240 }) {
  return <Skeleton width="100%" height={height} radius={14} />
}

export function TileSkeleton({ count = 3 }) {
  return (
    <div className="stat-tile-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div className="card stat-tile" key={index}>
          <Skeleton width="55%" height={12} />
          <Skeleton width="72%" height={24} style={{ marginTop: 12 }} />
        </div>
      ))}
    </div>
  )
}