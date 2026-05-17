import type { NextApiRequest, NextApiResponse } from 'next';
import { listUsers, DEFAULT_USER_ID } from '@/server/db';
import { LeaderboardData, LeaderboardEntry, BarrioRankEntry } from '@/types';

const AVATAR_COLORS = [
  '#005A9C', '#2E8B57', '#E07A2C', '#8C5A2B',
  '#A4243B', '#1F6FB2', '#607D8B', '#6A1B9A',
  '#00838F', '#2E7D32',
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) & 0xFFFFFF;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const users = await listUsers(); // sorted by points DESC

  // Build ranked entries
  const entries: LeaderboardEntry[] = users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    name: u.displayName,
    barrio: u.barrio || 'Sin barrio',
    pts: u.points,
    initials: initials(u.displayName),
    avatar: avatarColor(u.displayName),
    isMe: u.id === DEFAULT_USER_ID,
    delta: 0,
  }));

  // Barrio aggregation
  const barrioMap = new Map<string, { pts: number; members: number }>();
  for (const u of users) {
    const b = u.barrio || 'Sin barrio';
    const cur = barrioMap.get(b) ?? { pts: 0, members: 0 };
    barrioMap.set(b, { pts: cur.pts + u.points, members: cur.members + 1 });
  }
  const barrios: BarrioRankEntry[] = [...barrioMap.entries()]
    .map(([name, v]) => ({ name, pts: v.pts, members: v.members }))
    .sort((a, b) => b.pts - a.pts);

  const myEntry = entries.find(e => e.isMe);

  const data: LeaderboardData = {
    entries,
    barrios,
    myBarrio: myEntry?.barrio ?? 'Centro',
    myRank: myEntry?.rank ?? entries.length,
    myPts: myEntry?.pts ?? 0,
  };

  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
  return res.status(200).json(data);
}
