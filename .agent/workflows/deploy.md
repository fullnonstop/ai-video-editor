---
description: How to deploy the AI Video Editor
---

# Deployment Guide

You have two main options to deploy this application:

## Option 1: Local Production Build (Fastest)
Run the following commands to build and start the optimized production version locally:

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
// turbo
npm run start
```

The app will be available at `http://localhost:3000`.

## Option 2: Deploy to Vercel (Recommended for Public Access)
To share your app with others over the internet, Vercel is the easiest platform for Next.js apps.

1. Push your code to a GitHub repository.
2. Go to [Vercel.com](https://vercel.com) and sign up/login.
3. Click "Add New..." -> "Project".
4. Import your GitHub repository.
5. Click "Deploy".

Vercel will automatically detect the Next.js configuration and deploy your site.
