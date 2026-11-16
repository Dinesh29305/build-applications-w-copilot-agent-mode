import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Team {
  _id?: string;
  name: string;
  mascot: string;
  members?: string[];
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getJson<{ teams: Team[] }>('/api/teams');
        setTeams(data.teams);
      } catch (err) {
        setError('Unable to load teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p role="status">Loading teams...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p role="alert">{error}</p>
        </div>
      </section>
    );
  }

  if (teams.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p>No teams created yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <div className="table-responsive">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Mascot</th>
                <th>Members</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr key={team._id || index}>
                  <td>{team.name}</td>
                  <td>{team.mascot}</td>
                  <td>{team.members?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
