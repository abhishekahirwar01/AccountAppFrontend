// lib/permissions.ts
// One string per permission. Keep them stable – they’re contract keys between UI, API and DB.

export const ALL_PERMISSIONS = [
  // -------- Master admin (super-tenant controls)
  "master:read",
  "master:write",
  "master:impersonate",
  "master:tenant:create",
  "master:tenant:delete",

  // -------- Client / tenant (org) level
  "client:read",
  "client:write",

  // -------- Company
  "company:read",
  "company:create",
  "company:update",
  "company:delete",
  "company:export",

  // -------- Sales
  "sales:read",
  "sales:create",
  "sales:update",
  "sales:delete",
  "sales:post",     // finalize/post/approve
  "sales:export",
  "sales:print",

  // -------- Purchase
  "purchase:read",
  "purchase:create",
  "purchase:update",
  "purchase:delete",
  "purchase:post",
  "purchase:export",
  "purchase:print",

  // -------- Receipts (customer receipts)
  "receipt:read",
  "receipt:create",
  "receipt:update",
  "receipt:delete",
  "receipt:post",
  "receipt:export",

  // -------- Payments (vendor payments)
  "payment:read",
  "payment:create",
  "payment:update",
  "payment:delete",
  "payment:post",
  "payment:export",

  // -------- Journals
  "journal:read",
  "journal:create",
  "journal:update",
  "journal:delete",
  "journal:post",
  "journal:export",

  // -------- Products
  "product:read",
  "product:create",
  "product:update",
  "product:delete",
  "product:import",
  "product:export",

  // -------- Services (separate resource in your API)
  "service:read",
  "service:create",
  "service:update",
  "service:delete",
  "service:import",
  "service:export",

  // -------- Parties (customers)
  "party:read",
  "party:create",
  "party:update",
  "party:delete",
  "party:import",
  "party:export",

  // -------- Vendors (suppliers)
  "vendor:read",
  "vendor:create",
  "vendor:update",
  "vendor:delete",
  "vendor:import",
  "vendor:export",

  // -------- Users / Roles / Permissions
  "user:read",
  "user:create",
  "user:update",
  "user:delete",
  "user:invite",
  "user:reset-password",
  "user:assign-role",

  "role:read",
  "role:create",
  "role:update",
  "role:delete",

  "permission:read",
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

// Friendly labels (for toggles/questions in UI)
export const PERMISSION_LABELS: Record<Permission, string> = {
  "master:read": "View master admin data",
  "master:write": "Change master admin settings",
  "master:impersonate": "Impersonate clients",
  "master:tenant:create": "Create tenants",
  "master:tenant:delete": "Delete tenants",

  "client:read": "View clients",
  "client:write": "Manage clients",

  "company:read": "View companies",
  "company:create": "Create companies",
  "company:update": "Edit companies",
  "company:delete": "Delete companies",
  "company:export": "Export company data",

  "sales:read": "View sales",
  "sales:create": "Create sales entries",
  "sales:update": "Edit sales entries",
  "sales:delete": "Delete sales entries",
  "sales:post": "Post/approve sales",
  "sales:export": "Export sales",
  "sales:print": "Print sales documents",

  "purchase:read": "View purchases",
  "purchase:create": "Create purchase entries",
  "purchase:update": "Edit purchase entries",
  "purchase:delete": "Delete purchase entries",
  "purchase:post": "Post/approve purchases",
  "purchase:export": "Export purchases",
  "purchase:print": "Print purchase documents",

  "receipt:read": "View receipts",
  "receipt:create": "Create receipts",
  "receipt:update": "Edit receipts",
  "receipt:delete": "Delete receipts",
  "receipt:post": "Post receipts",
  "receipt:export": "Export receipts",

  "payment:read": "View payments",
  "payment:create": "Create payments",
  "payment:update": "Edit payments",
  "payment:delete": "Delete payments",
  "payment:post": "Post payments",
  "payment:export": "Export payments",

  "journal:read": "View journals",
  "journal:create": "Create journals",
  "journal:update": "Edit journals",
  "journal:delete": "Delete journals",
  "journal:post": "Post journals",
  "journal:export": "Export journals",

  "product:read": "View products",
  "product:create": "Add products",
  "product:update": "Edit products",
  "product:delete": "Delete products",
  "product:import": "Import products",
  "product:export": "Export products",

  "service:read": "View services",
  "service:create": "Add services",
  "service:update": "Edit services",
  "service:delete": "Delete services",
  "service:import": "Import services",
  "service:export": "Export services",

  "party:read": "View customers",
  "party:create": "Add customers",
  "party:update": "Edit customers",
  "party:delete": "Delete customers",
  "party:import": "Import customers",
  "party:export": "Export customers",

  "vendor:read": "View vendors",
  "vendor:create": "Add vendors",
  "vendor:update": "Edit vendors",
  "vendor:delete": "Delete vendors",
  "vendor:import": "Import vendors",
  "vendor:export": "Export vendors",

  "user:read": "View users",
  "user:create": "Create users",
  "user:update": "Edit users",
  "user:delete": "Delete users",
  "user:invite": "Invite users",
  "user:reset-password": "Reset passwords",
  "user:assign-role": "Assign roles",

  "role:read": "View roles",
  "role:create": "Create roles",
  "role:update": "Edit roles",
  "role:delete": "Delete roles",

  "permission:read": "View permission catalog",
};

// Optional: imply read when higher power is granted
export const IMPLIED_PERMISSIONS: Partial<Record<Permission, Permission[]>> = {
  "company:create": ["company:read"],
  "company:update": ["company:read"],
  "company:delete": ["company:read"],
  "company:export": ["company:read"],

  "sales:create": ["sales:read"],
  "sales:update": ["sales:read"],
  "sales:delete": ["sales:read"],
  "sales:post":   ["sales:read"],
  "sales:export": ["sales:read"],
  "sales:print":  ["sales:read"],

  "purchase:create": ["purchase:read"],
  "purchase:update": ["purchase:read"],
  "purchase:delete": ["purchase:read"],
  "purchase:post":   ["purchase:read"],
  "purchase:export": ["purchase:read"],
  "purchase:print":  ["purchase:read"],

  "receipt:create": ["receipt:read"],
  "receipt:update": ["receipt:read"],
  "receipt:delete": ["receipt:read"],
  "receipt:post":   ["receipt:read"],
  "receipt:export": ["receipt:read"],

  "payment:create": ["payment:read"],
  "payment:update": ["payment:read"],
  "payment:delete": ["payment:read"],
  "payment:post":   ["payment:read"],
  "payment:export": ["payment:read"],

  "journal:create": ["journal:read"],
  "journal:update": ["journal:read"],
  "journal:delete": ["journal:read"],
  "journal:post":   ["journal:read"],
  "journal:export": ["journal:read"],

  "product:create": ["product:read"],
  "product:update": ["product:read"],
  "product:delete": ["product:read"],
  "product:import": ["product:read"],
  "product:export": ["product:read"],

  "service:create": ["service:read"],
  "service:update": ["service:read"],
  "service:delete": ["service:read"],
  "service:import": ["service:read"],
  "service:export": ["service:read"],

  "party:create": ["party:read"],
  "party:update": ["party:read"],
  "party:delete": ["party:read"],
  "party:import": ["party:read"],
  "party:export": ["party:read"],

  "vendor:create": ["vendor:read"],
  "vendor:update": ["vendor:read"],
  "vendor:delete": ["vendor:read"],
  "vendor:import": ["vendor:read"],
  "vendor:export": ["vendor:read"],

  "user:create": ["user:read"],
  "user:update": ["user:read"],
  "user:delete": ["user:read"],
  "user:invite": ["user:read"],
  "user:reset-password": ["user:read"],
  "user:assign-role": ["user:read"],

  "role:create": ["role:read"],
  "role:update": ["role:read"],
  "role:delete": ["role:read"],
} as const;
