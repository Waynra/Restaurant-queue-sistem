<?php

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'party_size' => $this->faker->numberBetween(1, 8),
            'status' => 'waiting',
            'table_id' => null,
            'arrived_at' => now(),
            'started_at' => null,
            'ended_at' => null,
            'duration_minutes' => null,
        ];
    }
}
