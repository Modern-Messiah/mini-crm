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
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $managerRole = Role::firstOrCreate(['name' => 'manager']);

        // Create admin user directly (without factory)
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin',
                'password' => bcrypt('password'),
            ]
        );
        $admin->assignRole($adminRole);

        // Create manager user directly
        $manager = User::firstOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'Manager',
                'password' => bcrypt('password'),
            ]
        );
        $manager->assignRole($managerRole);

        // Create test customers directly
        for ($i = 1; $i <= 5; $i++) {
            $customer = Customer::firstOrCreate(
                ['phone' => '+7999000000' . $i],
                [
                    'name' => 'Клиент ' . $i,
                    'email' => 'client' . $i . '@example.com',
                ]
            );

            // Create tickets for each customer
            Ticket::firstOrCreate(
                ['customer_id' => $customer->id, 'subject' => 'Заявка от клиента ' . $i],
                [
                    'text' => 'Текст обращения клиента ' . $i,
                    'status' => 'new',
                ]
            );
        }
    }
}
