import type { NextApiRequest, NextApiResponse } from 'next';
import { getReport, listComments, insertComment } from '@/server/db';
import { Role } from '@/types';

const ROLES: Role[] = ['ciudadano', 'municipal'];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'ID no válido' });
  }

  if (req.method === 'GET') {
    return res.status(200).json(listComments(id));
  }

  if (req.method === 'POST') {
    if (!getReport(id)) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    const b = req.body ?? {};
    if (typeof b.text !== 'string' || b.text.trim() === '' || !ROLES.includes(b.authorRole)) {
      return res.status(400).json({ error: 'Comentario no válido' });
    }
    const comment = insertComment(id, b.authorRole as Role, b.text.trim());
    return res.status(201).json(comment);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
