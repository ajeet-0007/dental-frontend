import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: "0.0.0.0",
        port: 5173,
        allowedHosts: ["dental-frontend-0osw.onrender.com","dental-frontend-l6lddma3g-ajeet0007s-projects.vercel.app"],
        proxy: {
            "/api": {
                target: process.env.API_URL || "http://localhost:3000",
                changeOrigin: true,
            },
        },
    },
});
