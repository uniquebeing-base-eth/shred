# Vercel Deployment Checklist

## Pre-Deployment Setup

- [ ] Create a Vercel account at https://vercel.com
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Update all environment variables in `.env.example`
- [ ] Commit your code to GitHub/GitLab/Bitbucket

## Environment Variables Setup

1. Go to your Vercel project settings
2. Add these environment variables:
   - [ ] `VITE_SUPABASE_URL`
   - [ ] `VITE_SUPABASE_ANON_KEY`
   - [ ] Any other required vars from your `.env.example`

## Initial Deployment

### Option 1: Using Vercel CLI
```bash
# Login to Vercel
vercel login

# Deploy to production
vercel deploy --prod
```

### Option 2: Using Git (Recommended)
1. Push code to your GitHub repository
2. Go to https://vercel.com/new
3. Select your GitHub repository
4. Vercel will auto-detect Next.js/TanStack Start
5. Add environment variables in the settings
6. Click "Deploy"

### Option 3: Using GitHub Actions
1. Add these secrets to your GitHub repository:
   - [ ] `VERCEL_TOKEN` - From Vercel account settings
   - [ ] `VERCEL_ORG_ID` - From Vercel project settings
   - [ ] `VERCEL_PROJECT_ID` - From Vercel project settings
2. Push to main branch - deployment happens automatically

## Post-Deployment

- [ ] Test your deployed app at the Vercel URL
- [ ] Verify all environment variables are working
- [ ] Check database connections
- [ ] Test authentication (Supabase)
- [ ] Monitor build logs in Vercel dashboard
- [ ] Set up custom domain (optional)

## Troubleshooting

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify `package.json` scripts are correct
- Try `bun run build` locally first

### Runtime Errors
- Check Vercel function logs
- Verify Supabase connection string
- Check that all API keys are correct
- Look for missing environment variables

### Performance Issues
- Enable caching in `vercel.json`
- Optimize images
- Use Vercel Analytics to monitor performance

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [TanStack Start](https://tanstack.com/start/latest)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel CLI Reference](https://vercel.com/cli)
