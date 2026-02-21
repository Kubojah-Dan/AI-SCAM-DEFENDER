// Fix authentication issues
console.log('=== AUTHENTICATION DEBUG ===');
console.log('Current token:', localStorage.getItem('scam_defender_token'));
console.log('Current user:', localStorage.getItem('scam_defender_user'));

// Clear any existing authentication issues
localStorage.removeItem('scam_defender_token');
localStorage.removeItem('scam_defender_user');

// Set fresh authentication with test user
const testUser = {
  email: 'test@example.com',
  password: 'test123456',
  full_name: 'Debug User',
  id: 2
};

// Simulate successful login
localStorage.setItem('scam_defender_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc3MTY4MTg0NSwianRpIjoiZWE4YTk2NjAtMDg5NC00YTE4LTk0ZTctZTgxODM4YjE1NzcmYiOiIyMTA4NTMwYy00NWUyLTQyNGMtYWUyNy1kNTMwY2NjMDAwODkiLCJleHAiOjE3NzE2ODI3NDV9.yjNH59J5MjUr7YkKft8cHBPoTvm1BXWh3hJ0TWq1BV8');
localStorage.setItem('scam_defender_user', JSON.stringify(testUser));

console.log('✅ Fixed authentication with test user');
console.log('✅ Token stored:', localStorage.getItem('scam_defender_token'));
console.log('✅ User stored:', localStorage.getItem('scam_defender_user'));
console.log('=== REFRESH THE PAGE ===');

// Auto-refresh page after 2 seconds
setTimeout(() => {
  console.log('🔄 Refreshing page to apply fixes...');
  window.location.reload();
}, 2000);
