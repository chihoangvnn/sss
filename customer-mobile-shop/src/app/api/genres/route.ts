import { NextResponse } from 'next/server';

const demoGenres = [
  { id: 'all', name: 'All Books', icon: '📚' },
  { id: 'business', name: 'Business & Economics', icon: '📈' },
  { id: 'science', name: 'Science & Technology', icon: '🔬' },
  { id: 'psychology', name: 'Self-Help & Personal Development', icon: '🧠' }
];

export async function GET() {
  try {
    return NextResponse.json(demoGenres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    return NextResponse.json({ message: 'Failed to fetch genres' }, { status: 500 });
  }
}