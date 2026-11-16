import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Workout {
  title: string;
  focus: string;
  minutes: number;
  difficulty: string;
  reason: string;
}

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use mona@example.com as the hardcoded seeded user
        const data = await getJson<{ suggestions: Workout[] }>('/api/workouts/suggestions/mona%40example.com');
        setSuggestions(data.suggestions);
      } catch (err) {
        setError('Unable to load workout suggestions');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout Suggestions</h2>
          <p role="status">Loading suggestions...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout Suggestions</h2>
          <p role="alert">{error}</p>
        </div>
      </section>
    );
  }

  if (suggestions.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout Suggestions</h2>
          <p>No workout suggestions available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout Suggestions</h2>
        <div className="list-group">
          {suggestions.map((workout, index) => (
            <div key={index} className="list-group-item">
              <h5 className="mb-1">{workout.title}</h5>
              <p className="mb-1">
                <strong>Focus:</strong> {workout.focus} | <strong>Duration:</strong> {workout.minutes} min | <strong>Difficulty:</strong> {workout.difficulty}
              </p>
              <p className="mb-0 text-muted">{workout.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
