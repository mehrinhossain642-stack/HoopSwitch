const API_URL = 'http://localhost:3001';

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user: {
        email,
        password,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const authorization = response.headers.get('Authorization');

  if (!authorization) {
    throw new Error('No Authorization header returned');
  }

  return authorization;
}
export async function getProfile(token: string) {
  const response = await fetch(`${API_URL}/profile`, {
    method: 'GET',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Profile request failed: ${response.status}`);
  }

  return response.json();
}