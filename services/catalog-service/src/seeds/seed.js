import { pool } from '../config/db.js';

export async function seedCatalogData() {
  console.log('[catalog-service] Starting catalog data seeding...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Seed Flights (Idempotent: inserts any missing flights by unique flight_number)
    console.log('[catalog-service] Seeding flights...');
    const flights = [
      {
        flightNumber: 'AA100',
        airline: 'American Airlines',
        origin: 'JFK',
        destination: 'LHR',
        departsAt: '2026-11-01T18:30:00Z',
        arrivesAt: '2026-11-02T06:30:00Z',
        price: 550.0,
        seatsTotal: 180,
        avgRating: 4.6,
        reviewCount: 14,
      },
      {
        flightNumber: 'BA178',
        airline: 'British Airways',
        origin: 'JFK',
        destination: 'LHR',
        departsAt: '2026-11-01T21:00:00Z',
        arrivesAt: '2026-11-02T09:00:00Z',
        price: 620.0,
        seatsTotal: 220,
        avgRating: 4.7,
        reviewCount: 18,
      },
      {
        flightNumber: 'BA179',
        airline: 'British Airways',
        origin: 'LHR',
        destination: 'JFK',
        departsAt: '2026-11-03T11:00:00Z',
        arrivesAt: '2026-11-03T14:15:00Z',
        price: 610.0,
        seatsTotal: 220,
        avgRating: 4.8,
        reviewCount: 12,
      },
      {
        flightNumber: 'AA101',
        airline: 'American Airlines',
        origin: 'LHR',
        destination: 'JFK',
        departsAt: '2026-11-03T14:30:00Z',
        arrivesAt: '2026-11-03T17:45:00Z',
        price: 540.0,
        seatsTotal: 180,
        avgRating: 4.5,
        reviewCount: 10,
      },
      {
        flightNumber: 'DL401',
        airline: 'Delta Air Lines',
        origin: 'JFK',
        destination: 'LAX',
        departsAt: '2026-11-02T08:00:00Z',
        arrivesAt: '2026-11-02T11:30:00Z',
        price: 290.0,
        seatsTotal: 190,
        avgRating: 4.7,
        reviewCount: 22,
      },
      {
        flightNumber: 'UA502',
        airline: 'United Airlines',
        origin: 'LAX',
        destination: 'JFK',
        departsAt: '2026-11-04T13:00:00Z',
        arrivesAt: '2026-11-04T21:30:00Z',
        price: 310.0,
        seatsTotal: 190,
        avgRating: 4.4,
        reviewCount: 16,
      },
      {
        flightNumber: 'EK202',
        airline: 'Emirates',
        origin: 'JFK',
        destination: 'DXB',
        departsAt: '2026-11-05T23:00:00Z',
        arrivesAt: '2026-11-06T19:45:00Z',
        price: 920.0,
        seatsTotal: 300,
        avgRating: 4.9,
        reviewCount: 28,
      },
      {
        flightNumber: 'EK203',
        airline: 'Emirates',
        origin: 'DXB',
        destination: 'JFK',
        departsAt: '2026-11-08T02:30:00Z',
        arrivesAt: '2026-11-08T08:15:00Z',
        price: 940.0,
        seatsTotal: 300,
        avgRating: 4.9,
        reviewCount: 24,
      },
      {
        flightNumber: 'EK412',
        airline: 'Emirates',
        origin: 'DXB',
        destination: 'LHR',
        departsAt: '2026-11-04T07:45:00Z',
        arrivesAt: '2026-11-04T12:00:00Z',
        price: 580.0,
        seatsTotal: 320,
        avgRating: 4.8,
        reviewCount: 19,
      },
      {
        flightNumber: 'BA107',
        airline: 'British Airways',
        origin: 'LHR',
        destination: 'DXB',
        departsAt: '2026-11-05T12:40:00Z',
        arrivesAt: '2026-11-05T23:45:00Z',
        price: 600.0,
        seatsTotal: 280,
        avgRating: 4.6,
        reviewCount: 15,
      },
      {
        flightNumber: 'NH109',
        airline: 'ANA',
        origin: 'LAX',
        destination: 'HND',
        departsAt: '2026-11-10T11:50:00Z',
        arrivesAt: '2026-11-11T16:20:00Z',
        price: 880.0,
        seatsTotal: 215,
        avgRating: 4.9,
        reviewCount: 26,
      },
      {
        flightNumber: 'NH110',
        airline: 'ANA',
        origin: 'HND',
        destination: 'LAX',
        departsAt: '2026-11-14T17:00:00Z',
        arrivesAt: '2026-11-14T10:45:00Z',
        price: 870.0,
        seatsTotal: 215,
        avgRating: 4.9,
        reviewCount: 20,
      },
      {
        flightNumber: 'JL005',
        airline: 'Japan Airlines',
        origin: 'JFK',
        destination: 'HND',
        departsAt: '2026-11-06T13:30:00Z',
        arrivesAt: '2026-11-07T17:10:00Z',
        price: 960.0,
        seatsTotal: 240,
        avgRating: 4.8,
        reviewCount: 17,
      },
      {
        flightNumber: 'JL006',
        airline: 'Japan Airlines',
        origin: 'HND',
        destination: 'JFK',
        departsAt: '2026-11-12T11:05:00Z',
        arrivesAt: '2026-11-12T11:00:00Z',
        price: 950.0,
        seatsTotal: 240,
        avgRating: 4.8,
        reviewCount: 21,
      },
      {
        flightNumber: 'AF023',
        airline: 'Air France',
        origin: 'JFK',
        destination: 'CDG',
        departsAt: '2026-11-12T16:30:00Z',
        arrivesAt: '2026-11-13T05:50:00Z',
        price: 710.0,
        seatsTotal: 250,
        avgRating: 4.7,
        reviewCount: 19,
      },
      {
        flightNumber: 'AF024',
        airline: 'Air France',
        origin: 'CDG',
        destination: 'JFK',
        departsAt: '2026-11-15T14:10:00Z',
        arrivesAt: '2026-11-15T16:45:00Z',
        price: 720.0,
        seatsTotal: 250,
        avgRating: 4.6,
        reviewCount: 14,
      },
      {
        flightNumber: 'BA304',
        airline: 'British Airways',
        origin: 'LHR',
        destination: 'CDG',
        departsAt: '2026-11-07T07:30:00Z',
        arrivesAt: '2026-11-07T09:45:00Z',
        price: 150.0,
        seatsTotal: 160,
        avgRating: 4.5,
        reviewCount: 11,
      },
      {
        flightNumber: 'AF1680',
        airline: 'Air France',
        origin: 'CDG',
        destination: 'LHR',
        departsAt: '2026-11-09T17:15:00Z',
        arrivesAt: '2026-11-09T17:35:00Z',
        price: 160.0,
        seatsTotal: 160,
        avgRating: 4.6,
        reviewCount: 13,
      },
      {
        flightNumber: 'SQ025',
        airline: 'Singapore Airlines',
        origin: 'FRA',
        destination: 'SIN',
        departsAt: '2026-11-15T11:40:00Z',
        arrivesAt: '2026-11-16T06:50:00Z',
        price: 850.0,
        seatsTotal: 260,
        avgRating: 4.9,
        reviewCount: 30,
      },
      {
        flightNumber: 'SQ026',
        airline: 'Singapore Airlines',
        origin: 'SIN',
        destination: 'FRA',
        departsAt: '2026-11-18T23:55:00Z',
        arrivesAt: '2026-11-19T06:20:00Z',
        price: 840.0,
        seatsTotal: 260,
        avgRating: 4.9,
        reviewCount: 25,
      },
      {
        flightNumber: 'LH400',
        airline: 'Lufthansa',
        origin: 'FRA',
        destination: 'JFK',
        departsAt: '2026-11-03T10:40:00Z',
        arrivesAt: '2026-11-03T13:50:00Z',
        price: 680.0,
        seatsTotal: 270,
        avgRating: 4.7,
        reviewCount: 16,
      },
      {
        flightNumber: 'LH401',
        airline: 'Lufthansa',
        origin: 'JFK',
        destination: 'FRA',
        departsAt: '2026-11-06T16:20:00Z',
        arrivesAt: '2026-11-07T05:40:00Z',
        price: 670.0,
        seatsTotal: 270,
        avgRating: 4.7,
        reviewCount: 18,
      },
      {
        flightNumber: 'SQ012',
        airline: 'Singapore Airlines',
        origin: 'SIN',
        destination: 'LHR',
        departsAt: '2026-11-08T09:00:00Z',
        arrivesAt: '2026-11-08T15:25:00Z',
        price: 790.0,
        seatsTotal: 280,
        avgRating: 4.9,
        reviewCount: 27,
      },
      {
        flightNumber: 'BA015',
        airline: 'British Airways',
        origin: 'LHR',
        destination: 'SIN',
        departsAt: '2026-11-10T21:35:00Z',
        arrivesAt: '2026-11-11T17:45:00Z',
        price: 780.0,
        seatsTotal: 280,
        avgRating: 4.6,
        reviewCount: 15,
      },
      {
        flightNumber: 'EK354',
        airline: 'Emirates',
        origin: 'DXB',
        destination: 'SIN',
        departsAt: '2026-11-11T03:05:00Z',
        arrivesAt: '2026-11-11T14:40:00Z',
        price: 520.0,
        seatsTotal: 290,
        avgRating: 4.8,
        reviewCount: 22,
      },
      {
        flightNumber: 'SQ494',
        airline: 'Singapore Airlines',
        origin: 'SIN',
        destination: 'DXB',
        departsAt: '2026-11-14T15:10:00Z',
        arrivesAt: '2026-11-14T18:55:00Z',
        price: 510.0,
        seatsTotal: 290,
        avgRating: 4.9,
        reviewCount: 20,
      },
      {
        flightNumber: 'LH716',
        airline: 'Lufthansa',
        origin: 'FRA',
        destination: 'HND',
        departsAt: '2026-11-12T18:00:00Z',
        arrivesAt: '2026-11-13T13:05:00Z',
        price: 920.0,
        seatsTotal: 260,
        avgRating: 4.8,
        reviewCount: 14,
      },
      {
        flightNumber: 'NH204',
        airline: 'ANA',
        origin: 'HND',
        destination: 'FRA',
        departsAt: '2026-11-16T00:50:00Z',
        arrivesAt: '2026-11-16T06:20:00Z',
        price: 910.0,
        seatsTotal: 260,
        avgRating: 4.9,
        reviewCount: 18,
      },
      {
        flightNumber: 'VS007',
        airline: 'Virgin Atlantic',
        origin: 'LHR',
        destination: 'LAX',
        departsAt: '2026-11-05T10:00:00Z',
        arrivesAt: '2026-11-05T13:30:00Z',
        price: 650.0,
        seatsTotal: 240,
        avgRating: 4.7,
        reviewCount: 21,
      },
      {
        flightNumber: 'VS008',
        airline: 'Virgin Atlantic',
        origin: 'LAX',
        destination: 'LHR',
        departsAt: '2026-11-08T17:45:00Z',
        arrivesAt: '2026-11-09T12:05:00Z',
        price: 660.0,
        seatsTotal: 240,
        avgRating: 4.7,
        reviewCount: 19,
      },
      {
        flightNumber: 'AF066',
        airline: 'Air France',
        origin: 'CDG',
        destination: 'LAX',
        departsAt: '2026-11-07T10:15:00Z',
        arrivesAt: '2026-11-07T13:10:00Z',
        price: 790.0,
        seatsTotal: 250,
        avgRating: 4.7,
        reviewCount: 17,
      },
      {
        flightNumber: 'AF065',
        airline: 'Air France',
        origin: 'LAX',
        destination: 'CDG',
        departsAt: '2026-11-11T15:30:00Z',
        arrivesAt: '2026-11-12T11:20:00Z',
        price: 800.0,
        seatsTotal: 250,
        avgRating: 4.8,
        reviewCount: 15,
      },
      {
        flightNumber: 'EK215',
        airline: 'Emirates',
        origin: 'DXB',
        destination: 'LAX',
        departsAt: '2026-11-09T08:30:00Z',
        arrivesAt: '2026-11-09T14:15:00Z',
        price: 1050.0,
        seatsTotal: 310,
        avgRating: 4.9,
        reviewCount: 29,
      },
      {
        flightNumber: 'EK216',
        airline: 'Emirates',
        origin: 'LAX',
        destination: 'DXB',
        departsAt: '2026-11-13T16:40:00Z',
        arrivesAt: '2026-11-14T19:30:00Z',
        price: 1020.0,
        seatsTotal: 310,
        avgRating: 4.9,
        reviewCount: 23,
      },
    ];

    // Generate recurring daily flights from Oct 15, 2026 to Dec 31, 2026 across all routes
    const allFlights = [...flights];
    const existingFlightNumbers = new Set(flights.map((f) => f.flightNumber));

    const startDate = new Date('2026-10-15T00:00:00Z');
    const endDate = new Date('2026-12-31T23:59:59Z');

    for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayCode = `${mm}${dd}`;

      for (const baseFlight of flights) {
        const originalDep = new Date(baseFlight.departsAt);
        const originalArr = new Date(baseFlight.arrivesAt);
        const durationMs = originalArr.getTime() - originalDep.getTime();

        const origDateStr = baseFlight.departsAt.split('T')[0];
        if (origDateStr === dateStr) {
          continue;
        }

        const flightNumber = `${baseFlight.flightNumber}-${dayCode}`;
        if (existingFlightNumbers.has(flightNumber)) {
          continue;
        }
        existingFlightNumbers.add(flightNumber);

        const timePart = baseFlight.departsAt.split('T')[1];
        const departsAt = `${dateStr}T${timePart}`;
        const arrivesAt = new Date(new Date(departsAt).getTime() + durationMs).toISOString();

        const dayOfWeek = d.getUTCDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
        const priceAdjustment = isWeekend ? Math.round(baseFlight.price * 0.05) : 0;
        const price = Math.round((baseFlight.price + priceAdjustment) * 100) / 100;

        allFlights.push({
          flightNumber,
          airline: baseFlight.airline,
          origin: baseFlight.origin,
          destination: baseFlight.destination,
          departsAt,
          arrivesAt,
          price,
          seatsTotal: baseFlight.seatsTotal,
          avgRating: baseFlight.avgRating,
          reviewCount: baseFlight.reviewCount,
        });
      }
    }

    const BATCH_SIZE = 100;
    for (let i = 0; i < allFlights.length; i += BATCH_SIZE) {
      const batch = allFlights.slice(i, i + BATCH_SIZE);
      const values = [];
      const valueClauses = [];
      let paramIdx = 1;
      for (const f of batch) {
        valueClauses.push(
          `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`
        );
        values.push(
          f.flightNumber,
          f.airline,
          f.origin,
          f.destination,
          f.departsAt,
          f.arrivesAt,
          f.price,
          f.seatsTotal,
          f.avgRating,
          f.reviewCount
        );
      }

      await client.query(
        `INSERT INTO flights (flight_number, airline, origin, destination, departs_at, arrives_at, price, seats_total, avg_rating, review_count)
         VALUES ${valueClauses.join(', ')}
         ON CONFLICT (flight_number) DO UPDATE
         SET departs_at = EXCLUDED.departs_at,
             arrives_at = EXCLUDED.arrives_at,
             price = EXCLUDED.price,
             seats_total = EXCLUDED.seats_total,
             avg_rating = COALESCE(flights.avg_rating, EXCLUDED.avg_rating),
             review_count = COALESCE(flights.review_count, EXCLUDED.review_count)`,
        values
      );
    }
    console.log(`[catalog-service] Ensured ${allFlights.length} flights in catalog across daily dates.`);

    // 2. Seed Hotels & Rooms (Idempotent: inserts any missing hotels and room types)
    console.log('[catalog-service] Seeding hotels and rooms...');
    const hotelData = [
      {
        name: 'The Savoy London',
        city: 'London',
        address: 'Strand, London WC2R 0EZ, United Kingdom',
        rating: 4.8,
        imageUrl:
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        rooms: [
          { type: 'Superior Queen Room', pricePerNight: 350.0, roomsTotal: 25 },
          { type: 'River View Deluxe Suite', pricePerNight: 650.0, roomsTotal: 10 },
          { type: 'Junior Suite River View', pricePerNight: 490.0, roomsTotal: 15 },
          { type: 'Edwardian Heritage Suite', pricePerNight: 820.0, roomsTotal: 6 },
        ],
      },
      {
        name: 'The Ritz London',
        city: 'London',
        address: "150 Piccadilly, St. James's, London W1J 9BR, United Kingdom",
        rating: 4.9,
        imageUrl:
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
        rooms: [
          { type: 'Executive King Room', pricePerNight: 460.0, roomsTotal: 25 },
          { type: 'Piccadilly Deluxe Suite', pricePerNight: 750.0, roomsTotal: 12 },
          { type: 'Trafalgar Suite', pricePerNight: 1050.0, roomsTotal: 6 },
          { type: 'Royal Suite with Terrace', pricePerNight: 1800.0, roomsTotal: 2 },
        ],
      },
      {
        name: 'Park Hyatt Tokyo',
        city: 'Tokyo',
        address: '3-7-1-2 Nishi-Shinjuku, Shinjuku-ku, Tokyo 163-1055, Japan',
        rating: 4.9,
        imageUrl:
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        rooms: [
          { type: 'Park King Room', pricePerNight: 420.0, roomsTotal: 30 },
          { type: 'Tokyo Diplomat Suite', pricePerNight: 890.0, roomsTotal: 8 },
          { type: 'Park Deluxe View Room', pricePerNight: 530.0, roomsTotal: 20 },
          { type: 'Governors Suite', pricePerNight: 1150.0, roomsTotal: 4 },
        ],
      },
      {
        name: 'Aman Tokyo',
        city: 'Tokyo',
        address: 'The Otemachi Tower, 1-5-6 Otemachi, Chiyoda-ku, Tokyo 100-0004, Japan',
        rating: 4.9,
        imageUrl:
          'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
        rooms: [
          { type: 'Deluxe Palace Room', pricePerNight: 590.0, roomsTotal: 28 },
          { type: 'Premier Garden View Room', pricePerNight: 760.0, roomsTotal: 16 },
          { type: 'Aman Tokyo Grand Suite', pricePerNight: 1300.0, roomsTotal: 6 },
          { type: 'Imperial Panoramic Suite', pricePerNight: 1900.0, roomsTotal: 3 },
        ],
      },
      {
        name: 'The Plaza New York',
        city: 'New York',
        address: '768 5th Ave, New York, NY 10019, United States',
        rating: 4.7,
        imageUrl:
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        rooms: [
          { type: 'Plaza King Room', pricePerNight: 550.0, roomsTotal: 40 },
          { type: 'Edwardian Suite', pricePerNight: 950.0, roomsTotal: 12 },
          { type: 'Grand Luxe Two Queen Room', pricePerNight: 620.0, roomsTotal: 25 },
          { type: 'Royal Terrace Suite', pricePerNight: 1450.0, roomsTotal: 5 },
        ],
      },
      {
        name: 'The Carlyle, A Rosewood Hotel',
        city: 'New York',
        address: '35 E 76th St, New York, NY 10021, United States',
        rating: 4.8,
        imageUrl:
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
        rooms: [
          { type: 'Classic King Room', pricePerNight: 490.0, roomsTotal: 30 },
          { type: 'Central Park View Suite', pricePerNight: 850.0, roomsTotal: 15 },
          { type: 'Carlyle Premier Suite', pricePerNight: 1100.0, roomsTotal: 8 },
          { type: 'Central Park Tower Penthouse', pricePerNight: 1850.0, roomsTotal: 3 },
        ],
      },
      {
        name: 'Hôtel Plaza Athénée',
        city: 'Paris',
        address: '25 Avenue Montaigne, 75008 Paris, France',
        rating: 4.9,
        imageUrl:
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
        rooms: [
          { type: 'Deluxe Room Eiffel View', pricePerNight: 620.0, roomsTotal: 20 },
          { type: 'Prestige Suite', pricePerNight: 1100.0, roomsTotal: 5 },
          { type: 'Superior Courtyard King', pricePerNight: 480.0, roomsTotal: 18 },
          { type: 'Eiffel Tower Haute Couture Suite', pricePerNight: 1600.0, roomsTotal: 3 },
        ],
      },
      {
        name: 'Le Bristol Paris',
        city: 'Paris',
        address: '112 Rue du Faubourg Saint-Honoré, 75008 Paris, France',
        rating: 4.9,
        imageUrl:
          'https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=800&q=80',
        rooms: [
          { type: 'Deluxe Courtyard Room', pricePerNight: 580.0, roomsTotal: 22 },
          { type: 'Junior Suite Prestige', pricePerNight: 890.0, roomsTotal: 10 },
          { type: 'Honeymoon Panoramic Suite', pricePerNight: 1350.0, roomsTotal: 4 },
          { type: 'Imperial Garden Suite', pricePerNight: 2100.0, roomsTotal: 2 },
        ],
      },
      {
        name: 'Burj Al Arab Jumeirah',
        city: 'Dubai',
        address: 'Umm Suqeim 3, Dubai, United Arab Emirates',
        rating: 4.9,
        imageUrl:
          'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
        rooms: [
          { type: 'Deluxe One-Bedroom Marina Suite', pricePerNight: 950.0, roomsTotal: 20 },
          { type: 'Panoramic Ocean Suite', pricePerNight: 1400.0, roomsTotal: 10 },
          { type: 'Club Two-Bedroom Suite', pricePerNight: 1850.0, roomsTotal: 6 },
          { type: 'Royal Ocean View Suite', pricePerNight: 2500.0, roomsTotal: 3 },
        ],
      },
      {
        name: 'Marina Bay Sands',
        city: 'Singapore',
        address: '10 Bayfront Ave, Singapore 018956',
        rating: 4.8,
        imageUrl:
          'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
        rooms: [
          { type: 'Deluxe City View Room', pricePerNight: 450.0, roomsTotal: 40 },
          { type: 'Sands Premier Suite', pricePerNight: 820.0, roomsTotal: 18 },
          { type: 'Paiza Club Infinity Suite', pricePerNight: 1400.0, roomsTotal: 6 },
          { type: 'Presidential Harbor Suite', pricePerNight: 2200.0, roomsTotal: 3 },
        ],
      },
    ];

    let totalRoomsCount = 0;
    for (const h of hotelData) {
      const existingHotel = await client.query('SELECT id FROM hotels WHERE name = $1', [h.name]);
      let hotelId;
      if (existingHotel.rows.length > 0) {
        hotelId = existingHotel.rows[0].id;
        await client.query(
          `UPDATE hotels SET city = $1, address = $2, rating = $3, image_url = $4 WHERE id = $5`,
          [h.city, h.address, h.rating, h.imageUrl, hotelId]
        );
      } else {
        const hotelRes = await client.query(
          `INSERT INTO hotels (name, city, address, rating, image_url, avg_rating, review_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [h.name, h.city, h.address, h.rating, h.imageUrl, h.rating, 12]
        );
        hotelId = hotelRes.rows[0].id;
      }

      for (const r of h.rooms) {
        totalRoomsCount++;
        const existingRoom = await client.query(
          'SELECT id FROM rooms WHERE hotel_id = $1 AND type = $2',
          [hotelId, r.type]
        );
        if (existingRoom.rows.length === 0) {
          await client.query(
            `INSERT INTO rooms (hotel_id, type, price_per_night, rooms_total)
             VALUES ($1, $2, $3, $4)`,
            [hotelId, r.type, r.pricePerNight, r.roomsTotal]
          );
        } else {
          await client.query(
            `UPDATE rooms SET price_per_night = $1, rooms_total = $2 WHERE id = $3`,
            [r.pricePerNight, r.roomsTotal, existingRoom.rows[0].id]
          );
        }
      }
    }
    console.log(
      `[catalog-service] Ensured ${hotelData.length} hotels and ${totalRoomsCount} room types.`
    );

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

import { fileURLToPath } from 'node:url';

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  seedCatalogData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
