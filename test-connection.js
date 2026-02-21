// Test API connection
fetch('http://localhost:5000/api/test')
  .then(response => response.json())
  .then(data => console.log('API Response:', data))
  .catch(error => console.error('API Error:', error));
