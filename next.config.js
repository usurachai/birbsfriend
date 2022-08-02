/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
        domains: ["dotconnex.mypinata.cloud"], //Domain of image host
    },
};

module.exports = nextConfig;
