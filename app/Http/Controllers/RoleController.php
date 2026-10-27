<?php

namespace App\Http\Controllers;

use App\Models\Role;

class RoleController extends Controller
{
    // Untuk dropdown role di form user dan filter tabel
    public function index()
    {
        return response()->json(Role::select('id', 'name', 'slug')->orderBy('id')->get());
    }
}
