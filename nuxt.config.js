export default defineNuxtConfig({
  telemetry: false,
  ssr: true,

  app: {
    head: {
      title: 'PHR 預約取藥',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'SMART on FHIR PHR 病患端' },
      ],
    },
  },

  routeRules: {
    '/': { redirect: '/login' },
    '/appointment_home': { redirect: '/appointment' },
    '/appointment_make': { redirect: '/appointment/make' },
    '/appointment_view': { redirect: '/appointment/view' },
    '/medicationRequest_medicinelist': { redirect: '/medication' },
  },

  nitro: {
    routeRules: {
      '/api/**': {
        cors: true,
        headers: { 'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE' },
      },
    },
  },

  compatibilityDate: '2026-09-24',
});