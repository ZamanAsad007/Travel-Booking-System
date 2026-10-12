import pg from 'pg';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';
import { config } from '../config/env.js';

const { Client } = pg;

export async function seedEngagementData() {
  console.log('[engagement-service] Starting customer review data seeding...');
  const engagementClient = await pool.connect();

  let catalogClient = null;
  try {
    // 1. Fetch flights and hotels from catalog_db to attach reviews to
    catalogClient = new Client({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: 'catalog_db',
    });

    let flights = [];
    let hotels = [];

    try {
      await catalogClient.connect();
      const flightsRes = await catalogClient.query(
        'SELECT id, flight_number, airline, origin, destination FROM flights'
      );
      flights = flightsRes.rows;

      const hotelsRes = await catalogClient.query('SELECT id, name, city FROM hotels');
      hotels = hotelsRes.rows;
    } catch (err) {
      console.warn(
        '[engagement-service] Direct catalog_db query failed, attempting HTTP fallback:',
        err.message
      );
      try {
        const catalogBase = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3002';
        const fRes = await fetch(`${catalogBase}/api/catalog/flights?limit=100`);
        const fJson = await fRes.json();
        flights = fJson.data?.flights || [];

        const hRes = await fetch(`${catalogBase}/api/catalog/hotels?limit=100`);
        const hJson = await hRes.json();
        hotels = hJson.data?.hotels || [];
      } catch (httpErr) {
        console.warn(
          '[engagement-service] HTTP fallback to catalog-service failed:',
          httpErr.message
        );
      }
    }

    if (flights.length === 0 && hotels.length === 0) {
      console.log(
        '[engagement-service] No catalog items found to seed reviews for. Skipping review seed.'
      );
      return;
    }

    await engagementClient.query('BEGIN');

    // Customer review templates
    const flightReviewTemplates = [
      {
        rating: 5,
        comment:
          'Outstanding journey! The flight departed exactly on time, legroom was generous, and flight attendants were extremely courteous.',
      },
      {
        rating: 5,
        comment:
          'Very comfortable cabin and smooth landing. Excellent entertainment system with plenty of latest movies.',
      },
      {
        rating: 4,
        comment:
          'Solid travel experience. Boarding was seamless and luggage handling was fast upon arrival.',
      },
      {
        rating: 5,
        comment:
          'Impeccable service and great food options for a long-haul flight. Will definitely fly with them again.',
      },
      {
        rating: 4,
        comment:
          'Good flight overall. Comfortable seats and attentive crew throughout the entire journey.',
      },
    ];

    const hotelReviewTemplates = [
      {
        rating: 5,
        comment:
          'Breathtaking property with world-class hospitality! The room was spotless, bed super comfortable, and views unforgettable.',
      },
      {
        rating: 5,
        comment:
          'Exceptional stay from check-in to checkout. Concierge gave fantastic dining recommendations.',
      },
      {
        rating: 4,
        comment:
          'Wonderful hotel in a prime location. Quiet rooms, luxurious amenities, and friendly staff.',
      },
      {
        rating: 5,
        comment:
          'Five-star experience in every detail. The morning breakfast buffet was exquisite and the spa was sublime.',
      },
      {
        rating: 4,
        comment:
          'Very pleasant and comfortable stay. Rooms are spacious and beautifully appointed.',
      },
    ];

    const reviewerNames = [
      'Emma Watson',
      'Liam Davis',
      'Sophia Chen',
      'David Miller',
      'Elena Rostova',
      'Kenji Sato',
      'Amara Patel',
      'Marcus Vance',
      'Chloe Dubois',
      'Lucas Moreau',
      'Aria Stark',
      'Alexander Wright',
    ];

    let reviewsInserted = 0;

    // Seed Flight Reviews
    for (let fIdx = 0; fIdx < flights.length; fIdx++) {
      const flight = flights[fIdx];
      const countRes = await engagementClient.query(
        `SELECT COUNT(*) FROM reviews WHERE LOWER(item_type) = 'flight' AND item_id = $1`,
        [flight.id]
      );
      const existingCount = parseInt(countRes.rows[0].count, 10);

      if (existingCount < 2) {
        // Add 2 reviews per flight
        const reviewsToSeed = [
          flightReviewTemplates[fIdx % flightReviewTemplates.length],
          flightReviewTemplates[(fIdx + 2) % flightReviewTemplates.length],
        ];

        for (let rIdx = 0; rIdx < reviewsToSeed.length; rIdx++) {
          const rev = reviewsToSeed[rIdx];
          const userName = reviewerNames[(fIdx * 2 + rIdx) % reviewerNames.length];
          const userId = crypto.randomUUID();
          const bookingId = crypto.randomUUID();

          // Ensure completed_trips record exists for verified traveler check
          await engagementClient.query(
            `INSERT INTO completed_trips (user_id, booking_id, item_type, item_id, completed_at)
             VALUES ($1, $2, 'flight', $3, NOW() - INTERVAL '${(fIdx + 1) * 2} days')
             ON CONFLICT (user_id, booking_id, item_type, item_id) DO NOTHING`,
            [userId, bookingId, flight.id]
          );

          await engagementClient.query(
            `INSERT INTO reviews (user_id, user_name, booking_id, item_type, item_id, rating, comment, created_at)
             VALUES ($1, $2, $3, 'flight', $4, $5, $6, NOW() - INTERVAL '${(fIdx + 1) * 2} days')
             ON CONFLICT (user_id, booking_id, item_id) DO NOTHING`,
            [userId, userName, bookingId, flight.id, rev.rating, rev.comment]
          );
          reviewsInserted++;
        }
      }
    }

    // Seed Hotel Reviews
    for (let hIdx = 0; hIdx < hotels.length; hIdx++) {
      const hotel = hotels[hIdx];
      const countRes = await engagementClient.query(
        `SELECT COUNT(*) FROM reviews WHERE LOWER(item_type) = 'hotel' AND item_id = $1`,
        [hotel.id]
      );
      const existingCount = parseInt(countRes.rows[0].count, 10);

      if (existingCount < 3) {
        // Add 3 reviews per hotel
        const reviewsToSeed = [
          hotelReviewTemplates[hIdx % hotelReviewTemplates.length],
          hotelReviewTemplates[(hIdx + 1) % hotelReviewTemplates.length],
          hotelReviewTemplates[(hIdx + 3) % hotelReviewTemplates.length],
        ];

        for (let rIdx = 0; rIdx < reviewsToSeed.length; rIdx++) {
          const rev = reviewsToSeed[rIdx];
          const userName = reviewerNames[(hIdx * 3 + rIdx) % reviewerNames.length];
          const userId = crypto.randomUUID();
          const bookingId = crypto.randomUUID();

          await engagementClient.query(
            `INSERT INTO completed_trips (user_id, booking_id, item_type, item_id, completed_at)
             VALUES ($1, $2, 'hotel', $3, NOW() - INTERVAL '${(hIdx + 1) * 3} days')
             ON CONFLICT (user_id, booking_id, item_type, item_id) DO NOTHING`,
            [userId, bookingId, hotel.id]
          );

          await engagementClient.query(
            `INSERT INTO reviews (user_id, user_name, booking_id, item_type, item_id, rating, comment, created_at)
             VALUES ($1, $2, $3, 'hotel', $4, $5, $6, NOW() - INTERVAL '${(hIdx + 1) * 3} days')
             ON CONFLICT (user_id, booking_id, item_id) DO NOTHING`,
            [userId, userName, bookingId, hotel.id, rev.rating, rev.comment]
          );
          reviewsInserted++;
        }
      }
    }

    await engagementClient.query('COMMIT');
    console.log(
      `[engagement-service] Customer review seeding completed (${reviewsInserted} reviews ensured).`
    );
  } catch (err) {
    await engagementClient.query('ROLLBACK');
    console.error('[engagement-service] Customer review seeding failed:', err);
    throw err;
  } finally {
    engagementClient.release();
    if (catalogClient) {
      await catalogClient.end().catch(() => {});
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  seedEngagementData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
