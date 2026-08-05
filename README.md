# Gourmet Queue - Restaurant Queue Management System

A production-ready, high-fidelity Restaurant Queue Management System built with a **Laravel 13 API** backend and an interactive **React 19 + TypeScript** Single Page Application frontend.

---

## 1. Project Overview

Gourmet Queue is designed to automate table assignments, manage waiting lists, track dining durations in real-time, and log historic transactions. The system handles seating constraints dynamically across 4 tables with varying capacities (2, 4, 6, and 8 seats) and operates a customized priority-based queue where larger parties wait at the front.

---

## 2. Tech Stack

- **Backend**:
  - **Laravel 13 API** & **PHP 8.3+**
  - **SQLite** (for unit/feature testing & local development) or **PostgreSQL** (for production environment)
  - **Redis** (for session cache and job queuing)
  - **PHPUnit** (backend testing framework)
- **Frontend**:
  - **React 19** & **Vite**
  - **TypeScript** & **Tailwind CSS (v4)**
  - **Zustand** (for global UI, search, and filter states)
  - **TanStack Query / React Query** (for REST API cache and data synchronization)
  - **Vitest** + **React Testing Library** (frontend testing framework)
- **Containerization**:
  - **Docker** (multi-stage PHP build) & **Docker Compose**

---

## 3. Architecture & Clean Code Design

The application adheres to clean architecture guidelines and SOLID principles:
1. **Separation of Concerns**: Logic is decoupled. The Controller handles routing and request formatting, Form Requests manage request validations, API Resources serialize database payloads, and the Service Layer encapsulates domain business logic.
2. **Service Layer Pattern**: Core operations (arrivals, seating calculations, checkout releases, priority queue re-evaluation) are isolated inside [QueueService.php](file:///c:/Users/Wahyu%20Nur/OneDrive/Desktop/Restaurant%20queue%20system/app/Services/QueueService.php).
3. **Database Transactions**: Any state changes affecting both customers and tables are run in an Eloquent transaction wrapper (`DB::transaction`) to prevent dirty writes or partial updates in case of failure.
4. **Eager Loading**: Relations are eager loaded (`with('activeCustomer')`, `with('table')`) to prevent `N+1` query overhead on bulk queries like status checks and historical pagination.
5. **Security Measures**:
   - Safe column mapping lists prevent raw user input from reaching `orderBy` clauses, mitigating SQL Injection risks.
   - Form Requests validate that party sizes are integers >= 1, protecting from invalid allocations.
   - Clean Eloquent `$fillable` models prevent Mass Assignment vulnerabilities.

---

## 4. Folder Structure

```
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── QueueController.php      # Router controller
│   │   ├── Requests/
│   │   │   ├── ArriveRequest.php        # Input validator for arrival
│   │   │   └── SeatRequest.php          # Input validator for manual seating
│   │   └── Resources/
│   │       ├── CustomerResource.php     # Formatter for customer
│   │       ├── TableResource.php        # Formatter for tables
│   │       └── HistoryResource.php      # Formatter for history logs
│   ├── Models/
│   │   ├── Table.php                    # Table model
│   │   ├── Customer.php                 # Customer model
│   │   └── History.php                  # History audit log model
│   └── Services/
│       └── QueueService.php             # Core domain logic
├── database/
│   ├── factories/
│   │   ├── TableFactory.php             # Factory mock for tables
│   │   ├── CustomerFactory.php          # Factory mock for customers
│   │   └── HistoryFactory.php           # Factory mock for history
│   ├── migrations/
│   │   ├── 2026_08_05_063855_create_tables_table.php
│   │   ├── 2026_08_05_063856_create_customers_table.php
│   │   └── 2026_08_05_063857_create_histories_table.php
│   └── seeders/
│       └── DatabaseSeeder.php           # Seeds Table A, B, C, D
├── resources/
│   ├── css/
│   │   └── app.css                      # Tailwind imports and theme fonts
│   ├── js/
│   │   ├── app.tsx                      # SPA mount entrypoint
│   │   ├── types/                       # TypeScript interfaces
│   │   ├── store/                       # Zustand store
│   │   ├── hooks/                       # React Query hooks
│   │   ├── components/                  # React UI components
│   │   └── test/                        # Vitest setups and testing suites
│   └── views/
│       └── welcome.blade.php            # Laravel root container
├── tests/
│   └── Feature/
│       └── QueueTest.php                # 8 backend test cases
├── Dockerfile                           # Production Docker setup
├── docker-compose.yml                   # Docker Compose config
└── tsconfig.json                        # TS compiler settings
```

---

## 5. Installation & Setup

### 5.1 Environment Variables
Create a local `.env` configuration file inside the root:
```bash
cp .env.example .env
```
Ensure the database and cache drivers are set (defaults to SQLite for local ease):
```ini
DB_CONNECTION=sqlite
QUEUE_CONNECTION=database
CACHE_STORE=database
```

### 5.2 Running Locally
1. Install dependencies:
   ```bash
   composer install
   npm install
   ```
2. Build Vite assets:
   ```bash
   npm run build
   ```
3. Initialize the SQLite database and seed:
   ```bash
   php artisan migrate:fresh --seed
   ```
4. Boot the Laravel application server:
   ```bash
   php artisan serve --port=8080
   ```
5. Run the Vite development compiler (in a separate terminal):
   ```bash
   npm run dev
   ```
6. Visit [http://localhost:8080](http://localhost:8080) to access the system.

### 5.3 Running via Docker
You can spin up the complete production-configured environment (PHP container, PostgreSQL, and Redis) with one command:
```bash
docker-compose up --build -d
```
The Docker setup will automatically install Composer & NPM libraries, run migrations and database seeding, build Vite production assets, and expose the app on port **8000**. Open [http://localhost:8000](http://localhost:8000) to view the running app.

---

## 6. Running Tests

### 6.1 Backend Tests (PHPUnit)
Verifies 8 specific business scenarios (validations, table sizing, priority order sorting, seat locking, completion releases, auto-allocation):
```bash
php artisan test
```

### 6.2 Frontend Tests (Vitest)
Verifies 6 React dashboard requirements (layouts rendering, timer ticking using `Date.now()`, table state coloring, drag-and-drop actions, filtering):
```bash
npx vitest run
```

---

## 7. API Documentation

### `POST /api/arrive`
- **Description**: Registers a customer arrival and seats them at the smallest available table that fits, or places them in queue.
- **Payload**:
  ```json
  {
    "name": "Jane Doe",
    "party_size": 4
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Customer seated at Table B.",
    "data": {
      "id": 1,
      "name": "Jane Doe",
      "party_size": 4,
      "status": "seated",
      "table_id": 2,
      "arrived_at": "2026-08-05T07:00:00Z",
      "started_at": "2026-08-05T07:00:00Z",
      "ended_at": "2026-08-05T08:10:00Z",
      "duration_minutes": 70,
      "remaining_seconds": 4200
    }
  }
  ```

### `GET /api/status`
- **Description**: Returns all tables, the prioritized waiting queue, and active customers.
- **Response** (200 OK): Contains lists for `tables`, `waiting_queue`, and `active_customers`.

### `POST /api/serve/{customer}`
- **Description**: Force completes a seated customer's meal, vacating the table and automatically seating the next eligible customer in queue.
- **Response** (200 OK): Contains `completed_customer` and `next_customer` objects.

### `POST /api/seat`
- **Description**: Seated a waiting customer onto an available table (validates capacity). Used to persist Drag & Drop.
- **Payload**:
  ```json
  {
    "customer_id": 5,
    "table_id": 2
  }
  ```

### `GET /api/history`
- **Description**: Fetches paginated customer transaction history.
- **Query Params**: `page`, `per_page`, `sort_by` (name, party, table, duration, status, date), `sort_order` (asc, desc), `search`, `status`, `party_size`

---

## 8. Key Design Decisions

1. **Countdown Syncing via Date.now()**: Rather than implementing manual count ticking in component intervals (which drifts when tabs lose focus or lag), we calculate the difference between the customer's database `ended_at` timestamp and the browser's current `Date.now()`. We trigger a lightweight global tick state every second to prompt card re-renders.
2. **Auto-seating on Checkout**: Freeing a table does not pull the oldest customer (FIFO). Instead, it searches the waiting queue, filters for customers whose party size is <= the freed table's capacity, and seats the highest priority customer (largest party size first).
3. **Manually Seating Endpoint**: To support persistence for Drag & Drop actions, we implemented the `/api/seat` endpoint which validates the seating operation (checking status and capacity) before saving.

---

## 9. CI/CD

This project uses **GitHub Actions** for continuous integration.
[![CI/CD Pipeline](https://github.com/Waynra/Restaurant-queue-sistem/actions/workflows/ci.yml/badge.svg)](https://github.com/Waynra/Restaurant-queue-sistem/actions/workflows/ci.yml)

The pipeline is triggered automatically on every `push` and `pull_request` to the main branches. It executes the following steps sequentially inside a unified workflow runner:
1. **Checkout Repository**: Pulls down the latest code version.
2. **Setup PHP**: Sets up PHP version 8.3 with necessary extensions (sqlite, mbstring, pdo).
3. **Install Dependencies**: Downloads Composer packages with optimized autoloading.
4. **Environment Setup**: Configures testing `.env` variables and registers application encryption key.
5. **Run Backend Tests**: Runs migrations and boots the PHPUnit feature and unit test suites.
6. **Setup Node.js**: Installs Node 20 environment with npm cache enabled.
7. **Run Frontend Tests**: Runs Vitest component unit test suites in non-interactive mode (`npm test`).
8. **Build Assets**: Compiles production-optimized JS/CSS and creates the required manifest map.

---

## 10. Bonus – Revenue Optimization

### Problem Statement
In a busy restaurant, seat utilization directly maps to revenue. If a small party (e.g., 2 guests) arrives when only a large table (e.g., Table D with a capacity of 8) is vacant, seating them immediately resolves their wait but creates an inefficiency:
- Six potential seats are wasted ("oversize seating").
- If a large party (e.g., 7 or 8 guests) subsequently arrives, they are forced into the waiting queue, leading to longer queue lines, prospective client loss, and reduced average transaction size.

### Proposed Strategy: "Soft Hold" on Large Tables
Instead of immediately seating a small party at a large table, we implement a **Soft Hold** policy:
- Keep the large table reserved for large parties for a short buffer period (e.g., `HOLD_LIMIT = 5 minutes`).
- If an eligible large party arrives within this window, they are seated immediately, maximizing capacity usage.
- If the hold timer expires and no large party arrives, the hold is released, and the table is offered to the waiting small party to maintain high table turnover.

### Strategy Pseudocode
```python
if small_table_available:
    assign()
elif only_large_table_available:
    if waiting_time < HOLD_LIMIT:
        keep_waiting()  # Maintain hold to reserve for larger groups
    else:
        assign_large_table()  # Release hold to prevent empty table idle time
```

### Trade-Off Analysis
- **Pros**:
  - **Better capacity utilization**: Dramatically increases seat occupancy during rush hours.
  - **Higher ticket size / revenue**: Prioritizes higher-paying large groups.
  - **Optimized queue management**: Prevents large groups from walking away due to excessive wait times.
- **Cons**:
  - **Longer wait for small groups**: Small parties might experience minor initial delays.
  - **Tuning complexity**: The hold limit threshold must be dynamically adjusted (e.g., longer holds during dinner rush, shorter/zero holds during off-peak hours).
