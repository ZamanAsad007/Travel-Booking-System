import { pool } from '../config/db.js';

export async function seedCatalogData() {
  console.log('[catalog-service] Starting catalog data seeding...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Seed Flights
    const existingFlights = await client.query('SELECT COUNT(*) FROM flights');
    if (parseInt(existingFlights.rows[0].count, 10) === 0) {
      console.log('[catalog-service] Seeding flights...');
      const flights = [
        {
          flightNumber: 'AA100',
          airline: 'American Airlines',
          origin: 'JFK',
          destination: 'LHR',
          departsAt: '2026-11-01T18:30:00Z',
          arrivesAt: '2026-11-02T06:30:00Z',
          price: 550.00,
          seatsTotal: 180,
        },
        {
          flightNumber: 'BA178',
          airline: 'British Airways',
          origin: 'JFK',
          destination: 'LHR',
          departsAt: '2026-11-01T21:00:00Z',
          arrivesAt: '2026-11-02T09:00:00Z',
          price: 620.00,
          seatsTotal: 220,
        },
        {
          flightNumber: 'EK202',
          airline: 'Emirates',
          origin: 'JFK',
          destination: 'DXB',
          departsAt: '2026-11-05T23:00:00Z',
          arrivesAt: '2026-11-06T19:45:00Z',
          price: 920.00,
          seatsTotal: 300,
        },
        {
          flightNumber: 'NH109',
          airline: 'ANA',
          origin: 'LAX',
          destination: 'HND',
          departsAt: '2026-11-10T11:50:00Z',
          arrivesAt: '2026-11-11T16:20:00Z',
          price: 880.00,
          seatsTotal: 215,
        },
        {
          flightNumber: 'AF023',
          airline: 'Air France',
          origin: 'JFK',
          destination: 'CDG',
          departsAt: '2026-11-12T16:30:00Z',
          arrivesAt: '2026-11-13T05:50:00Z',
          price: 710.00,
          seatsTotal: 250,
        },
        {
          flightNumber: 'SQ025',
          airline: 'Singapore Airlines',
          origin: 'FRA',
          destination: 'SIN',
          departsAt: '2026-11-15T11:40:00Z',
          arrivesAt: '2026-11-16T06:50:00Z',
          price: 850.00,
          seatsTotal: 260,
        },
      ];

      for (const f of flights) {
        await client.query(
          `INSERT INTO flights (flight_number, airline, origin, destination, departs_at, arrives_at, price, seats_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (flight_number) DO NOTHING`,
          [f.flightNumber, f.airline, f.origin, f.destination, f.departsAt, f.arrivesAt, f.price, f.seatsTotal]
        );
      }
    }

    // 2. Seed Hotels & Rooms
    const existingHotels = await client.query('SELECT COUNT(*) FROM hotels');
    if (parseInt(existingHotels.rows[0].count, 10) === 0) {
      console.log('[catalog-service] Seeding hotels and rooms...');
      const hotelData = [
        {
          name: 'The Savoy London',
          city: 'London',
          address: 'Strand, London WC2R 0EZ, United Kingdom',
          rating: 4.8,
          imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
          rooms: [
            { type: 'Superior Queen Room', pricePerNight: 350.00, roomsTotal: 25 },
            { type: 'River View Deluxe Suite', pricePerNight: 650.00, roomsTotal: 10 },
          ],
        },
        {
          name: 'Park Hyatt Tokyo',
          city: 'Tokyo',
          address: '3-7-1-2 Nishi-Shinjuku, Shinjuku-ku, Tokyo 163-1055, Japan',
          rating: 4.9,
          imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
          rooms: [
            { type: 'Park King Room', pricePerNight: 420.00, roomsTotal: 30 },
            { type: 'Tokyo Diplomat Suite', pricePerNight: 890.00, roomsTotal: 8 },
          ],
        },
        {
          name: 'The Plaza New York',
          city: 'New York',
          address: '768 5th Ave, New York, NY 10019, United States',
          rating: 4.7,
          imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
          rooms: [
            { type: 'Plaza King Room', pricePerNight: 550.00, roomsTotal: 40 },
            { type: 'Edwardian Suite', pricePerNight: 950.00, roomsTotal: 12 },
          ],
        },
        {
          name: 'Hôtel Plaza Athénée',
          city: 'Paris',
          address: '25 Avenue Montaigne, 75008 Paris, France',
          rating: 4.9,
          imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
          rooms: [
            { type: 'Deluxe Room Eiffel View', pricePerNight: 620.00, roomsTotal: 20 },
            { type: 'Prestige Suite', pricePerNight: 1100.00, roomsTotal: 5 },
          ],
        },
      ];

      for (const h of hotelData) {
        const hotelRes = await client.query(
          `INSERT INTO hotels (name, city, address, rating, image_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [h.name, h.city, h.address, h.rating, h.imageUrl]
        );
        const hotelId = hotelRes.rows[0].id;

        for (const r of h.rooms) {
          await client.query(
            `INSERT INTO rooms (hotel_id, type, price_per_night, rooms_total)
             VALUES ($1, $2, $3, $4)`,
            [hotelId, r.type, r.pricePerNight, r.roomsTotal]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log('[catalog-service] Catalog seeding completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[catalog-service] Seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1] === import.meta.url) {
  seedCatalogData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
