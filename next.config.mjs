/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      //This is for s3 bucket
      {
        protocol:"https",
        hostname:"*.amazonaws.com",
        pathname:"/**",
      },
    ],
  },
  serverExternalPackages:["@prisma/client", "bcryptjs", "jsonwebtoken"],
};

export default nextConfig;
