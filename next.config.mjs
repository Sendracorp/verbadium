/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    // The course lived at the site root before the multi-course catalog.
    const base = '/courses/catalan-a1';
    return [
      { source: '/unit/:num', destination: `${base}/unit/:num`, permanent: true },
      { source: '/ipa', destination: `${base}/ipa`, permanent: true },
      { source: '/exam', destination: `${base}/exam`, permanent: true },
      { source: '/mock', destination: `${base}/mock`, permanent: true },
      { source: '/glossary', destination: `${base}/glossary`, permanent: true },
    ];
  },
};
export default nextConfig;
