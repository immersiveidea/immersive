# Feature Configuration Testing

This directory contains static JSON files for testing different user tiers locally.

## Available Configurations

### Default: `features` (none tier)
- **What you see**: Only the home page
- **All pages and features**: Disabled
- **Use case**: Unauthenticated users or when API is unavailable

### Free Tier: `features-free.json`
- **Pages**: All marketing pages + VR Experience
- **Features**: Basic diagram creation, management, immersive mode
- **Limits**: 6 diagrams max, 100MB storage
- **No access to**: Templates, private/encrypted designs, collaboration

### Basic Tier: `features-basic.json`
- **Pages**: All pages available
- **Features**: Free features + templates + private designs
- **Limits**: 25 diagrams max, 500MB storage
- **No access to**: Encrypted designs, collaboration

### Pro Tier: `features-pro.json`
- **Pages**: All pages available
- **Features**: Everything unlocked
- **Limits**: Unlimited (indicated by -1)

## How to Test Locally

### Method 1: Copy the file you want to test
```bash
# Test free tier
cp public/api/user/features-free.json public/api/user/features

# Test basic tier
cp public/api/user/features-basic.json public/api/user/features

# Test pro tier
cp public/api/user/features-pro.json public/api/user/features

# Test none/default (locked down)
cp public/api/user/features-none.json public/api/user/features
```

### Method 2: Symlink (easier for switching)
```bash
# Remove the default file
rm public/api/user/features

# Create a symlink to the tier you want to test
ln -s features-free.json public/api/user/features
# or
ln -s features-basic.json public/api/user/features
# or
ln -s features-pro.json public/api/user/features
```

## What Changes Between Tiers

| Feature | None | Free | Basic | Pro |
|---------|------|------|-------|-----|
| Pages (Examples, Docs, Pricing) | ❌ | ✅ | ✅ | ✅ |
| VR Experience | ❌ | ✅ | ✅ | ✅ |
| Create Diagram | ❌ | ✅ | ✅ | ✅ |
| Create From Template | ❌ | ❌ | ✅ | ✅ |
| Private Designs | ❌ | ❌ | ✅ | ✅ |
| Encrypted Designs | ❌ | ❌ | ❌ | ✅ |
| Share/Collaborate | ❌ | ❌ | ❌ | ✅ |
| Max Diagrams | 0 | 6 | 25 | ∞ |
| Storage | 0 | 100MB | 500MB | ∞ |

## Backend Implementation (Future)

When you're ready to implement the backend, create an endpoint at:
```
GET https://www.deepdiagram.com/api/user/features
```

The endpoint should:
1. Validate the Auth0 JWT token from `Authorization: Bearer <token>` header
2. Query the user's subscription tier from your database
3. Return JSON matching one of these structures based on their tier
4. Handle errors gracefully (401 for invalid token, 403 for unauthorized)

The frontend will automatically fall back to the static `features` file if:
- User is not authenticated
- API returns an error
- Network request fails
