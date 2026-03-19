# 🐺 Wolf — Gym Equipment & Warehouse Management System

## Frontend Developer Guide

---

## Table of Contents

1. [What is Wolf?](#1-what-is-wolf)
2. [Who Uses Wolf?](#2-who-uses-wolf)
3. [Core Concepts](#3-core-concepts)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Module Guide](#5-module-guide)
6. [Status Flows & Lifecycles](#6-status-flows--lifecycles)
7. [API Overview](#7-api-overview)
8. [API Response Format](#8-api-response-format)
9. [Error Handling](#9-error-handling)
10. [Pagination, Filtering & Sorting](#10-pagination-filtering--sorting)
11. [File Uploads](#11-file-uploads)
12. [Notifications](#12-notifications)
13. [Dashboard & Analytics](#13-dashboard--analytics)
14. [Postman Collection Usage](#14-postman-collection-usage)

---

## 1. What is Wolf?

Wolf is a system that manages gym equipment across multiple gym branches. Unlike simple inventory systems that just count items ("we have 10 dumbbells"), Wolf tracks **every single physical piece of equipment individually**.

Each dumbbell, each treadmill, each cable machine has its own unique barcode, its own condition history, its own maintenance records, and can be tracked as it moves between branches.

Think of it like a hospital tracking individual medical devices — every piece matters and needs to be accounted for.

### Key Features at a Glance

- **Multi-branch management**: Multiple gym locations under one system
- **Individual item tracking**: Every piece of equipment has a unique barcode
- **Component tracking (BOM)**: A Smith Machine is made of bars, cables, pulleys — each tracked separately
- **Transfer management**: Move equipment between branches with approval workflows
- **Maintenance management**: Report issues, schedule preventive maintenance, track repairs
- **Procurement**: Purchase orders to suppliers with receiving workflow
- **Smart analytics**: Health scores, depreciation, predictive maintenance, cost analysis
- **Dynamic permissions**: Create custom roles with granular permissions from the dashboard
- **Full audit trail**: Every action is logged — who did what, when, and where

---

## 2. Who Uses Wolf?

Wolf has a **dynamic role-based access control (RBAC)** system. Roles are NOT hardcoded — they are created and customized from the dashboard. However, these are the typical user types:

| Typical Role | What They Do |
|---|---|
| **Super Admin** | Full access to everything across all branches. Manages users, roles, and system settings. |
| **Branch Manager** | Manages a single branch — its equipment, staff, maintenance, and transfers. Cannot see other branches. |
| **Warehouse Keeper** | Handles receiving new equipment, organizing warehouses, processing transfers in/out. |
| **Maintenance Technician** | Reports issues, performs repairs, updates equipment condition, replaces components. |
| **Viewer / Auditor** | Read-only access to reports and audit logs. |

**Important for frontend**: A user with `branch_id` set can ONLY see data from their branch. A user with `branch_id = null` (like Super Admin) sees everything across all branches. Your UI should adapt accordingly.

---

## 3. Core Concepts

### 3.1 The Three-Layer Product Model

This is the most important concept to understand:

```
Category (top level)
  └── Product (definition)
       └── Item (physical piece)
```

**Category** = General classification
- Examples: "Free Weights", "Cardio Equipment", "Cable Machines"
- Can be nested (parent/child): "Free Weights" → "Dumbbells", "Barbells"

**Product** = A type of equipment (the blueprint)
- Example: "Adjustable Dumbbell 20kg" (SKU: DM-ADJ-20KG)
- Has brand, model, specifications, default warranty, expected lifespan
- Has images
- May have a Bill of Materials (BOM)

**Item** = A single physical unit (the real thing)
- Example: The specific dumbbell with barcode `WLF-BG01-DM20-00142`
- Has unique barcode + QR code
- Has its own: condition, health score, location, maintenance history, purchase info
- Belongs to ONE warehouse at a time
- You might have 10 Items of the same Product

### 3.2 Bill of Materials (BOM)

Some equipment is made of multiple components. A BOM defines what parts make up a product:

```
Smith Machine (Product)
├── Steel Frame (component)
├── Barbell Bar (component)
├── Cable Set (component) × 2
├── Pulley (component) × 4
└── Safety Hooks (component) × 2
```

Each component is itself a Product, and when installed in a specific Item, the actual physical component (also an Item) is tracked. So if a cable breaks, you know:
- Which specific cable (Item) broke
- On which specific Smith Machine (Item) it was installed
- When it was installed and by whom
- What replacement was used

### 3.3 Barcode System

Every Item gets two codes auto-generated on creation:

- **Barcode (Code128)**: `WLF-BG01-DM20-00142`
  - WLF = Wolf system prefix
  - BG01 = Branch code (Baghdad branch 01)
  - DM20 = Product SKU abbreviation
  - 00142 = Sequential number
- **QR Code**: Contains the same data or a URL

Both are generated as images stored in Cloudflare R2.

### 3.4 Money & Currency

All monetary values use this format:
```json
{
  "amount": 1500.00,
  "currency": "USD"
}
```
Supported currencies: `USD`, `IQD`. Exchange rates are managed in the system.

### 3.5 Warehouses vs Branches

- A **Branch** = A physical gym location (e.g., "Wolf Gym Baghdad")
- A **Warehouse** = A storage area within or serving a branch
- One branch can have multiple warehouses:
  - Main warehouse (the gym floor equipment)
  - Spare parts warehouse
- There can be a **Central warehouse** that serves all branches
- Every Item must be in exactly ONE warehouse at any time

---

## 4. Authentication & Authorization

### 4.1 Auth Flow

Wolf uses **JWT with Access + Refresh tokens**:

```
1. POST /api/v1/auth/login
   Body: { "email": "...", "password": "..." }
   Response: { "access_token": "...", "refresh_token": "...", "expires_in": 900 }

2. Use access_token in all requests:
   Header: Authorization: Bearer <access_token>

3. When access_token expires (15 min), refresh it:
   POST /api/v1/auth/refresh
   Body: { "refresh_token": "..." }
   Response: { "access_token": "NEW...", "refresh_token": "NEW...", "expires_in": 900 }

4. Logout:
   POST /api/v1/auth/logout
   (Invalidates the refresh token server-side)
```

**Important**: When you refresh, you get a NEW refresh token too (token rotation). The old refresh token becomes invalid. Always store the latest refresh token.

### 4.2 Token Storage

- Store `access_token` in memory (or short-lived storage)
- Store `refresh_token` in httpOnly cookie or secure storage
- Never store tokens in localStorage if security is a concern

### 4.3 Handling Token Expiry

When you get a `401` with error code `1002` (Token expired):
1. Call `/auth/refresh` with your refresh token
2. If refresh succeeds → retry the original request with new token
3. If refresh fails (code `1004` or `1005`) → redirect to login page

### 4.4 Dynamic RBAC (Permissions)

Permissions follow the pattern: `resource:action`

**Resources**: branches, warehouses, categories, products, items, bom, transfers, maintenance, procurement, suppliers, users, roles, reports, analytics, notifications, disposals, alert_rules, audit_logs, settings

**Actions**: create, read, update, delete, approve, assign, export, rate, check_in, check_out, manage

A role is a collection of permissions. Example:

```json
{
  "name": "Branch Manager Baghdad",
  "permissions": [
    { "resource": "items", "actions": ["create", "read", "update"] },
    { "resource": "transfers", "actions": ["create", "read", "approve"] },
    { "resource": "maintenance", "actions": ["create", "read", "update", "assign"] },
    { "resource": "reports", "actions": ["read", "export"] },
    { "resource": "users", "actions": ["read"] }
  ]
}
```

**For the frontend**:
- After login, call `GET /auth/me` to get the user's role and permissions
- Use permissions to show/hide UI elements (buttons, menu items, pages)
- If a user tries to access something they don't have permission for, the API returns `403` with code `2001`

### 4.5 Branch Scoping

If the logged-in user has a `branch_id`:
- All list endpoints automatically filter to show only that branch's data
- The user cannot see or modify data from other branches
- If they try, they get `403` with code `2002`

If `branch_id` is `null`:
- User sees data from ALL branches
- UI should show a branch filter/selector

---

## 5. Module Guide

### 5.1 Branches
Manage gym locations. Each branch has a name, code, address, city, phone, email, assigned manager, and status (active/inactive/under_maintenance).

**Key endpoints**:
- `GET /branches` — List all branches (with stats)
- `POST /branches` — Create new branch
- `GET /branches/:id/stats` — Branch statistics (equipment count, total value, etc.)

### 5.2 Warehouses
Storage locations within branches. Types: main (gym floor), spare_parts, central.

**Key endpoints**:
- `GET /warehouses?branch_id=xxx` — List warehouses, filterable by branch
- `GET /warehouses/:id/items` — All items in a specific warehouse
- `GET /warehouses/:id/stats` — Warehouse statistics

### 5.3 Categories
Hierarchical classification of equipment. Can be nested (parent → child).

**Key endpoints**:
- `GET /categories` — Returns tree structure (parents with children)

### 5.4 Products
Equipment definitions (blueprints). Each product has SKU, brand, model, specs, images, warranty info, expected lifespan.

**Key endpoints**:
- `GET /products?category_id=xxx&brand=xxx` — Search/filter products
- `GET /products/:id` — Full details including BOM if exists
- `GET /products/:id/items` — All physical items of this product
- `POST /products/:id/images` — Upload product images (multipart/form-data)

### 5.5 Items (Core Module)
Individual physical equipment pieces. This is the heart of the system.

**Key endpoints**:
- `GET /items?branch_id=xxx&status=available&condition=good&tags=VIP` — Rich filtering
- `GET /items/barcode/:barcode` — Lookup by barcode scan
- `GET /items/qr/:qrCode` — Lookup by QR scan
- `POST /items/:id/check-out` — Check out equipment
- `POST /items/:id/check-in` — Check in equipment
- `GET /items/:id/history` — Full lifecycle timeline
- `GET /items/:id/components` — Installed components
- `GET /items/:id/maintenance-prediction` — AI-predicted next failure

**Item statuses**: `available`, `in_use`, `maintenance`, `damaged`, `disposed`, `reserved`, `in_transit`

**Item conditions**: `new`, `good`, `fair`, `poor`, `broken`

**Health score**: 0-100, color coded:
- 🟢 Green: 70-100 (healthy)
- 🟡 Yellow: 40-69 (needs attention)
- 🔴 Red: 0-39 (critical)

### 5.6 Bill of Materials (BOM)
Defines what components make up a product. Only applicable to products with `has_bom: true`.

**Key endpoints**:
- `GET /bom/:productId` — Get component list for a product
- `POST /items/:id/components` — Install a component in a specific item
- `PUT /items/:id/components/:componentId/replace` — Replace a broken component

### 5.7 Transfers
Move equipment between warehouses/branches. Has an approval workflow.

**Lifecycle**: Draft → Pending Approval → Approved → In Transit → Received (or Cancelled at any early stage)

**Key endpoints**:
- `POST /transfers` — Create transfer request
- `POST /transfers/:id/submit` — Submit for approval
- `POST /transfers/:id/approve` — Approve (by authorized user)
- `POST /transfers/:id/ship` — Mark as shipped (updates all items to "in_transit")
- `POST /transfers/:id/receive` — Confirm receipt (moves items to new warehouse)

### 5.8 Maintenance
Report and track equipment repairs. Has assignment and approval workflows.

**Lifecycle**: Reported → Pending Approval → Approved → In Progress → Completed (or Waiting Parts → back to In Progress)

**Types**: `corrective` (something broke), `preventive` (scheduled), `inspection` (routine check)

**Key endpoints**:
- `POST /maintenance` — Report an issue
- `POST /maintenance/:id/assign` — Assign to technician
- `POST /maintenance/:id/complete` — Mark as done (with cost, diagnosis, resolution)
- `GET /maintenance/schedules` — View scheduled maintenance
- `GET /maintenance/upcoming` — What's coming up soon

### 5.9 Procurement & Suppliers
Manage suppliers and purchase orders for new equipment or spare parts.

**Supplier rating**: Each supplier has ratings for delivery_speed, quality, pricing (0-5 scale).

**Purchase Order lifecycle**: Draft → Pending Approval → Approved → Ordered → Partially Received → Received

**Key endpoints**:
- `POST /suppliers/:id/rate` — Rate a supplier
- `POST /purchase-orders` — Create PO
- `POST /purchase-orders/:id/receive` — Record receipt of goods (creates new Items)

### 5.10 Check-in / Check-out
Track when equipment moves from warehouse to gym floor (or to a specific person/area).

- **Check-out**: Item status changes to `in_use`, records who took it, expected return date
- **Check-in**: Item returns to `available`, records condition at return

### 5.11 Disposals
Formally retire equipment from service.

**Lifecycle**: Pending Approval → Approved → Completed (or Rejected)

Records: reason (end_of_life, irreparable, obsolete, upgrade), method (scrapped, sold, donated, recycled), sale value, book value at disposal.

### 5.12 Tags
Flexible labels you can attach to any item. Examples: "VIP", "needs-replacement", "outdoor", "rented".

- Tags have a name, color (hex), and description
- Items can have multiple tags
- Tags enable custom filtering not possible with fixed categories

### 5.13 Notifications
Central notification system. Types:
- `warranty_expiry` — Equipment warranty ending soon
- `maintenance_due` — Scheduled maintenance upcoming
- `transfer_pending` — Transfer awaiting your approval
- `alert_triggered` — Custom alert rule triggered
- `approval_needed` — Something needs your approval
- `disposal_pending` — Disposal awaiting approval

Each has a severity: `info`, `warning`, `critical`

**Key endpoints**:
- `GET /notifications` — List user's notifications
- `GET /notifications/unread-count` — Badge count
- `PUT /notifications/:id/read` — Mark as read
- `PUT /notifications/read-all` — Mark all as read

### 5.14 Alert Rules
User-defined custom alerts. Created from the dashboard.

Example: "Notify me if any item has health_score < 30 AND age > 3 years"

**Key endpoints**:
- `POST /alert-rules` — Create rule
- `POST /alert-rules/:id/toggle` — Enable/disable
- `POST /alert-rules/:id/test` — Test rule (dry run, shows what would match)

### 5.15 Audit Logs
Immutable log of every action in the system.

Each entry records: who (user), what (action), when (timestamp), where (branch), what changed (before/after), IP address.

**Key endpoints**:
- `GET /audit-logs?user_id=xxx&action=item.create&resource_type=item` — Filter logs
- `GET /audit-logs/resource/:type/:id` — All logs for a specific resource (e.g., all logs for item X)

### 5.16 Activity Feed
A timeline of recent actions across the system. Shows human-readable entries like:
- "Ahmed transferred 5 dumbbells from Baghdad to Erbil"
- "Sara completed maintenance on Smith Machine #234"
- "Ali checked out Treadmill #089 to Zone B"

**Key endpoints**:
- `GET /activity-feed?branch_id=xxx` — Recent activity, filterable by branch

### 5.17 Analytics & Dashboard
Aggregated data for decision making.

**Available reports**:
- `GET /analytics/dashboard` — Overview: total equipment, total value, pending transfers, upcoming maintenance, health distribution
- `GET /analytics/equipment-value` — Total value by branch
- `GET /analytics/maintenance-costs` — Cost analysis by branch/period
- `GET /analytics/health-overview` — Health score distribution (green/yellow/red counts)
- `GET /analytics/depreciation-report` — Current value vs purchase value
- `GET /analytics/supplier-performance` — Compare suppliers by rating
- `GET /analytics/branch-comparison` — Side-by-side branch comparison
- `GET /analytics/top-failing-equipment` — Most frequently failing equipment
- `GET /analytics/warranty-expiring` — Equipment with warranties expiring soon
- `GET /analytics/maintenance-prediction` — Predicted upcoming maintenance needs

### 5.18 Bulk Operations
Perform actions on multiple items at once.

- `POST /bulk/items/transfer` — Bulk transfer items to another warehouse
- `POST /bulk/items/update-status` — Change status of multiple items
- `POST /bulk/items/update-tags` — Add/remove tags on multiple items
- `POST /bulk/items/assign-zone` — Assign zone to multiple items
- `POST /bulk/items/generate-barcodes` — Generate barcode images for multiple items

### 5.19 Export
Export data as CSV files.

- `POST /export/items` — Export items list
- `POST /export/maintenance` — Export maintenance records
- `POST /export/transfers` — Export transfer history
- `POST /export/analytics/:reportType` — Export analytics report as PDF

### 5.20 Currency
Multi-currency support (USD, IQD).

- `GET /currencies/rates` — Current exchange rates
- `POST /currencies/rates` — Set new rate (admin only)
- `GET /currencies/convert?amount=100&from=USD&to=IQD` — Convert amount

---

## 6. Status Flows & Lifecycles

### 6.1 Item Status Flow

```
[NEW ITEM CREATED] → available
    │
    ├── Check-out ────────→ in_use ──── Check-in ────→ available
    │
    ├── Maintenance reported ─→ maintenance ─ Completed ─→ available
    │
    ├── Transfer shipped ────→ in_transit ── Received ──→ available (new warehouse)
    │
    ├── Marked damaged ──────→ damaged ─── Repaired ───→ available
    │
    ├── Reserved ────────────→ reserved ── Released ───→ available
    │
    └── Disposal completed ──→ disposed (FINAL - item is no longer active)
```

### 6.2 Transfer Lifecycle

```
draft ──→ pending_approval ──→ approved ──→ in_transit ──→ received ✓
  │              │                                            
  └── cancelled  └── cancelled (rejected)
```

- **draft**: Transfer created but not submitted. Can be edited freely.
- **pending_approval**: Submitted, waiting for approval. Cannot be edited.
- **approved**: Approved by authorized user. Ready to ship.
- **in_transit**: Items physically moving. All items marked "in_transit".
- **received**: Destination confirmed receipt. Items moved to new warehouse.
- **cancelled**: Cancelled at any point before shipping.

### 6.3 Maintenance Lifecycle

```
reported ──→ pending_approval ──→ approved ──→ in_progress ──→ completed ✓
                    │                              │
                    └── cancelled                   └── waiting_parts ──→ in_progress
```

- **reported**: Issue reported by any user.
- **pending_approval**: Needs manager approval (for expensive repairs).
- **approved**: Approved, waiting to be assigned or started.
- **in_progress**: Technician actively working on it.
- **waiting_parts**: Need spare parts, paused.
- **completed**: Repair done, cost recorded, item back to available.
- **cancelled**: Issue was not real or resolved itself.

### 6.4 Purchase Order Lifecycle

```
draft ──→ pending_approval ──→ approved ──→ ordered ──→ partially_received ──→ received ✓
                 │                                              │
                 └── cancelled                                  └── (keep receiving until all items arrive)
```

### 6.5 Disposal Lifecycle

```
pending_approval ──→ approved ──→ completed ✓
         │
         └── rejected
```

---

## 7. API Overview

**Base URL**: `https://your-domain.com/api/v1`

**All requests require** (except login/refresh):
```
Header: Authorization: Bearer <access_token>
Header: Content-Type: application/json
```

**Full Endpoint List by Module**:

### Auth (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login, returns tokens |
| POST | `/auth/refresh` | Refresh access token |

### Auth (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/logout` | Invalidate refresh token |
| GET | `/auth/me` | Get current user profile + role + permissions |
| PUT | `/auth/me` | Update own profile (name, phone) |
| PUT | `/auth/change-password` | Change own password |

### Branches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/branches` | List branches |
| GET | `/branches/:id` | Get branch details |
| POST | `/branches` | Create branch |
| PUT | `/branches/:id` | Update branch |
| DELETE | `/branches/:id` | Soft-delete branch |
| GET | `/branches/:id/stats` | Branch statistics |

### Warehouses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/warehouses` | List warehouses (filter: `?branch_id=xxx`) |
| GET | `/warehouses/:id` | Get warehouse details |
| POST | `/warehouses` | Create warehouse |
| PUT | `/warehouses/:id` | Update warehouse |
| DELETE | `/warehouses/:id` | Soft-delete warehouse |
| GET | `/warehouses/:id/items` | Items in warehouse |
| GET | `/warehouses/:id/stats` | Warehouse statistics |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | List all (tree structure) |
| GET | `/categories/:id` | Get category |
| POST | `/categories` | Create category |
| PUT | `/categories/:id` | Update category |
| DELETE | `/categories/:id` | Delete category |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List (filter: `?category_id=xxx&brand=xxx`) |
| GET | `/products/:id` | Get product + BOM |
| POST | `/products` | Create product |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Soft-delete product |
| POST | `/products/:id/images` | Upload images |
| DELETE | `/products/:id/images/:imageId` | Remove image |
| GET | `/products/:id/items` | All items of product |

### Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/items` | List (filter: `?branch_id&warehouse_id&status&condition&tags`) |
| GET | `/items/:id` | Full item details |
| POST | `/items` | Create item (auto-generates barcode) |
| PUT | `/items/:id` | Update item |
| DELETE | `/items/:id` | Soft-delete item |
| GET | `/items/barcode/:barcode` | Lookup by barcode |
| GET | `/items/qr/:qrCode` | Lookup by QR code |
| POST | `/items/:id/check-out` | Check out |
| POST | `/items/:id/check-in` | Check in |
| GET | `/items/:id/history` | Lifecycle history |
| GET | `/items/:id/components` | Installed components |
| POST | `/items/:id/components` | Install component |
| PUT | `/items/:id/components/:componentId/replace` | Replace component |
| POST | `/items/:id/tags` | Add tags |
| DELETE | `/items/:id/tags/:tagName` | Remove tag |
| POST | `/items/:id/images` | Upload images |
| GET | `/items/:id/maintenance-prediction` | Predicted next failure |

### BOM
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bom/:productId` | Get BOM for product |
| POST | `/bom` | Create BOM |
| PUT | `/bom/:productId` | Update BOM |
| DELETE | `/bom/:productId` | Delete BOM |
| POST | `/bom/:productId/components` | Add component |
| DELETE | `/bom/:productId/components/:componentId` | Remove component |

### Transfers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transfers` | List (filter: `?status&branch_id`) |
| GET | `/transfers/:id` | Get transfer details |
| POST | `/transfers` | Create transfer |
| PUT | `/transfers/:id` | Update (draft only) |
| DELETE | `/transfers/:id` | Cancel transfer |
| POST | `/transfers/:id/submit` | Submit for approval |
| POST | `/transfers/:id/approve` | Approve |
| POST | `/transfers/:id/reject` | Reject |
| POST | `/transfers/:id/ship` | Mark shipped |
| POST | `/transfers/:id/receive` | Confirm receipt |

### Maintenance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/maintenance` | List (filter: `?status&branch_id&type&priority`) |
| GET | `/maintenance/:id` | Get details |
| POST | `/maintenance` | Report issue |
| PUT | `/maintenance/:id` | Update record |
| POST | `/maintenance/:id/approve` | Approve |
| POST | `/maintenance/:id/assign` | Assign technician |
| POST | `/maintenance/:id/start` | Start work |
| POST | `/maintenance/:id/complete` | Complete |
| POST | `/maintenance/:id/cancel` | Cancel |
| GET | `/maintenance/schedules` | List schedules |
| POST | `/maintenance/schedules` | Create schedule |
| PUT | `/maintenance/schedules/:id` | Update schedule |
| DELETE | `/maintenance/schedules/:id` | Delete schedule |
| GET | `/maintenance/upcoming` | Upcoming maintenance |

### Suppliers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/suppliers` | List suppliers |
| GET | `/suppliers/:id` | Get supplier |
| POST | `/suppliers` | Create supplier |
| PUT | `/suppliers/:id` | Update supplier |
| DELETE | `/suppliers/:id` | Soft-delete |
| POST | `/suppliers/:id/rate` | Rate supplier |

### Purchase Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/purchase-orders` | List POs |
| GET | `/purchase-orders/:id` | Get PO details |
| POST | `/purchase-orders` | Create PO |
| PUT | `/purchase-orders/:id` | Update (draft only) |
| POST | `/purchase-orders/:id/submit` | Submit for approval |
| POST | `/purchase-orders/:id/approve` | Approve |
| POST | `/purchase-orders/:id/reject` | Reject |
| POST | `/purchase-orders/:id/receive` | Record receipt |
| DELETE | `/purchase-orders/:id` | Cancel |

### Users & Roles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List users |
| GET | `/users/:id` | Get user |
| POST | `/users` | Create user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Deactivate user |
| GET | `/roles` | List roles |
| GET | `/roles/:id` | Get role + permissions |
| POST | `/roles` | Create role |
| PUT | `/roles/:id` | Update role permissions |
| DELETE | `/roles/:id` | Delete role |
| GET | `/permissions` | List all available permissions |

### Disposals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/disposals` | List disposals |
| GET | `/disposals/:id` | Get disposal |
| POST | `/disposals` | Create disposal request |
| POST | `/disposals/:id/approve` | Approve |
| POST | `/disposals/:id/reject` | Reject |
| POST | `/disposals/:id/complete` | Complete |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tags` | List all tags |
| POST | `/tags` | Create tag |
| PUT | `/tags/:id` | Update tag |
| DELETE | `/tags/:id` | Delete tag |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications (paginated) |
| GET | `/notifications/unread-count` | Unread count |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all read |
| DELETE | `/notifications/:id` | Delete notification |

### Alert Rules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/alert-rules` | List rules |
| GET | `/alert-rules/:id` | Get rule |
| POST | `/alert-rules` | Create rule |
| PUT | `/alert-rules/:id` | Update rule |
| DELETE | `/alert-rules/:id` | Delete rule |
| POST | `/alert-rules/:id/toggle` | Enable/disable |
| POST | `/alert-rules/:id/test` | Test (dry run) |

### Audit Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audit-logs` | List (filter: `?user_id&action&resource_type&date_from&date_to`) |
| GET | `/audit-logs/:id` | Get details |
| GET | `/audit-logs/resource/:type/:id` | Logs for specific resource |

### Activity Feed
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/activity-feed` | Recent activity (filter: `?branch_id`) |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/dashboard` | Main dashboard overview |
| GET | `/analytics/equipment-value` | Value by branch |
| GET | `/analytics/maintenance-costs` | Cost analysis |
| GET | `/analytics/health-overview` | Health distribution |
| GET | `/analytics/depreciation-report` | Depreciation summary |
| GET | `/analytics/transfer-activity` | Transfer stats |
| GET | `/analytics/supplier-performance` | Supplier comparison |
| GET | `/analytics/branch-comparison` | Branch comparison |
| GET | `/analytics/maintenance-prediction` | Predicted needs |
| GET | `/analytics/disposal-summary` | Disposal stats |
| GET | `/analytics/top-failing-equipment` | Most failing equipment |
| GET | `/analytics/warranty-expiring` | Expiring warranties |

### Barcodes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/barcodes/generate/:itemId` | Generate barcode image |
| GET | `/barcodes/qr/:itemId` | Generate QR image |
| POST | `/barcodes/batch` | Batch generate |
| POST | `/barcodes/print-labels` | Printable label sheet (PDF) |

### Bulk Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bulk/items/transfer` | Bulk transfer |
| POST | `/bulk/items/update-status` | Bulk status change |
| POST | `/bulk/items/update-tags` | Bulk tag update |
| POST | `/bulk/items/assign-zone` | Bulk zone assign |
| POST | `/bulk/items/generate-barcodes` | Bulk barcode gen |

### Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/export/items` | Export items CSV |
| POST | `/export/maintenance` | Export maintenance CSV |
| POST | `/export/transfers` | Export transfers CSV |
| POST | `/export/analytics/:reportType` | Export report PDF |

### Currency
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/currencies/rates` | Get exchange rates |
| POST | `/currencies/rates` | Set rate |
| GET | `/currencies/convert` | Convert amount |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/image` | Upload image (multipart) |
| DELETE | `/upload/image` | Delete image |

---

## 8. API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Items retrieved successfully",
  "data": {
    // ... actual data
  },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

- `data` can be an object (single item) or array (list)
- `meta` is only present for paginated list endpoints

### Single Object Response

```json
{
  "success": true,
  "message": "Item created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "barcode": "WLF-BG01-DM20-00142",
    "status": "available",
    "health_score": 100,
    // ... all fields
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "code": 3001,
  "errors": [
    { "field": "name", "message": "Name is required" },
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

---

## 9. Error Handling

### Error Codes Reference

| Code | Meaning | HTTP Status | What to do in UI |
|------|---------|-------------|-----------------|
| **1001** | Invalid email or password | 401 | Show "Invalid credentials" |
| **1002** | Token expired | 401 | Auto-refresh token, retry request |
| **1003** | Invalid token | 401 | Redirect to login |
| **1004** | Refresh token expired | 401 | Redirect to login |
| **1005** | Invalid refresh token | 401 | Redirect to login |
| **1006** | Account disabled | 403 | Show "Account disabled, contact admin" |
| **2001** | No permission | 403 | Show "Access denied" or hide the action |
| **2002** | Branch access denied | 403 | Show "No access to this branch" |
| **2003** | System role modification | 403 | Show "Cannot modify system role" |
| **3001** | Validation failed | 400 | Highlight fields with errors from `errors` array |
| **3002** | Invalid ID format | 400 | Check URL parameters |
| **3003** | Required field missing | 400 | Highlight the field |
| **4001-4016** | Resource not found | 404 | Show "Not found" page or message |
| **5001** | Duplicate value | 409 | Show "Already exists" on the field |
| **5002** | Email already exists | 409 | Show on email field |
| **5003** | Barcode already exists | 409 | This shouldn't happen (auto-generated) |
| **5004** | Role in use | 409 | Show "Role is assigned to users" |
| **6001-6018** | Business logic error | 422 | Show the error message as-is to user |
| **9001** | Internal server error | 500 | Show "Something went wrong, try again" |
| **9005** | Rate limited | 429 | Show "Too many requests, wait a moment" |

---

## 10. Pagination, Filtering & Sorting

### Pagination

All list endpoints support these query parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `page` | 1 | Page number |
| `per_page` | 20 | Items per page (max 100) |
| `sort_by` | created_at | Field to sort by |
| `sort_dir` | desc | Sort direction: `asc` or `desc` |

Example: `GET /items?page=2&per_page=50&sort_by=health_score&sort_dir=asc`

### Common Filters

**Items**:
- `?branch_id=xxx` — Filter by branch
- `?warehouse_id=xxx` — Filter by warehouse
- `?product_id=xxx` — Filter by product type
- `?status=available` — Filter by status
- `?condition=good` — Filter by condition
- `?tags=VIP,outdoor` — Filter by tags (comma-separated)
- `?search=WLF-BG01` — Search barcode, serial number, notes

**Transfers**:
- `?status=pending_approval` — Filter by status
- `?from_branch_id=xxx` — From specific branch
- `?to_branch_id=xxx` — To specific branch

**Maintenance**:
- `?status=in_progress` — Filter by status
- `?type=corrective` — Filter by type
- `?priority=critical` — Filter by priority
- `?assigned_to=xxx` — Filter by technician
- `?branch_id=xxx` — Filter by branch

**Audit Logs**:
- `?user_id=xxx` — Filter by user
- `?action=item.create` — Filter by action
- `?resource_type=item` — Filter by resource type
- `?date_from=2026-01-01` — From date
- `?date_to=2026-03-19` — To date

---

## 11. File Uploads

### Upload Image

```
POST /api/v1/upload/image
Content-Type: multipart/form-data

Form fields:
  - file: (binary image file)
  - resource_type: "product" | "item"
  - resource_id: "507f1f77bcf86cd799439011"
```

**Constraints**:
- Allowed types: JPEG, PNG, WebP
- Max size: 5MB
- Returns the public URL of the uploaded image

**Response**:
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://images.wolf.com/items/507f1f77bcf86cd799439011/a1b2c3d4.jpg"
  }
}
```

### Delete Image

```
DELETE /api/v1/upload/image
Body: { "url": "https://images.wolf.com/items/.../a1b2c3d4.jpg" }
```

---

## 12. Notifications

### Polling Strategy

Since there are no WebSockets, the frontend should poll for notifications:

- **Unread count**: Poll `GET /notifications/unread-count` every 30-60 seconds
- **Full list**: Load on demand when user opens notification panel
- **Badge**: Show unread count on the notification bell icon

### Notification Object

```json
{
  "id": "...",
  "type": "maintenance_due",
  "title": "Maintenance Due Tomorrow",
  "message": "Treadmill WLF-BG01-TM01-00005 has scheduled maintenance tomorrow",
  "severity": "warning",
  "resource_type": "maintenance",
  "resource_id": "...",
  "is_read": false,
  "created_at": "2026-03-19T10:00:00Z"
}
```

**Frontend behavior**: When user clicks a notification, navigate to the relevant page based on `resource_type` and `resource_id`.

---

## 13. Dashboard & Analytics

### Main Dashboard (GET /analytics/dashboard)

Expected response structure:

```json
{
  "success": true,
  "data": {
    "total_items": 1250,
    "total_value": { "amount": 850000, "currency": "USD" },
    "items_by_status": {
      "available": 980,
      "in_use": 150,
      "maintenance": 45,
      "damaged": 30,
      "in_transit": 20,
      "reserved": 15,
      "disposed": 10
    },
    "health_distribution": {
      "green": 850,
      "yellow": 280,
      "red": 120
    },
    "pending_transfers": 5,
    "pending_approvals": 8,
    "upcoming_maintenance": 12,
    "expiring_warranties": 3,
    "recent_activity": [
      {
        "actor_name": "Ahmed",
        "action": "transferred",
        "description": "Ahmed transferred 5 dumbbells from Baghdad to Erbil",
        "created_at": "2026-03-19T09:30:00Z"
      }
    ],
    "maintenance_cost_this_month": { "amount": 5200, "currency": "USD" },
    "branches_summary": [
      {
        "branch_id": "...",
        "branch_name": "Wolf Gym Baghdad",
        "item_count": 650,
        "total_value": { "amount": 450000, "currency": "USD" },
        "avg_health_score": 72
      }
    ]
  }
}
```

---

## 14. Postman Collection Usage

The Postman collection file (`wolf-postman-collection.json`) is provided alongside this README.

### Setup

1. Import the collection into Postman
2. Create an environment with these variables:
   - `base_url`: `http://localhost:8080/api/v1` (or your server URL)
   - `access_token`: (leave empty, auto-set by login)
   - `refresh_token`: (leave empty, auto-set by login)
3. Run the "Login" request first — it automatically saves tokens to environment variables
4. All other requests use `{{access_token}}` in the Authorization header

### Collection Structure

The collection is organized by module with folders matching the sections in this README. Each request includes example request body and documented expected responses.

---

## Quick Start Checklist for Frontend Developers

1. Read this README completely
2. Import Postman collection
3. Run Login request to get tokens
4. Call `GET /auth/me` to understand the logged-in user's permissions
5. Build auth flow first (login, token refresh, logout)
6. Build the dashboard page using `/analytics/dashboard`
7. Build CRUD pages module by module following the implementation priority:
   - Branches → Warehouses → Categories → Products → Items
   - Then: Transfers → Maintenance → Procurement
   - Then: Everything else
8. Add permission checks to UI elements
9. Add notification polling
10. Add bulk operations and export features last
