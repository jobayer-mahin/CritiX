// src/components/Skeleton.jsx — Loading placeholder components

const shimmer = {
  background: 'linear-gradient(90deg, var(--bg-elevated) 25%, rgba(255,255,255,.06) 50%, var(--bg-elevated) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 'var(--radius-md)',
};

export function SkeletonBlock({ width = '100%', height = 16, radius, style = {} }) {
  return (
    <div style={{ ...shimmer, width, height, borderRadius: radius ?? 'var(--radius-md)', flexShrink: 0, ...style }} />
  );
}

export function MovieCardSkeleton() {
  return (
    <div style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-lg)', overflow: 'hidden', ...shimmer }} />
  );
}

export function MovieGridSkeleton({ count = 6 }) {
  return (
    <div className="movies-grid">
      {Array.from({ length: count }, (_, i) => <MovieCardSkeleton key={i} />)}
    </div>
  );
}

export function ReviewCardSkeleton() {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <SkeletonBlock width={52} height={74} radius="var(--radius-sm)" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <SkeletonBlock height={18} width="70%" />
          <SkeletonBlock height={12} width="40%" />
          <SkeletonBlock height={12} width="50%" />
        </div>
      </div>
      <SkeletonBlock height={12} style={{ marginBottom: 'var(--space-2)' }} />
      <SkeletonBlock height={12} width="85%" style={{ marginBottom: 'var(--space-2)' }} />
      <SkeletonBlock height={12} width="60%" />
    </div>
  );
}

export function ReviewGridSkeleton({ count = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
      {Array.from({ length: count }, (_, i) => <ReviewCardSkeleton key={i} />)}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div style={{ height: 500, borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-10)', ...shimmer }} />
  );
}

export function MovieDetailSkeleton() {
  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) + var(--space-8))' }}>
      <div style={{ height: 480, ...shimmer }} />
      <div className="container" style={{ marginTop: -160, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-8)', maxWidth: 640 }}>
          <SkeletonBlock height={14} width="30%" />
          <SkeletonBlock height={48} width="70%" />
          <SkeletonBlock height={14} width="40%" />
          <SkeletonBlock height={14} />
          <SkeletonBlock height={14} width="90%" />
          <SkeletonBlock height={14} width="75%" />
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <SkeletonBlock width={140} height={44} radius="var(--radius-md)" />
            <SkeletonBlock width={160} height={44} radius="var(--radius-md)" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Global shimmer keyframe (injected once)
const styleTag = document.createElement('style');
styleTag.textContent = `@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
document.head.appendChild(styleTag);
