import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // ============================================
  // Seed ScreenTypes
  // ============================================
  const screenTypes = [
    'Login',
    'Register',
    'Onboarding',
    'Home',
    'Profile',
    'Settings',
    'Checkout',
    'Search',
    'Detail',
  ];

  console.log('Seeding ScreenTypes...');

  for (const name of screenTypes) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    await prisma.screenType.upsert({
      where: { name },
      update: { slug },
      create: { name, slug },
    });
    console.log(`✓ Upserted ScreenType: ${name}`);
  }

  console.log('✅ Finished seeding ScreenTypes!\n');

  // ============================================
  // Seed UIElements
  // ============================================
  const uiElements = [
    'Button',
    'Input',
    'Modal',
    'Tab Bar',
    'Bottom Navigation',
    'Card',
    'List',
    'Toggle',
    'Checkbox',
    'Radio',
    'Tooltip',
    'Notification',
  ];

  console.log('Seeding UIElements...');

  for (const name of uiElements) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    await prisma.uIElement.upsert({
      where: { name },
      update: { slug },
      create: { name, slug },
    });
    console.log(`✓ Upserted UIElement: ${name}`);
  }

  console.log('✅ Finished seeding UIElements!\n');

  // ============================================
  // Seed User Flows
  // ============================================
  // Standard User Flows to seed
  const flows = [
    {
      name: 'Onboarding',
      slug: 'onboarding',
      sortOrder: 10,
      description: 'User onboarding and first-time experience flows'
    },
    {
      name: 'Authentication',
      slug: 'authentication',
      sortOrder: 20,
      description: 'Login, signup, and authentication screens'
    },
    {
      name: 'OTP Verification',
      slug: 'otp',
      sortOrder: 25,
      description: 'OTP and verification code entry screens'
    },
    {
      name: 'Home',
      slug: 'home',
      sortOrder: 30,
      description: 'Main home screen and dashboard views'
    },
    {
      name: 'Search',
      slug: 'search',
      sortOrder: 40,
      description: 'Search functionality and results screens'
    },
    {
      name: 'Order Tracking',
      slug: 'tracking',
      sortOrder: 70,
      description: 'Order status and tracking screens'
    },
    {
      name: 'Payment',
      slug: 'qr-scan',
      sortOrder: 80,
      description: 'Payment and QR code scanning screens'
    },
    {
      name: 'eKYC & Verification',
      slug: 'ekyc',
      sortOrder: 90,
      description: 'Electronic Know Your Customer and identity verification'
    },
    {
      name: 'Loyalty',
      slug: 'loyalty',
      sortOrder: 100,
      description: 'Loyalty programs and rewards screens'
    },
    {
      name: 'Profile',
      slug: 'profile',
      sortOrder: 110,
      description: 'User profile and settings screens'
    }
  ];

  console.log('Seeding standard User Flows...');

  // Loop through flows and upsert them
  for (const flow of flows) {
    // Check if flow exists by name
    const existingFlow = await prisma.flow.findFirst({
      where: { name: flow.name }
    });

    if (existingFlow) {
      // Update existing flow
      await prisma.flow.update({
        where: { id: existingFlow.id },
        data: {
          description: flow.description,
          sortOrder: flow.sortOrder
        }
      });
      console.log(`✓ Updated flow: ${flow.name}`);
    } else {
      // Create new flow
      await prisma.flow.create({
        data: {
          name: flow.name,
          description: flow.description,
          sortOrder: flow.sortOrder
        }
      });
      console.log(`✓ Created flow: ${flow.name}`);
    }
  }

  console.log('✅ Finished seeding User Flows!\n');

  // ============================================
  // Create default AppVersions for all apps
  // ============================================
  console.log('Creating default AppVersions for all apps...');

  const allApps = await prisma.app.findMany();
  
  for (const app of allApps) {
    // Check if app already has a default version
    const existingDefaultVersion = await prisma.appVersion.findFirst({
      where: {
        appId: app.id,
        name: 'v1.0'
      }
    });

    if (!existingDefaultVersion) {
      // Create default version
      await prisma.appVersion.create({
        data: {
          name: 'v1.0',
          appId: app.id
        }
      });
      console.log(`✓ Created default version v1.0 for app: ${app.name}`);
    } else {
      console.log(`✓ App "${app.name}" already has default version v1.0`);
    }
  }

  console.log('✅ Finished creating default AppVersions!\n');

  // ============================================
  // Link existing screens to default versions
  // ============================================
  console.log('Linking existing screens to default AppVersions...');

  // Get all apps with their default versions
  const appsWithVersions = await prisma.app.findMany({
    include: {
      versions: {
        where: {
          name: 'v1.0'
        },
        take: 1
      }
    }
  });

  let totalLinked = 0;
  for (const app of appsWithVersions) {
    const defaultVersion = app.versions[0];
    if (!defaultVersion) continue;

    // Find all screens for this app that don't have an appVersionId
    const screensWithoutVersion = await prisma.screen.findMany({
      where: {
        appId: app.id,
        appVersionId: null
      }
    });

    // Update screens to link to default version
    if (screensWithoutVersion.length > 0) {
      await prisma.screen.updateMany({
        where: {
          appId: app.id,
          appVersionId: null
        },
        data: {
          appVersionId: defaultVersion.id
        }
      });
      totalLinked += screensWithoutVersion.length;
      console.log(`✓ Linked ${screensWithoutVersion.length} screen(s) to v1.0 for app: ${app.name}`);
    }
  }

  console.log(`✓ Total ${totalLinked} screens linked to default versions`);
  console.log('✅ Finished linking screens to AppVersions!\n');

  // ============================================
  // Update Screen order values
  // ============================================
  console.log('Updating Screen order values...');

  // Group screens by flowId and appId to assign incremental order values
  // First, get all screens grouped by their flow (or app if no flow)
  const allScreens = await prisma.screen.findMany({
    orderBy: [
      { flowId: 'asc' },
      { appId: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  // Group screens by flowId (use appId as fallback if flowId is null)
  const screensByGroup = new Map<string, typeof allScreens>();
  
  for (const screen of allScreens) {
    const groupKey = screen.flowId || `app_${screen.appId}`;
    if (!screensByGroup.has(groupKey)) {
      screensByGroup.set(groupKey, []);
    }
    screensByGroup.get(groupKey)!.push(screen);
  }

  // Update each screen with incremental order values
  let totalUpdated = 0;
  for (const [groupKey, screens] of screensByGroup.entries()) {
    for (let i = 0; i < screens.length; i++) {
      await prisma.screen.update({
        where: { id: screens[i].id },
        data: { order: i }
      });
      totalUpdated++;
    }
  }

  console.log(`✓ Updated ${totalUpdated} screens with incremental order values`);
  console.log('✅ Finished updating Screen order values!\n');

  console.log('🎉 Seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
