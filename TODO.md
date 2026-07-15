## Phase A (Basic) — Auth + RBAC + CRUD + Multi-criteria Search/Filter + CSV Export
- [x] A1: Add `role` to `users` schema (RBAC foundation)
- [x] A2: Implement `requireRole` middleware in `server/routes.ts`
- [ ] A3: Ensure registration defaults to `user` role (and admin bootstrap strategy if needed)
- [ ] A4: Confirm `/api/auth/me` returns role to frontend
- [x] A5: Implement server-side filtering/search for items (multi-criteria + pagination)
- [x] A6: Update dashboard UI to call the server with filter criteria
- [x] A7: Add CSV export endpoint matching current filters
- [x] A8: Add “Export CSV” UI button on dashboard


## Phase B — UX + Charts + Excel/PDF (intermediate)
- [ ] Dark/light mode toggle + theme-aware charts/tables
- [ ] Improve charts to respond to filters
- [ ] Add Excel (XLSX) export
- [ ] Add PDF export

## Phase C — Widgets + Analytics + AI (advanced)
- [ ] Customizable dashboard widgets (drag/resize + persisted layout per user)
- [ ] KPIs + performance metrics endpoint
- [ ] Audit logs UI polish + consistent audit trail
- [ ] Recommendations endpoint (trend signals + AI summaries)

