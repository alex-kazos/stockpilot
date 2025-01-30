import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function addToWaitlist(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Add email to waitlist
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        email,
        plan: 'GROWTH',
        signupDate: new Date(),
      },
    });

    return res.status(200).json({ success: true, data: waitlistEntry });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return res.status(500).json({ error: 'Failed to add to waitlist' });
  }
}
