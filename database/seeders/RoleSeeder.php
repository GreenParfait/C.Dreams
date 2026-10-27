<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $superadmin = Role::updateOrCreate(['slug' => 'superadmin'], ['name' => 'Super Admin', 'description' => 'Akses penuh, mengatur admin dan hak akses']);
        Role::updateOrCreate(['slug' => 'admin'],   ['name' => 'Admin',   'description' => 'Mengelola toko sesuai hak akses']);
        Role::updateOrCreate(['slug' => 'pembeli'], ['name' => 'Pembeli', 'description' => 'Pelanggan toko']);

        // Menu awal. Tambah menu baru di sini seiring halaman bertambah.
        $menus = [
            ['name' => 'Dashboard', 'path' => '/',      'sort_order' => 1],
            ['name' => 'Users',     'path' => '/users', 'sort_order' => 2],
        ];

        foreach ($menus as $m) {
            $menu = Menu::updateOrCreate(['path' => $m['path']], $m);
            $superadmin->menus()->syncWithoutDetaching([$menu->id]);
        }
    }
}
