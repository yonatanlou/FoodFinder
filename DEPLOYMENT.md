# Deployment Guide

This guide provides step-by-step instructions for deploying the FoodFinder application to various platforms.

## Prerequisites

Before deploying, ensure you have:
1. ✅ Google Maps API key configured
2. ✅ Firebase project set up
3. ✅ All configuration files updated
4. ✅ Application tested locally

## Deployment Options

### 1. Netlify (Recommended for Static Sites)

#### Automatic Deployment
1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Click "New site from Git"
4. Connect your GitHub repository
5. Configure build settings:
   - Build command: (leave empty for static site)
   - Publish directory: `.` (root directory)
6. Add environment variables in Netlify dashboard:
   - `GOOGLE_MAPS_API_KEY`: Your Google Maps API key
7. Deploy!

#### Manual Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=.
```

### 2. Vercel

#### Automatic Deployment
1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Configure project settings
5. Add environment variables
6. Deploy!

#### Manual Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### 3. GitHub Pages

1. Push your code to GitHub
2. Go to repository Settings > Pages
3. Select source branch (usually `main`)
4. Set folder to `/ (root)`
5. Save and wait for deployment

### 4. Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init hosting

# Deploy
firebase deploy
```

### 5. AWS S3 + CloudFront

1. Create S3 bucket
2. Upload all files to bucket
3. Configure bucket for static website hosting
4. Set up CloudFront distribution
5. Configure custom domain (optional)

## Environment Variables

Set these environment variables in your hosting platform:

```bash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=your_project_id
```

## Post-Deployment Checklist

### 1. API Key Configuration
- [ ] Update Google Maps API key in `index.html`
- [ ] Update Firebase config in `js/firebase-config.js`
- [ ] Add domain to Google Maps API key restrictions

### 2. Firebase Setup
- [ ] Enable Firestore Database
- [ ] Set up Firestore security rules
- [ ] Enable Authentication (Anonymous)
- [ ] Test database connection

### 3. Testing
- [ ] Test search functionality
- [ ] Test custom filters
- [ ] Test marker interactions
- [ ] Test responsive design
- [ ] Test on different browsers

### 4. Performance
- [ ] Enable compression (gzip)
- [ ] Set up caching headers
- [ ] Optimize images (if any)
- [ ] Monitor Core Web Vitals

## Security Considerations

### 1. API Key Restrictions
- Restrict Google Maps API key to your domain
- Use HTTP referrer restrictions
- Monitor API usage

### 2. Firebase Security
- Set up proper Firestore security rules
- Enable authentication
- Monitor database access

### 3. CORS Configuration
- Configure CORS headers properly
- Restrict allowed origins

## Monitoring and Analytics

### 1. Google Analytics
Add Google Analytics tracking:

```html
<!-- Add to index.html head section -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 2. Error Monitoring
Consider adding error monitoring services:
- Sentry
- LogRocket
- Bugsnag

## Troubleshooting

### Common Deployment Issues

1. **CORS Errors**
   - Check API key restrictions
   - Verify domain configuration
   - Check browser console for errors

2. **Map Not Loading**
   - Verify API key is correct
   - Check billing is enabled
   - Ensure APIs are enabled

3. **Firebase Connection Issues**
   - Verify Firebase config
   - Check security rules
   - Test authentication

4. **Build Failures**
   - Check file paths
   - Verify all dependencies
   - Review build logs

## Performance Optimization

### 1. Caching
```html
<!-- Add cache headers -->
<meta http-equiv="Cache-Control" content="max-age=31536000">
```

### 2. Compression
Enable gzip compression on your hosting platform.

### 3. CDN
Consider using a CDN for faster global access.

## SSL/HTTPS

Ensure your deployment uses HTTPS:
- Required for Google Maps API
- Required for Firebase services
- Better security and performance

## Backup Strategy

1. **Code Backup**
   - Use Git for version control
   - Regular commits and pushes
   - Multiple remote repositories

2. **Data Backup**
   - Export Firestore data regularly
   - Backup configuration files
   - Document deployment procedures

## Maintenance

### Regular Tasks
- [ ] Monitor API usage and costs
- [ ] Update dependencies
- [ ] Review security settings
- [ ] Backup data
- [ ] Test functionality

### Updates
- [ ] Keep Google Maps API updated
- [ ] Update Firebase SDK versions
- [ ] Monitor for security patches
- [ ] Test after updates

## Support

For deployment issues:
1. Check hosting platform documentation
2. Review error logs
3. Test locally first
4. Contact platform support
5. Check community forums 