// src/components/MovieCard.jsx
import { useNavigate } from 'react-router-dom';

export default function MovieCard({ movie }) {
  const navigate = useNavigate();
  const badge = movie.type === 'tv' ? 'badge-tv' : 'badge-movie';
  const label = movie.type === 'tv' ? 'TV' : 'Film';

  return (
    <div className="movie-card" onClick={() => navigate(`/movies/${movie.id}`)}>
      <img src={movie.poster} alt={movie.title} loading="lazy" />
      <div className="movie-card-badge-tl">
        <span className={`badge ${badge}`}>{label}</span>
      </div>
      <div className="movie-card-rating">
        <svg viewBox="0 0 24 24" width="10" height="10">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" />
        </svg>
        {movie.rating}
      </div>
      <div className="movie-card-overlay">
        <div className="movie-card-title">{movie.title}</div>
        <div className="movie-card-year">{movie.year}</div>
        <div className="movie-card-critics">{movie.critics}% Fresh</div>
      </div>
    </div>
  );
}
