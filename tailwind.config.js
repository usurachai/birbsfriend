/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                PixeloidMono: ["PixeloidMono"],
            },
            animation: {
                bounce_3: "bounce 0.6s infinite",
            },
        },
    },
    plugins: [],
};
