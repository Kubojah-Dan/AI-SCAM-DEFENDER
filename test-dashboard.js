// Test dashboard API with authentication
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc3MTY4MTg0NSwianRpIjoiMDBiYTliZDgtYzE4OC00OGU2LWFhYzMtYmQwNjg4NTE2Y2YyIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjIiLCJuYmYiOjE3NzE2ODE4NDUsImNzcmYiOiIyMTA4NTMwYy00NWUyLTQyNGMtYWUyNy1kNTMwY2NjMDAwODkiLCJleHAiOjE3NzE2ODI3NDV9.yjNH59J5MjUr7YkKft8cHBPoTvm1BXWh3hJ0TWq1BV8';

fetch('http://localhost:5000/api/dashboard/summary', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => console.log('Dashboard API Response:', data))
.catch(error => console.error('Dashboard API Error:', error));
