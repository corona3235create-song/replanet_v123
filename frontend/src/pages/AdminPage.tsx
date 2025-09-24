import React, { useState, useEffect } from 'react';

interface User {
  user_id: number;
  username: string;
  email: string;
  role: string;
}

interface AddPointsRequest {
  user_id: string; // 백엔드에서 int로 변환
  points: number;
  reason: string;
}

interface MobilityLogCreate {
  user_id: number;
  mode: string;
  distance_km: number;
  started_at: string;
  ended_at: string;
  description?: string;
  start_point?: string;
  end_point?: string;
}

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  // Grant Points State
  const [grantPointsForm, setGrantPointsForm] = useState<AddPointsRequest>({
    user_id: '',
    points: 0,
    reason: '',
  });

  // Add Mobility Log State
  const [mobilityLogForm, setMobilityLogForm] = useState<MobilityLogCreate>({
    user_id: 0,
    mode: 'WALK',
    distance_km: 0,
    started_at: new Date().toISOString().slice(0, 16),
    ended_at: new Date().toISOString().slice(0, 16),
    description: '',
    start_point: '',
    end_point: '',
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data: User[] = await response.json();
      setUsers(data);
      if (data.length > 0) {
        setGrantPointsForm(prev => ({ ...prev, user_id: data[0].user_id.toString() }));
        setMobilityLogForm(prev => ({ ...prev, user_id: data[0].user_id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [API_URL]);

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm(`Are you sure you want to delete user with ID: ${userId}?`)) {
      return;
    }
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete user');
      }
      alert(`User ${userId} deleted successfully!`);
      fetchUsers(); // Refresh the user list
    } catch (err) {
      alert(`Error deleting user: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleGrantPointsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGrantPointsForm(prev => ({
      ...prev,
      [name]: name === 'points' ? parseInt(value) : value,
    }));
  };

  const handleSubmitGrantPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/admin/grant-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grantPointsForm),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to grant points');
      }
      alert('Points granted successfully!');
      // Optionally refresh user list or credits display
    } catch (err) {
      alert(`Error granting points: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleMobilityLogChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMobilityLogForm(prev => ({
      ...prev,
      [name]: name === 'distance_km' ? parseFloat(value) : (name === 'user_id' ? parseInt(value) : value),
    }));
  };

  const handleSubmitAddMobilityLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/admin/add-mobility-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mobilityLogForm),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add mobility log');
      }
      alert('Mobility log added successfully!');
      // Optionally refresh user list or credits display
    } catch (err) {
      alert(`Error adding mobility log: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading users...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Dashboard</h1>
      
      <h2>Users</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Username</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Email</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Role</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.user_id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.user_id}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.username}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.email}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.role}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                <button 
                  onClick={() => handleDeleteUser(user.user_id)} 
                  style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Grant Points</h2>
      <form onSubmit={handleSubmitGrantPoints} style={{ marginBottom: '40px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>User:</label>
          <select 
            name="user_id" 
            value={grantPointsForm.user_id} 
            onChange={handleGrantPointsChange} 
            style={{ width: '100%', padding: '8px' }}
          >
            {users.map(user => (
              <option key={user.user_id} value={user.user_id.toString()}>
                {user.username} (ID: {user.user_id})
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Points:</label>
          <input 
            type="number" 
            name="points" 
            value={grantPointsForm.points} 
            onChange={handleGrantPointsChange} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Reason:</label>
          <input 
            type="text" 
            name="reason" 
            value={grantPointsForm.reason} 
            onChange={handleGrantPointsChange} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Grant Points
        </button>
      </form>

      <h2>Add Mobility Log</h2>
      <form onSubmit={handleSubmitAddMobilityLog} style={{ marginBottom: '40px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>User:</label>
          <select 
            name="user_id" 
            value={mobilityLogForm.user_id} 
            onChange={handleMobilityLogChange} 
            style={{ width: '100%', padding: '8px' }}
          >
            {users.map(user => (
              <option key={user.user_id} value={user.user_id}>
                {user.username} (ID: {user.user_id})
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Mode:</label>
          <select 
            name="mode" 
            value={mobilityLogForm.mode} 
            onChange={handleMobilityLogChange} 
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="WALK">Walk</option>
            <option value="BIKE">Bike</option>
            <option value="BUS">Bus</option>
            <option value="SUBWAY">Subway</option>
            <option value="CAR">Car</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Distance (km):</label>
          <input 
            type="number" 
            name="distance_km" 
            value={mobilityLogForm.distance_km} 
            onChange={handleMobilityLogChange} 
            required 
            step="0.1" 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Started At:</label>
          <input 
            type="datetime-local" 
            name="started_at" 
            value={mobilityLogForm.started_at} 
            onChange={handleMobilityLogChange} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Ended At:</label>
          <input 
            type="datetime-local" 
            name="ended_at" 
            value={mobilityLogForm.ended_at} 
            onChange={handleMobilityLogChange} 
            required 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Description (Optional):</label>
          <input 
            type="text" 
            name="description" 
            value={mobilityLogForm.description} 
            onChange={handleMobilityLogChange} 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Start Point (Optional):</label>
          <input 
            type="text" 
            name="start_point" 
            value={mobilityLogForm.start_point} 
            onChange={handleMobilityLogChange} 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>End Point (Optional):</label>
          <input 
            type="text" 
            name="end_point" 
            value={mobilityLogForm.end_point} 
            onChange={handleMobilityLogChange} 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Add Mobility Log
        </button>
      </form>
    </div>
  );
};

export default AdminPage;
