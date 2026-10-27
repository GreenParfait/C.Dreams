<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;


class UserSeeder extends Seeder
{
     public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'name'     => 'Super Admin',
                'password' => 'password123',   // di-hash otomatis oleh cast 'hashed'
                'role_id'  => Role::where('slug', 'superadmin')->value('id'),
            ]
        );
    }
}