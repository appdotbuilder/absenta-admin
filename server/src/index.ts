import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  adminLoginInputSchema,
  validateAttendanceInputSchema,
  exportReportInputSchema
} from './schema';

// Import handlers
import { adminLogin } from './handlers/admin_login';
import { getDashboardStats } from './handlers/get_dashboard_stats';
import { getPendingAttendances } from './handlers/get_pending_attendances';
import { validateAttendance } from './handlers/validate_attendance';
import { exportAbsenceReport } from './handlers/export_absence_report';
import { getAbsenceSummary } from './handlers/get_absence_summary';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Admin authentication
  adminLogin: publicProcedure
    .input(adminLoginInputSchema)
    .mutation(({ input }) => adminLogin(input)),

  // Dashboard data endpoints
  getDashboardStats: publicProcedure
    .query(() => getDashboardStats()),

  // Attendance validation endpoints
  getPendingAttendances: publicProcedure
    .query(() => getPendingAttendances()),

  validateAttendance: publicProcedure
    .input(validateAttendanceInputSchema)
    .mutation(({ input }) => validateAttendance(input)),

  // Report generation endpoints
  exportAbsenceReport: publicProcedure
    .input(exportReportInputSchema)
    .mutation(({ input }) => exportAbsenceReport(input)),

  getAbsenceSummary: publicProcedure
    .input(exportReportInputSchema.pick({ class_name: true, start_date: true, end_date: true }))
    .query(({ input }) => getAbsenceSummary(input.class_name, input.start_date, input.end_date)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors({
        origin: process.env['CLIENT_URL'] || 'http://localhost:3000',
        credentials: true,
      })(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  
  server.listen(port);
  console.log(`🚀 ABSENTA TRPC server listening at port: ${port}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   - POST /adminLogin - Admin authentication`);
  console.log(`   - GET  /getDashboardStats - Dashboard statistics`);
  console.log(`   - GET  /getPendingAttendances - Pending attendance validations`);
  console.log(`   - POST /validateAttendance - Validate/reject attendance`);
  console.log(`   - POST /exportAbsenceReport - Export absence report`);
  console.log(`   - GET  /getAbsenceSummary - Get absence summary data`);
}

start().catch((error) => {
  console.error('❌ Failed to start ABSENTA server:', error);
  process.exit(1);
});