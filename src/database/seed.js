const pool = require('./connection');

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Sample user profiles
    const sampleProfiles = [
      {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-15',
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1985-03-22',
      },
      {
        firstName: 'Michael',
        lastName: 'Johnson',
        dateOfBirth: '1992-07-10',
      },
      {
        firstName: 'Sarah',
        lastName: 'Williams',
        dateOfBirth: '1988-11-05',
      },
      {
        firstName: 'David',
        lastName: 'Brown',
        dateOfBirth: '1995-09-18',
      },
    ];

    // Insert sample profiles
    for (const profile of sampleProfiles) {
      await pool.query(
        'INSERT INTO user_profiles (first_name, last_name, date_of_birth) VALUES ($1, $2, $3)',
        [profile.firstName, profile.lastName, profile.dateOfBirth]
      );
    }

    console.log(`Database seeded with ${sampleProfiles.length} sample profiles!`);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed(); 