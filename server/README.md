```markdown
# JobMug API (Express + MongoDB) — Two-sided (Seekers & Recruiters)

This extends the minimal job board with authentication and role-based features:
- Roles: seeker, recruiter, admin
- Recruiters can create/update/delete jobs and view applicants for jobs they posted
- Seekers can apply to jobs
- JWT-based auth (register/login)

## Quick start

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and set values:
   - MONGO_URI (example: mongodb://localhost:27017/job-board)
   - PORT
   - JWT_SECRET

3. Run in development:
   ```
   npm run dev
   ```

4. API base: `http://localhost:3000/api/`

## New endpoints

Auth
- POST /api/auth/register
  - Body: { name, email, password, role?: "seeker"|"recruiter", company?: string (required if recruiter) }
  - Returns: { token, user }

- POST /api/auth/login
  - Body: { email, password }
  - Returns: { token, user }

- GET /api/auth/me
  - Requires Authorization: Bearer <token>

Jobs (unchanged public listing + role-protected operations)
- GET /api/jobs
- POST /api/jobs (recruiter|admin) — create job
- GET /api/jobs/:id
- PUT /api/jobs/:id (recruiter who posted | admin)
- DELETE /api/jobs/:id (recruiter who posted | admin)
- POST /api/jobs/:id/apply (seeker) — apply to a job
  - Body: { coverLetter?, resumeUrl? }
- GET /api/jobs/:id/applicants (recruiter who posted | admin)

## Example - register recruiter
```
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@company.com","password":"secret123","role":"recruiter","company":"Acme Inc"}'
```

## Example - apply as seeker
1. Register as a seeker and login to get token
2. Apply:
```
curl -X POST http://localhost:3000/api/jobs/<jobId>/apply \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"coverLetter":"I am excited to apply","resumeUrl":"https://example.com/resume.pdf"}'
```

## Next recommended enhancements
- Email verification and password reset
- Rate limiting, request throttling, and security headers
- File upload (resume) to S3 or signed URLs
- Pagination and filtering for applicants
- Add automated tests (Jest + Supertest)
- Add role management UI and admin dashboards
```