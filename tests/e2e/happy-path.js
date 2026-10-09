/**
 * End-to-End Happy Path Test Script
 * Flow: Register -> Search Flight -> Create Booking -> Poll for Confirmed status
 *
 * Usage:
 *   node tests/e2e/happy-path.js
 *   GATEWAY_URL=http://localhost:8080 npm run test:e2e
 */

const BASE_URL = process.env.GATEWAY_URL || 'http://localhost:8080';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runE2E() {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting End-to-End Happy Path Verification`);
  console.log(`🎯 Target Gateway: ${BASE_URL}`);
  console.log(`======================================================\n`);

  const timestamp = Date.now();
  const testUser = {
    name: `E2E Test User ${timestamp}`,
    email: `e2e_user_${timestamp}@test.local`,
    password: 'SecurePassword123!',
  };

  try {
    // Step 0: Check Gateway Health
    console.log(`[Step 0] Checking Gateway health at ${BASE_URL}/health...`);
    const healthRes = await fetch(`${BASE_URL}/health`).catch((err) => {
      throw new Error(
        `Unable to connect to gateway at ${BASE_URL}: ${err.message}. Ensure docker compose stack is up.`
      );
    });
    if (!healthRes.ok) {
      throw new Error(`Gateway returned health status ${healthRes.status}`);
    }
    const healthJson = await healthRes.json();
    console.log(`  ✓ Gateway status: ${healthJson.data?.status || 'OK'}`);

    // Step 1: Register New User
    console.log(`\n[Step 1] Registering test user: ${testUser.email}...`);
    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    if (!registerRes.ok) {
      const errText = await registerRes.text();
      throw new Error(`Registration failed (${registerRes.status}): ${errText}`);
    }

    const registerJson = await registerRes.json();
    const token = registerJson.data.token;
    console.log(`  ✓ Registered successfully! Received auth token.`);

    // Step 2: Search Flights
    console.log(`\n[Step 2] Searching available flights...`);
    const catalogRes = await fetch(`${BASE_URL}/api/catalog/flights`);
    if (!catalogRes.ok) {
      const errText = await catalogRes.text();
      throw new Error(`Catalog search failed (${catalogRes.status}): ${errText}`);
    }

    const catalogJson = await catalogRes.json();
    const flights = catalogJson.data?.flights || catalogJson.data || [];
    if (!flights.length) {
      throw new Error('No flights found in catalog. Ensure seed data is loaded.');
    }

    const selectedFlight = flights[0];
    console.log(
      `  ✓ Found flight: ${selectedFlight.airline} (${selectedFlight.origin} -> ${selectedFlight.destination}) - Price: $${selectedFlight.price}`
    );

    // Step 3: Create Booking
    console.log(`\n[Step 3] Submitting booking for flight ${selectedFlight.id}...`);
    const bookingRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: [
          {
            itemType: 'flight',
            itemId: selectedFlight.id,
            quantity: 1,
          },
        ],
      }),
    });

    if (!bookingRes.ok) {
      const errText = await bookingRes.text();
      throw new Error(`Booking submission failed (${bookingRes.status}): ${errText}`);
    }

    const bookingJson = await bookingRes.json();
    const booking = bookingJson.data?.booking || bookingJson.data;
    const bookingId = booking?.id;
    console.log(`  ✓ Booking created! ID: ${bookingId}, Initial status: ${booking?.status}`);

    // Step 4: Poll for Booking Confirmation (Saga Choreography)
    console.log(
      `\n[Step 4] Polling booking status until CONFIRMED (saga payment & confirmation flow)...`
    );
    const maxRetries = 15;
    let attempts = 0;
    let finalStatus = booking?.status;

    while (attempts < maxRetries) {
      attempts++;
      await sleep(1500);

      const statusRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!statusRes.ok) {
        throw new Error(`Failed to fetch booking details (${statusRes.status})`);
      }

      const statusJson = await statusRes.json();
      const currentBooking = statusJson.data?.booking || statusJson.data;
      finalStatus = currentBooking?.status;
      console.log(`  Attempt ${attempts}/${maxRetries} - Status: ${finalStatus}`);

      if (finalStatus === 'CONFIRMED') {
        break;
      }
      if (finalStatus === 'CANCELLED') {
        throw new Error('Booking was cancelled due to payment failure or hold expiry');
      }
    }

    if (finalStatus !== 'CONFIRMED') {
      throw new Error(`Booking failed to confirm within timeout. Final status: ${finalStatus}`);
    }

    console.log(`\n======================================================`);
    console.log(`🎉 SUCCESS: E2E Happy Path verified!`);
    console.log(`Booking ${bookingId} is CONFIRMED.`);
    console.log(`======================================================\n`);
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ E2E Test Failed: ${err.message}\n`);
    process.exit(1);
  }
}

runE2E();
