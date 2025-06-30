export interface User {
  id: number;
  name: string;
  email: string;
  healthScore: number;
  userFavMetric1: number;
  userFavMetric2: number;
}

export async function fetchUsers(): Promise<User[]> {
  try {
    const res = await fetch('/api/users');

    if (!res.ok) {
      throw new Error(`Failed to fetch users: ${res.statusText}`);
    }

    const data = await res.json();
    return data as User[];
  } catch (err) {
    console.error('[fetchUsers] Error:', err);
    return []; // Return empty list on failure
  }
}
