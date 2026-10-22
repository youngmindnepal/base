// prisma/seed.js
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// ────────────────────────────────────────────────────────────
// Environment check
// ────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log('🔌 Connecting to database...');
console.log(
  'Database URL format check:',
  process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@')
);

// ────────────────────────────────────────────────────────────
// Postgres pool + Prisma adapter
// ────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('❌ Unexpected pool error:', err);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ['error'] });

// ────────────────────────────────────────────────────────────
// Seed data
// ────────────────────────────────────────────────────────────
const PERMISSIONS = [
  // User Management
  {
    name: 'CREATE_USER',
    description: 'Can create new users',
    module: 'USER_MANAGEMENT',
    action: 'CREATE',
  },
  {
    name: 'READ_USER',
    description: 'Can view users',
    module: 'USER_MANAGEMENT',
    action: 'READ',
  },
  {
    name: 'UPDATE_USER',
    description: 'Can update users',
    module: 'USER_MANAGEMENT',
    action: 'UPDATE',
  },
  {
    name: 'DELETE_USER',
    description: 'Can delete users',
    module: 'USER_MANAGEMENT',
    action: 'DELETE',
  },
  // Role Management
  {
    name: 'MANAGE_ROLES',
    description: 'Can manage roles and permissions',
    module: 'ROLE_MANAGEMENT',
    action: 'UPDATE',
  },
  // Dashboard
  {
    name: 'VIEW_DASHBOARD',
    description: 'Can view dashboard',
    module: 'DASHBOARD',
    action: 'READ',
  },
  // Profile
  {
    name: 'UPDATE_PROFILE',
    description: 'Can update own profile',
    module: 'PROFILE_MANAGEMENT',
    action: 'UPDATE',
  },
  // Settings
  {
    name: 'MANAGE_SETTINGS',
    description: 'Can manage system settings',
    module: 'SETTINGS',
    action: 'UPDATE',
  },
];

const ROLES = [
  {
    key: 'systemAdmin',
    name: 'System Administrator',
    description: 'Full system access with all permissions',
    permissions: PERMISSIONS.map((p) => p.name),
  },
  {
    key: 'admin',
    name: 'Administrator',
    description: 'Administrative access with most permissions',
    permissions: PERMISSIONS.map((p) => p.name).filter(
      (n) => n !== 'MANAGE_ROLES'
    ),
  },
  {
    key: 'manager',
    name: 'Manager',
    description: 'Manager with limited administrative access',
    permissions: [
      'READ_USER',
      'UPDATE_USER',
      'VIEW_DASHBOARD',
      'UPDATE_PROFILE',
    ],
  },
  {
    key: 'user',
    name: 'User',
    description: 'Regular user with basic access',
    permissions: ['VIEW_DASHBOARD', 'UPDATE_PROFILE'],
  },
  {
    key: 'viewer',
    name: 'Viewer',
    description: 'Read-only access',
    permissions: ['READ_USER', 'VIEW_DASHBOARD'],
  },
];

const USERS = [
  {
    email: 'admin@example.com',
    firstName: 'System',
    lastName: 'Admin',
    phone: '+1234567890',
    address: '123 Admin St, City',
    status: 'ACTIVE',
    mustChangePassword: false,
    roleKey: 'systemAdmin',
  },
  {
    email: 'director@example.com',
    firstName: 'Director',
    lastName: 'Admin',
    phone: '+1234567891',
    address: '456 Director Ave, City',
    status: 'ACTIVE',
    mustChangePassword: false,
    roleKey: 'admin',
  },
  {
    email: 'manager@example.com',
    firstName: 'John',
    lastName: 'Manager',
    phone: '+1234567892',
    address: '789 Manager Blvd, City',
    status: 'ACTIVE',
    mustChangePassword: true,
    roleKey: 'manager',
  },
  {
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567893',
    address: '321 User St, City',
    status: 'ACTIVE',
    mustChangePassword: true,
    roleKey: 'user',
  },
  {
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+1234567894',
    address: '654 User Ave, City',
    status: 'ACTIVE',
    mustChangePassword: true,
    roleKey: 'user',
  },
  {
    email: 'viewer@example.com',
    firstName: 'View',
    lastName: 'Only',
    phone: '+1234567895',
    address: '987 Viewer Rd, City',
    status: 'ACTIVE',
    mustChangePassword: true,
    roleKey: 'viewer',
  },
  {
    email: 'inactive@example.com',
    firstName: 'Inactive',
    lastName: 'User',
    phone: '+1234567896',
    status: 'INACTIVE',
    mustChangePassword: true,
    roleKey: 'user',
  },
  {
    email: 'suspended@example.com',
    firstName: 'Suspended',
    lastName: 'User',
    phone: '+1234567897',
    status: 'SUSPENDED',
    mustChangePassword: true,
    roleKey: 'user',
  },
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW() as now');
    console.log('✓ Database connection successful at:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// ────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting seeding...\n');

  const isConnected = await testConnection();
  if (!isConnected)
    throw new Error('Cannot proceed without database connection');

  // Clean (order matters due to FKs)
  console.log('🧹 Cleaning existing data...');
  try {
    await prisma.userPermissionOverride.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
    console.log('✓ Cleaned existing data\n');
  } catch (error) {
    console.log('⚠ Note: Some tables may not exist yet, continuing...\n');
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ── 1. Permissions ───────────────────────────────────────
  console.log('📝 Creating permissions...');
  const permissionsByName = new Map();
  for (const perm of PERMISSIONS) {
    const created = await prisma.permission.create({ data: perm });
    permissionsByName.set(created.name, created);
  }
  console.log(`✓ Created ${permissionsByName.size} permissions\n`);

  // ── 2. Roles ─────────────────────────────────────────────
  console.log('👥 Creating roles...');
  const rolesByKey = new Map();
  for (const roleSeed of ROLES) {
    const created = await prisma.role.create({
      data: { name: roleSeed.name, description: roleSeed.description },
    });
    rolesByKey.set(roleSeed.key, created);
  }
  console.log(`✓ Created ${rolesByKey.size} roles\n`);

  // ── 3. Role → Permission assignments ─────────────────────
  console.log('🔗 Assigning permissions to roles...');
  for (const roleSeed of ROLES) {
    const role = rolesByKey.get(roleSeed.key);
    for (const permName of roleSeed.permissions) {
      const perm = permissionsByName.get(permName);
      if (!perm) {
        console.warn(`  ⚠ Skipping unknown permission: ${permName}`);
        continue;
      }
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: perm.id },
      });
    }
    console.log(`  ✓ ${role.name}: ${roleSeed.permissions.length} permissions`);
  }
  console.log('✓ Assigned permissions to roles\n');

  // ── 4. Users + role assignments (via UserRole) ───────────
  console.log('👤 Creating users...');
  const createdUsers = [];

  for (const userSeed of USERS) {
    const role = rolesByKey.get(userSeed.roleKey);
    if (!role) {
      console.error(
        `  ✗ Unknown role key "${userSeed.roleKey}" for ${userSeed.email}`
      );
      continue;
    }

    try {
      const user = await prisma.user.create({
        data: {
          email: userSeed.email,
          password: hashedPassword,
          firstName: userSeed.firstName,
          lastName: userSeed.lastName,
          phone: userSeed.phone,
          address: userSeed.address,
          status: userSeed.status,
          mustChangePassword: userSeed.mustChangePassword,
          lastLogin: userSeed.status === 'ACTIVE' ? new Date() : null,
        },
      });

      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          scopeType: 'GLOBAL',
          scopeId: null,
        },
      });

      createdUsers.push({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        roleName: role.name,
      });

      console.log(`  ✓ ${user.email} → ${role.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to create ${userSeed.email}:`, error.message);
    }
  }

  console.log(`\n✓ Created ${createdUsers.length} users\n`);

  // ── 5. Summary ───────────────────────────────────────────
  console.log('🎉 Seeding completed successfully!\n');
  console.log('📧 Test Accounts (Password: password123):');
  console.log('─'.repeat(74));

  for (const user of createdUsers) {
    const statusIcon =
      user.status === 'ACTIVE'
        ? '✅'
        : user.status === 'INACTIVE'
        ? '⏸️ '
        : '🚫';
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    console.log(
      `${statusIcon} ${user.email.padEnd(28)} | ${user.roleName.padEnd(
        22
      )} | ${fullName}`
    );
  }

  console.log('─'.repeat(74));
  console.log('\n📋 Role Summary:');
  for (const role of ROLES) {
    console.log(`  • ${role.name}: ${role.description}`);
  }
  console.log(
    '\n💡 Note: Users with mustChangePassword=true will be prompted to change password on first login.'
  );
}

// ────────────────────────────────────────────────────────────
// Run
// ────────────────────────────────────────────────────────────
main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
    console.log('\n✅ Database connection closed');
  })
  .catch(async (e) => {
    console.error('\n❌ Seeding failed:', e);
    console.error('\nDebug info:');
    console.error('- Check your .env has a valid DATABASE_URL');
    console.error('- Make sure Postgres/Supabase is running and reachable');
    console.error('- Verify your IP is allowed in Supabase settings');
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
