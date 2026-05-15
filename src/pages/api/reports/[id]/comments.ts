import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { getReport, listComments, insertComment } from '@/server/db';
import { Comment, Role } from '@/types';

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
    const body = req.body ?? {};
    const { text, authorRole } = body;
    if (
      typeof text !== 'string' ||
      text.trim() === '' ||
      !ROLES.includes(authorRole)
    ) {
      return res.status(400).json({ error: 'Comentario no válido' });
    }
    const comment: Comment = {
      id: randomUUID(),
      reportId: id,
      authorRole: authorRole as Role,
      text: text.trim(),
      createdAt: Date.now(),
    };
    insertComment(comment);
    return res.status(201).json(comment);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
