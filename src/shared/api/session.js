export async function requestSession(payload) {
  const options = payload ? {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  } : {};
  const response = await fetch('/api/session', options);
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error);
    if (response.status === 409) error.current = data.current;
    throw error;
  }
  return data;
}
