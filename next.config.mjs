/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  devIndicators: {
    appIsrStatus: false, // Oculta el indicador de rutas estáticas (el menú que ves)
    buildActivity: false, // Oculta el indicador de actividad de compilación
  },
};

export default nextConfig;
