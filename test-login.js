// Test login to get token
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'test123456'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Login:', data);
  if (data.access_token) {
    console.log('Token:', data.access_token);
    localStorage.setItem('scam_defender_token', data.access_token);
    localStorage.setItem('scam_defender_user', JSON.stringify(data.user));
  }
})
.catch(error => console.error('Login Error:', error));
