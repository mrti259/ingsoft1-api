import type { VercelRequest, VercelResponse } from '@vercel/node';

import { api } from '../app/api';

export default async function (req: VercelRequest, res: VercelResponse) {
    const response = await api.sendMailNotaExamenHandler({ ...req.body });
    res.status(response.code).send(response.message);
}
