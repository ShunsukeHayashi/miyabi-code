#!/bin/bash

# Setup Vercel Environment Variables for AI Course Platform
echo "Setting up production environment variables on Vercel..."

# Database Configuration
echo "Setting up DATABASE_URL..."
echo "postgresql://miyabi_user:secure_password_2024@localhost:5432/miyabi_ai_course" | npx vercel env add DATABASE_URL production --sensitive

# JWT Secret (generate random secret)
echo "Setting up JWT_SECRET..."
echo "$(openssl rand -hex 32)" | npx vercel env add JWT_SECRET production --sensitive

# Next Auth Configuration
echo "Setting up NEXTAUTH_SECRET..."
echo "$(openssl rand -hex 32)" | npx vercel env add NEXTAUTH_SECRET production --sensitive

echo "Setting up NEXTAUTH_URL..."
echo "https://miyabi-private-bx0n0tnj7-shunsukehayashis-projects.vercel.app" | npx vercel env add NEXTAUTH_URL production

# AI Service API Keys (placeholders - user needs to set actual keys)
echo "Setting up GEMINI_API_KEY..."
echo "your_gemini_api_key_here" | npx vercel env add GEMINI_API_KEY production --sensitive

echo "Setting up OPENAI_API_KEY..."
echo "your_openai_api_key_here" | npx vercel env add OPENAI_API_KEY production --sensitive

# Redis Configuration
echo "Setting up REDIS_URL..."
echo "redis://localhost:6379" | npx vercel env add REDIS_URL production --sensitive

# Email Configuration
echo "Setting up EMAIL_HOST..."
echo "smtp.gmail.com" | npx vercel env add EMAIL_HOST production

echo "Setting up EMAIL_PORT..."
echo "587" | npx vercel env add EMAIL_PORT production

echo "Setting up EMAIL_USER..."
echo "your_email@gmail.com" | npx vercel env add EMAIL_USER production --sensitive

echo "Setting up EMAIL_PASS..."
echo "your_email_password" | npx vercel env add EMAIL_PASS production --sensitive

# Application Configuration
echo "Setting up NODE_ENV..."
echo "production" | npx vercel env add NODE_ENV production

echo "Setting up ENVIRONMENT..."
echo "production" | npx vercel env add ENVIRONMENT production

echo "Environment variables setup complete!"
echo ""
echo "IMPORTANT: Replace the following placeholder values with actual credentials:"
echo "- DATABASE_URL: Set up a PostgreSQL database (e.g., Neon, Supabase, AWS RDS)"
echo "- GEMINI_API_KEY: Get from Google AI Studio"
echo "- OPENAI_API_KEY: Get from OpenAI Dashboard"
echo "- REDIS_URL: Set up Redis instance (e.g., Upstash, Redis Cloud)"
echo "- EMAIL_USER/EMAIL_PASS: Configure SMTP credentials"