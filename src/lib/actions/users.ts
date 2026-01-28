'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function grantPremiumAction(userId: string) {
  try {
    // Calculate 30 days from now
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'PREMIUM',
        subscriptionEndDate
      }
    });

    revalidatePath('/users');

    return { success: true };
  } catch (error) {
    console.error('Failed to grant premium:', error);
    return { success: false, error: 'Failed to grant premium to user' };
  }
}

export async function revokePremiumAction(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'FREE',
        subscriptionEndDate: null
      }
    });

    revalidatePath('/users');

    return { success: true };
  } catch (error) {
    console.error('Failed to revoke premium:', error);
    return { success: false, error: 'Failed to revoke premium from user' };
  }
}

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        createdAt: true
      }
    });

    return { success: true, data: users };
  } catch (error) {
    console.error('Failed to get users:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}
