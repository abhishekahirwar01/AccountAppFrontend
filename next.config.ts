// import type {NextConfig} from 'next';

// const nextConfig: NextConfig = {
//   /* config options here */
//   typescript: {
//     ignoreBuildErrors: true,
//   },
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   images: {
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'placehold.co',
//         port: '',
//         pathname: '/**',
//       },
//        {
//         protocol: 'https',
//         hostname: 'upload.wikimedia.org',
//       }
//     ],
//   },
//   experimental: {
//     serverComponentsExternalPackages: ['jspdf', 'jspdf-autotable', 'html2canvas'],
//   },
// };

// export default nextConfig;

import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Enable React Strict Mode only in development
  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

    // ✅ ADD THESE PERFORMANCE OPTIMIZATIONS:
  compiler: {
    // Remove console logs in production (reduces bundle size)
    removeConsole: isProd ? {
      exclude: ['error'], // Keep only error logs
    } : false,
    
    // Enable SWC minification (faster than Terser)
    reactRemoveProperties: isProd ? {
      properties: ['^data-testid$'], // Remove test attributes in prod
    } : false,
  },
  
  // ✅ Enable SWC minification
  swcMinify: true,
  
  // ✅ Compress output files
  compress: true,

  // ✅ Optimize images better
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
    // ✅ Add these image optimizations:
    formats: ['image/webp', 'image/avif'], // Modern formats
    minimumCacheTTL: 60, // Cache images for 60 seconds
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Optimized sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // For responsive images
  },

   // Optimize webpack configuration
  webpack: (config, { dev, isServer }) => {

      // Only optimize for production
    if (isProd && !isServer) {
      // Split chunks more aggressively
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Large react-based libraries
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              chunks: 'all',
              priority: 20,
            },
            // Utility libraries
            lib: {
              test: /[\\/]node_modules[\\/](lodash|moment|date-fns)[\\/]/,
              name: 'lib',
              chunks: 'all',
              priority: 15,
            },
            // Commons
            commons: {
              name: 'commons',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }

    
    if (dev && !isServer) {
      config.cache = {
        type: 'memory',
        maxGenerations: 1,
      };
    }
    return config;
  },

  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: "https",
  //       hostname: "placehold.co",
  //       port: "",
  //       pathname: "/**",
  //     },
  //     {
  //       protocol: "https",
  //       hostname: "upload.wikimedia.org",
  //     },
  //   ],
  // },
};

export default nextConfig;
