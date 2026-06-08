# Vercel Deployment Guide

This project is configured for deployment on Vercel with Node.js runtime.

## Prerequisites

- Node.js 18+ or Bun
- Vercel CLI: `npm i -g vercel`

## Environment Variables

Set these in your Vercel project settings:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- Any other environment variables your app needs

## Deployment

### Using Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy
vercel deploy --prod
```

### Using Git

Push to your GitHub repository and Vercel will automatically deploy on every push to the main branch.

## Local Testing

To test the production build locally:

```bash
bun run build
bun run preview
```

## Configuration

- `vercel.json` - Vercel deployment configuration
- `.vercelignore` - Files to exclude from deployment

## Troubleshooting

- **Build fails**: Ensure all environment variables are set in Vercel project settings
- **Assets not loading**: Check that public files are in the `public/` directory
- **Database connection issues**: Verify Supabase connection strings and network access

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [TanStack Start Documentation](https://tanstack.com/start)
- [Supabase with Vercel](https://supabase.com/docs/guides/deployment)
