/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Images: allow Supabase storage domain once configured
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/surrey/tea-rooms',
        destination: '/cafes-brunch/',
        permanent: true,
      },
      {
        source: '/surrey/sports-bars',
        destination: '/pubs-bars/',
        permanent: true,
      },
      {
        source: '/surrey/arts-crafts',
        destination: '/kids-family/',
        permanent: true,
      },
      {
        source: '/surrey/theme-parks',
        destination: '/kids-family/',
        permanent: true,
      },
      {
        source: '/surrey/holiday-activities',
        destination: '/kids-family/',
        permanent: true,
      },
      {
        source: '/surrey/go-karting',
        destination: '/indoor-activities/',
        permanent: true,
      },
      {
        source: '/surrey/laser-tag',
        destination: '/indoor-activities/',
        permanent: true,
      },
      {
        source: '/surrey/swimming',
        destination: '/indoor-activities/',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self'",
              "connect-src 'self' https:",
              "frame-src https://www.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
