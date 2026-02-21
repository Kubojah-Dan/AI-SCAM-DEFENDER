// Create test user via fetch
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'test123456',
    full_name: 'Test User'
  })
})
.then(response => response.json())
.then(data => console.log('Registration:', data))
.catch(error => console.error('Registration Error:', error));
