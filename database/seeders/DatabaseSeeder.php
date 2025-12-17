<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create roles
        $adminRole = Role::create(['name' => 'admin']);
        $managerRole = Role::create(['name' => 'manager']);

        // Create admin user
        $admin = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
        ]);
        $admin->assignRole($adminRole);

        // Create manager user
        $manager = User::factory()->create([
            'name' => 'Manager',
            'email' => 'manager@example.com',
            'password' => bcrypt('password'),
        ]);
        $manager->assignRole($managerRole);

        // Create customers with tickets
        $customers = Customer::factory(10)->create();

        foreach ($customers as $customer) {
            Ticket::factory(rand(1, 3))->create([
                'customer_id' => $customer->id,
            ]);
        }
    }
}
