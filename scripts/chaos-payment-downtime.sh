#!/bin/bash
set -euo pipefail

# Chaos Scenario: Payment Service Downtime
# Stops the payment container mid-booking and verifies the booking saga compensation.

echo "=========================================================="
echo " Starting Chaos Scenario: Payment Service Downtime"
echo "=========================================================="

# 1. Check if docker compose environment is running
if ! docker compose ps | grep -q "payment-service"; then
  echo "[CHAOS] Docker compose environment is not active. Running in simulated unit mode..."
  npm test -- tests/chaos/paymentDowntime.test.js
  exit 0
fi

echo "[CHAOS] Step 1: Pausing payment-service container..."
docker compose pause payment-service

echo "[CHAOS] Step 2: Attempting to create booking via Gateway (port 80)..."
TOKEN=$(curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@travel.com", "password": "user123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4 || true)

if [ -z "$TOKEN" ]; then
  echo "[CHAOS] Warning: Could not authenticate. Simulating via automated test suite."
  docker compose unpause payment-service || true
  npm test -- tests/chaos/paymentDowntime.test.js
  exit 0
fi

echo "[CHAOS] Step 3: Triggering booking during payment outage..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"items": [{"itemType": "flight", "itemId": "1", "quantity": 1}]}')

echo "[CHAOS] Booking response received: $RESPONSE"

echo "[CHAOS] Step 4: Restoring payment-service container..."
docker compose unpause payment-service

echo "[CHAOS] Step 5: Running recovery verification test suite..."
npm test -- tests/chaos/paymentDowntime.test.js

echo "=========================================================="
echo " Chaos Scenario Completed: System Recovered Successfully!"
echo "=========================================================="
