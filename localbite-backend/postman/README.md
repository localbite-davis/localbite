# Postman Workflow Suite (Dispatch + Bidding)

Files:
- `localbite-dispatch-workflow.postman_collection.json`
- `localbite-local.postman_environment.json`

## Import + Run

1. Start backend (`http://localhost:8000`) and Redis (for dispatch timer status/queues).
2. Import the collection and environment into Postman.
3. Select the `Localbite Local` environment.
4. Run requests in order starting from `00 - Initialize Run Variables`.

## CLI Testing Workflow (Newman)

### Preferred (from project root, local backend)

```bash
cd /Users/aryan/college_projects/localbite
./deploy_backend.sh
```

In a second terminal:

```bash
cd /Users/aryan/college_projects/localbite
./run_api_tests.sh
```

### 1. Start backend + Redis locally (direct script)

```bash
cd /Users/aryan/college_projects/localbite/localbite-backend
./scripts/start_backend_with_redis.sh
```

This script:
- checks whether Redis is already running
- tries to start Redis locally if needed
- starts FastAPI (`uvicorn main:app --reload`) with `REDIS_URL` set

### 2. Run the workflow from CLI (direct)

Option A (no install if `npx` is available):

```bash
cd /Users/aryan/college_projects/localbite/localbite-backend/postman
./run_newman_workflow.sh
```

Option B (`npm` scripts):

```bash
cd /Users/aryan/college_projects/localbite/localbite-backend/postman
npm install
npm run test:workflow
```

Useful flags:

```bash
./run_newman_workflow.sh --bail
./run_newman_workflow.sh --base-url http://localhost:8000
```

Artifacts are written to `postman/reports/` (JSON report + exported environment snapshot).

## Main Happy Path (Student Bid Accepted)

1. `00` Initialize variables
2. `01` Register User
3. `02` Register Restaurant
4. `03` Register Student Delivery Agent
5. `04` Register Normal Delivery Agent
6. `06` Fare Recommendation
7. `07` Create Order
8. `08` Start Dispatch (Fast Timers)
9. `09` Dispatch Status (Poll) (optional, observe `student_pool`)
10. `10` Place Student Bid (Phase 1)
11. `13` Accept Student Bid (Preferred)
12. `14` Get Order (Verify Assignment)
13. `15` Dispatch Status (After Acceptance)

## Timer Escalation Demo (`needs_fee_increase`)

Use the same registered entities and fare values.

1. `16` Timer Demo (Create 2nd Order)
2. `17` Timer Demo Start Dispatch (2nd Order)
3. Do not place/accept any bids.
4. Run `18` Timer Demo Dispatch Status (2nd Order)` repeatedly until status becomes `needs_fee_increase`.

## Notes

- Timer values are intentionally short in the environment (`6-8s` + `8s`) so you can test phase transitions quickly.
- `POST /api/v1/delivery-bids/{bid_id}/accept` updates order assignment and dispatch state in Redis.
- If Redis is not running, dispatch endpoints may fail or status updates may not persist.
- If registration/login crashes with a Passlib bcrypt error like `password cannot be longer than 72 bytes` on a normal password, pin `bcrypt<5` (Passlib 1.7.4 is incompatible with `bcrypt==5.x` backend self-checks).
