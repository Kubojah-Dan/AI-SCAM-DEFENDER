// Test API with debugging
console.log('Testing API connection...');
console.log('API_BASE:', import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api');

// Test without authentication (should fail)
fetch('http://localhost:5000/api/dashboard/summary')
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers]);
    return response.json();
  })
  .then(data => {
    console.log('Response data:', data);
  })
  .catch(error => {
    console.error('API Error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      type: error.name
    });
  });

// Test with authentication (should work if logged in)
const token = localStorage.getItem('scam_defender_token');
if (token) {
  console.log('Testing with token...');
  fetch('http://localhost:5000/api/dashboard/summary', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('Authenticated response:', data);
  })
  .catch(error => {
    console.error('Authenticated API Error:', error);
  });
}
