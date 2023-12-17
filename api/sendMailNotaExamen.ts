import type { VercelRequest, VercelResponse } from '@vercel/node';

import { sendMailNotaExamenHandler } from '../app/http';

export default async function (req: VercelRequest, res: VercelResponse) {
    const response = await sendMailNotaExamenHandler({ ...req.body });
    res.status(response.code).send(response.message);
}
