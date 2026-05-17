import type { NextApiRequest, NextApiResponse } from 'next';
import { getReport, listComments, insertComment } from '@/server/db';
import { Role } from '@/types';

const ROLES: Role[] = ['ciudadano', 'municipal'];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  handle(req, res).catch(err => {
    console.error('comments error:', err);
    res.status(500).json({ error: 'Error interno' });
  });
}

async function handle(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    res.status(400).json({ error: 'ID no válido' });
    return;
  }

  if (req.method === 'GET') {
    const comments = await listComments(id);
    res.status(200).json(comments);
    return;
  }

  if (req.method === 'POST') {
    const report = await getReport(id);
    if (!report) {
      res.status(404).json({ error: 'Reporte no encontrado' });
      return;
    }
    const b = req.body ?? {};
    if (typeof b.text !== 'string' || b.text.trim() === '' || !ROLES.includes(b.authorRole)) {
      res.status(400).json({ error: 'Comentario no válido' });
      return;
    }
    const comment = await insertComment(id, b.authorRole as Role, b.text.trim());
    res.status(201).json(comment);
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
