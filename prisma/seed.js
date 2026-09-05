const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial system users...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const defaultUsers = [
    {
      name: 'Anjali Sharma (ASHA Worker)',
      email: 'asha@phc.in',
      password: hashedPassword,
      role: 'ASHA',
    },
    {
      name: 'Dr. Rajesh Kumar (PHC Medical Officer)',
      email: 'doctor@phc.in',
      password: hashedPassword,
      role: 'PHC_DOCTOR',
    },
    {
      name: 'System Administrator',
      email: 'admin@phc.in',
      password: hashedPassword,
      role: 'ADMIN',
    },
  ];

  for (const user of defaultUsers) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (!existing) {
      const created = await prisma.user.create({ data: user });
      console.log(`Created ${user.role} user: ${created.email} (${created.id})`);
    } else {
      console.log(`User already exists: ${user.email}`);
    }
  }

  console.log('Database seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
