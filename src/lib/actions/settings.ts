'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function togglePremiumMode(currentState: boolean) {
  try {
    const newValue = (!currentState).toString();

    await prisma.systemConfig.upsert({
      where: { key: 'PREMIUM_ACTIVE' },
      update: { value: newValue },
      create: {
        key: 'PREMIUM_ACTIVE',
        value: newValue,
        description: 'Enable to lock premium apps and require subscription'
      }
    });

    revalidatePath('/settings');

    return { success: true, value: !currentState };
  } catch (error) {
    console.error('Failed to toggle premium mode:', error);
    return { success: false, error: 'Failed to update premium mode' };
  }
}

export async function getPremiumModeStatus(): Promise<boolean> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'PREMIUM_ACTIVE' }
    });

    return config?.value === 'true';
  } catch (error) {
    console.error('Failed to get premium mode status:', error);
    return false;
  }
}
