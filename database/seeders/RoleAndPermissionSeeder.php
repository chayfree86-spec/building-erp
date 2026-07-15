<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Default permissions
        $permissions = [
            // User & Auth
            ['name' => 'View Users', 'slug' => 'view_users', 'module' => 'users', 'action' => 'view'],
            ['name' => 'Add User', 'slug' => 'add_user', 'module' => 'users', 'action' => 'add'],
            ['name' => 'Edit User', 'slug' => 'edit_user', 'module' => 'users', 'action' => 'edit'],
            ['name' => 'Delete User', 'slug' => 'delete_user', 'module' => 'users', 'action' => 'delete'],

            // Stores
            ['name' => 'View Stores', 'slug' => 'view_stores', 'module' => 'stores', 'action' => 'view'],
            ['name' => 'Manage Stores', 'slug' => 'manage_stores', 'module' => 'stores', 'action' => 'edit'],

            // Products
            ['name' => 'View Products', 'slug' => 'view_products', 'module' => 'products', 'action' => 'view'],
            ['name' => 'Add Product', 'slug' => 'add_product', 'module' => 'products', 'action' => 'add'],
            ['name' => 'Edit Product', 'slug' => 'edit_product', 'module' => 'products', 'action' => 'edit'],
            ['name' => 'Delete Product', 'slug' => 'delete_product', 'module' => 'products', 'action' => 'delete'],

            // Customers
            ['name' => 'View Customers', 'slug' => 'view_customers', 'module' => 'customers', 'action' => 'view'],
            ['name' => 'Add Customer', 'slug' => 'add_customer', 'module' => 'customers', 'action' => 'add'],
            ['name' => 'Edit Customer', 'slug' => 'edit_customer', 'module' => 'customers', 'action' => 'edit'],

            // Suppliers
            ['name' => 'View Suppliers', 'slug' => 'view_suppliers', 'module' => 'suppliers', 'action' => 'view'],
            ['name' => 'Add Supplier', 'slug' => 'add_supplier', 'module' => 'suppliers', 'action' => 'add'],
            ['name' => 'Edit Supplier', 'slug' => 'edit_supplier', 'module' => 'suppliers', 'action' => 'edit'],

            // Purchases
            ['name' => 'View Purchases', 'slug' => 'view_purchases', 'module' => 'purchases', 'action' => 'view'],
            ['name' => 'Add Purchase', 'slug' => 'add_purchase', 'module' => 'purchases', 'action' => 'add'],
            ['name' => 'Edit Purchase', 'slug' => 'edit_purchase', 'module' => 'purchases', 'action' => 'edit'],
            ['name' => 'Approve Purchase', 'slug' => 'approve_purchase', 'module' => 'purchases', 'action' => 'approve'],
            ['name' => 'Cancel Purchase', 'slug' => 'cancel_purchase', 'module' => 'purchases', 'action' => 'cancel'],

            // Sales Invoices
            ['name' => 'View Invoices', 'slug' => 'view_invoices', 'module' => 'invoices', 'action' => 'view'],
            ['name' => 'Add Invoice', 'slug' => 'add_invoice', 'module' => 'invoices', 'action' => 'add'],
            ['name' => 'Edit Invoice', 'slug' => 'edit_invoice', 'module' => 'invoices', 'action' => 'edit'],
            ['name' => 'Cancel Invoice', 'slug' => 'cancel_invoice', 'module' => 'invoices', 'action' => 'cancel'],
            ['name' => 'Reverse Invoice', 'slug' => 'reverse_invoice', 'module' => 'invoices', 'action' => 'reverse'],

            // Payments
            ['name' => 'View Payments', 'slug' => 'view_payments', 'module' => 'payments', 'action' => 'view'],
            ['name' => 'Add Payment', 'slug' => 'add_payment', 'module' => 'payments', 'action' => 'add'],
            ['name' => 'Reverse Payment', 'slug' => 'reverse_payment', 'module' => 'payments', 'action' => 'reverse'],

            // Returns
            ['name' => 'View Returns', 'slug' => 'view_returns', 'module' => 'returns', 'action' => 'view'],
            ['name' => 'Add Return', 'slug' => 'add_return', 'module' => 'returns', 'action' => 'add'],
            ['name' => 'Cancel Return', 'slug' => 'cancel_return', 'module' => 'returns', 'action' => 'cancel'],

            // Stock
            ['name' => 'View Stock', 'slug' => 'view_stock', 'module' => 'stock', 'action' => 'view'],
            ['name' => 'Stock Adjustment', 'slug' => 'stock_adjustment', 'module' => 'stock', 'action' => 'stock_adjustment'],
            ['name' => 'Stock Transfer', 'slug' => 'stock_transfer', 'module' => 'stock', 'action' => 'add'],

            // Reports
            ['name' => 'View Reports', 'slug' => 'view_reports', 'module' => 'reports', 'action' => 'view'],
            ['name' => 'Export Reports', 'slug' => 'export_reports', 'module' => 'reports', 'action' => 'export'],

            // Sensitive
            ['name' => 'View Cost Price', 'slug' => 'view_cost', 'module' => 'sensitive', 'action' => 'view_cost'],
            ['name' => 'View Profit', 'slug' => 'view_profit', 'module' => 'sensitive', 'action' => 'view_profit'],
            ['name' => 'Price Override', 'slug' => 'price_override', 'module' => 'sensitive', 'action' => 'price_override'],
            ['name' => 'Discount Override', 'slug' => 'discount_override', 'module' => 'sensitive', 'action' => 'discount_override'],
            ['name' => 'Backdated Entry', 'slug' => 'backdated_entry', 'module' => 'sensitive', 'action' => 'backdated_entry'],

            // Audit
            ['name' => 'View Audit Logs', 'slug' => 'view_audit_logs', 'module' => 'audit', 'action' => 'view'],

            // Settings
            ['name' => 'Manage Settings', 'slug' => 'manage_settings', 'module' => 'settings', 'action' => 'edit'],

            // Roles
            ['name' => 'Manage Roles', 'slug' => 'manage_roles', 'module' => 'roles', 'action' => 'edit'],

            // Print
            ['name' => 'Print Documents', 'slug' => 'print', 'module' => 'documents', 'action' => 'print'],
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['slug' => $perm['slug']], $perm);
        }

        // Create default roles
        $superAdmin = Role::firstOrCreate(
            ['slug' => 'super_admin'],
            [
                'name' => 'Super Admin',
                'description' => 'Full system access across all stores.',
                'is_system' => true,
                'status' => 'active',
            ]
        );
        $superAdmin->permissions()->sync(Permission::pluck('id')->toArray());

        $admin = Role::firstOrCreate(
            ['slug' => 'admin'],
            [
                'name' => 'Admin',
                'description' => 'Store-level admin access.',
                'is_system' => true,
                'status' => 'active',
            ]
        );
        $admin->permissions()->sync(
            Permission::whereNotIn('slug', ['manage_roles', 'manage_stores', 'view_audit_logs', 'manage_settings'])
                ->pluck('id')->toArray()
        );

        $manager = Role::firstOrCreate(
            ['slug' => 'manager'],
            [
                'name' => 'Manager',
                'description' => 'Store manager with operational access.',
                'is_system' => true,
                'status' => 'active',
            ]
        );

        $salesman = Role::firstOrCreate(
            ['slug' => 'salesman'],
            [
                'name' => 'Salesman',
                'description' => 'Sales counter access.',
                'is_system' => true,
                'status' => 'active',
            ]
        );

        $accountant = Role::firstOrCreate(
            ['slug' => 'accountant'],
            [
                'name' => 'Accountant',
                'description' => 'Financial and ledger access.',
                'is_system' => true,
                'status' => 'active',
            ]
        );

        $storeKeeper = Role::firstOrCreate(
            ['slug' => 'store_keeper'],
            [
                'name' => 'Store Keeper',
                'description' => 'Inventory and stock management access.',
                'is_system' => true,
                'status' => 'active',
            ]
        );
    }
}
