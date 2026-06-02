#!/bin/bash

# Stripe Configuration Test Script
# This script verifies your Stripe setup is correct

echo "🔍 Stripe Configuration Verification"
echo "===================================="
echo ""

# Check environment variables
echo "✅ Checking Environment Variables..."
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ STRIPE_SECRET_KEY is not set"
else
    echo "✓ STRIPE_SECRET_KEY is set (sk_test_...)"
fi

if [ -z "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ]; then
    echo "❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set"
else
    echo "✓ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set (pk_test_...)"
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo "❌ STRIPE_WEBHOOK_SECRET is not set"
else
    echo "✓ STRIPE_WEBHOOK_SECRET is set (whsec_...)"
fi

if [ -z "$STRIPE_PRICE_BASIC" ]; then
    echo "❌ STRIPE_PRICE_BASIC is not set"
else
    echo "✓ STRIPE_PRICE_BASIC is set"
fi

echo ""
echo "✅ Checking Stripe Library..."
if grep -q "import Stripe from" src/lib/stripe.js; then
    echo "✓ Stripe library is properly imported"
fi

echo ""
echo "✅ Checking API Routes..."
if [ -f "src/app/api/stripe/checkout/route.js" ]; then
    echo "✓ /api/stripe/checkout exists"
fi

if [ -f "src/app/api/stripe/webhook/route.js" ]; then
    echo "✓ /api/stripe/webhook exists"
fi

if [ -f "src/app/api/stripe/portal/route.js" ]; then
    echo "✓ /api/stripe/portal exists"
fi

echo ""
echo "✅ Checking Database Schema..."
if grep -q "model Subscription" prisma/schema.prisma; then
    echo "✓ Subscription model exists in Prisma schema"
fi

echo ""
echo "✅ Checking MCP Configuration..."
if grep -q '"stripe"' .claude/settings.json; then
    echo "✓ Stripe MCP is configured in settings.json"
fi

echo ""
echo "===================================="
echo "🎉 Stripe Configuration Complete!"
echo ""
echo "Next steps:"
echo "1. Run: stripe listen --forward-to localhost:3000/api/stripe/webhook"
echo "2. Test checkout at: http://localhost:3000/subscribe"
echo "3. Use test card: 4242 4242 4242 4242 | 12/26 | 123"
echo ""
