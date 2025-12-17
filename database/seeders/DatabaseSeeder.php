<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $managerRole = Role::firstOrCreate(['name' => 'manager']);

        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin',
                'password' => bcrypt('password'),
            ]
        );
        $admin->assignRole($adminRole);

        $manager = User::firstOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'Manager',
                'password' => bcrypt('password'),
            ]
        );
        $manager->assignRole($managerRole);

        for ($i = 1; $i <= 5; $i++) {
            $customer = Customer::firstOrCreate(
                ['phone' => '+7999000000' . $i],
                [
                    'name' => 'Клиент ' . $i,
                    'email' => 'client' . $i . '@example.com',
                ]
            );

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
