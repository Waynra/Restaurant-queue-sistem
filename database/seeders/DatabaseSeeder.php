<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $tables = [
            ['name' => 'Table A', 'capacity' => 2],
            ['name' => 'Table B', 'capacity' => 4],
            ['name' => 'Table C', 'capacity' => 6],
            ['name' => 'Table D', 'capacity' => 8],
        ];

        foreach ($tables as $t) {
            \App\Models\Table::firstOrCreate(
                ['name' => $t['name']],
                ['capacity' => $t['capacity'], 'status' => 'available']
            );
        }
    }
}
