<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([RoleSeeder::class, UserSeeder::class]);

        // Data dummy agar datatable (search, sort, pagination) bisa dicoba
        if (app()->environment('local')) {
            User::factory(40)->create([
                'role_id' => Role::where('slug', 'pembeli')->value('id'),
            ]);
        }
    }
}
