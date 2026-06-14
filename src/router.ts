import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('./layouts/AppLayout.vue'),
    children: [
      { path: '', component: () => import('./pages/DashboardPage.vue') },
      { path: 'patients', component: () => import('./pages/PatientsPage.vue') },
      { path: 'patients/:id', component: () => import('./pages/PatientDetailPage.vue') },
      { path: 'appointments', component: () => import('./pages/AppointmentsPage.vue') },
      { path: 'appointments/:id', component: () => import('./pages/AppointmentDetailPage.vue') },
      { path: 'treatments', component: () => import('./pages/TreatmentsPage.vue') },
      { path: 'prescriptions/create', component: () => import('./pages/CreatePrescriptionPage.vue') },
      { path: 'scribe',               component: () => import('./pages/ScribePage.vue')        },
      { path: 'billing/plan',         component: () => import('./pages/TreatmentPlanPage.vue') },
      { path: 'billing/investigate',  component: () => import('./pages/InvestigationPage.vue') },
      { path: 'billing/due',          component: () => import('./pages/DueCollectionPage.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.onError((error) => {
  if (/Failed to fetch dynamically imported module|Failed to fetch|error loading dynamically imported module/i.test(error.message)) {
    window.location.reload()
  }
})

export default router
