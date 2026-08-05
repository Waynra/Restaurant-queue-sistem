<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Table;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QueueTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed the tables
        $this->seed();
    }

    /**
     * 1. Customer validation test
     */
    public function test_customer_validation(): void
    {
        $response = $this->postJson('/api/arrive', [
            'party_size' => 2,
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);

        $response = $this->postJson('/api/arrive', [
            'name' => 'John',
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['party_size']);
    }

    /**
     * 2. Party size cannot zero
     */
    public function test_party_size_cannot_be_zero(): void
    {
        $response = $this->postJson('/api/arrive', [
            'name' => 'John',
            'party_size' => 0,
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['party_size']);

        $response = $this->postJson('/api/arrive', [
            'name' => 'John',
            'party_size' => -2,
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['party_size']);
    }

    /**
     * 3. Small party gets smallest table
     */
    public function test_small_party_gets_smallest_table(): void
    {
        $response = $this->postJson('/api/arrive', [
            'name' => 'John',
            'party_size' => 2,
        ]);

        $response->assertStatus(201);
        $customer = Customer::first();
        $this->assertEquals('seated', $customer->status);
        $this->assertEquals('Table A', $customer->table->name);
        $this->assertEquals('occupied', $customer->table->status);
    }

    /**
     * 4. Large party priority queue
     */
    public function test_large_party_priority_queue(): void
    {
        // First occupy all tables so subsequent arrivals go to queue
        Table::query()->update(['status' => 'occupied']);

        $this->postJson('/api/arrive', ['name' => 'Customer 1', 'party_size' => 3]);
        $this->postJson('/api/arrive', ['name' => 'Customer 2', 'party_size' => 8]);
        $this->postJson('/api/arrive', ['name' => 'Customer 3', 'party_size' => 5]);

        // Get status and verify waiting queue order
        $response = $this->getJson('/api/status');
        $response->assertStatus(200);
        
        $queue = $response->json('data.waiting_queue');
        $this->assertCount(3, $queue);
        // Order must be 8, 5, 3 (largest party size first)
        $this->assertEquals(8, $queue[0]['party_size']);
        $this->assertEquals(5, $queue[1]['party_size']);
        $this->assertEquals(3, $queue[2]['party_size']);
    }

    /**
     * 5. No oversize assignment
     */
    public function test_no_oversize_assignment(): void
    {
        // Table A is free. Table D is free. A party of 2 arrives.
        // It must get Table A, not Table D.
        $response = $this->postJson('/api/arrive', [
            'name' => 'John',
            'party_size' => 2,
        ]);

        $response->assertStatus(201);
        $customer = Customer::first();
        $this->assertEquals('Table A', $customer->table->name);
    }

    /**
     * 6. Customer waiting when all tables occupied
     */
    public function test_customer_waiting_when_all_tables_occupied(): void
    {
        // Occupy all 4 tables
        $this->postJson('/api/arrive', ['name' => 'A1', 'party_size' => 2]); // A
        $this->postJson('/api/arrive', ['name' => 'B1', 'party_size' => 4]); // B
        $this->postJson('/api/arrive', ['name' => 'C1', 'party_size' => 6]); // C
        $this->postJson('/api/arrive', ['name' => 'D1', 'party_size' => 8]); // D

        // Next customer arrives
        $response = $this->postJson('/api/arrive', [
            'name' => 'Queued',
            'party_size' => 2,
        ]);

        $response->assertStatus(201);
        $customer = Customer::where('name', 'Queued')->first();
        $this->assertEquals('waiting', $customer->status);
        $this->assertNull($customer->table_id);
    }

    /**
     * 7. Serve completes customer
     */
    public function test_serve_completes_customer(): void
    {
        // Arrive and seat a customer
        $this->postJson('/api/arrive', ['name' => 'John', 'party_size' => 2]);
        $customer = Customer::where('name', 'John')->first();

        // Complete the customer
        $response = $this->postJson("/api/serve/{$customer->id}");
        $response->assertStatus(200);

        $customer->refresh();
        $this->assertEquals('completed', $customer->status);
        $this->assertNull($customer->table_id);
        
        $table = Table::where('name', 'Table A')->first();
        $this->assertEquals('available', $table->status);
    }

    /**
     * 8. After serve queue automatically fills table
     */
    public function test_after_serve_queue_automatically_fills_table(): void
    {
        // 1. Occupy all tables
        $this->postJson('/api/arrive', ['name' => 'A1', 'party_size' => 2]); // Table A (cap 2)
        $this->postJson('/api/arrive', ['name' => 'B1', 'party_size' => 4]); // Table B (cap 4)
        $this->postJson('/api/arrive', ['name' => 'C1', 'party_size' => 6]); // Table C (cap 6)
        $this->postJson('/api/arrive', ['name' => 'D1', 'party_size' => 8]); // Table D (cap 8)

        // 2. Add waiting queue customers: size 3, then size 4
        $this->postJson('/api/arrive', ['name' => 'Queue3', 'party_size' => 3]);
        $this->postJson('/api/arrive', ['name' => 'Queue4', 'party_size' => 4]);

        // 3. Serve the customer at Table B (capacity 4)
        $b1 = Customer::where('name', 'B1')->first();
        $response = $this->postJson("/api/serve/{$b1->id}");
        $response->assertStatus(200);

        // Table B is capacity 4.
        // Queue has: Queue4 (size 4), Queue3 (size 3).
        // Since Queue4 is larger (4) and fits in Table B (4 <= 4), Queue4 should be automatically seated.
        $queue4 = Customer::where('name', 'Queue4')->first();
        $this->assertEquals('seated', $queue4->status);
        $this->assertEquals('Table B', $queue4->table->name);

        $queue3 = Customer::where('name', 'Queue3')->first();
        $this->assertEquals('waiting', $queue3->status); // Queue3 remains waiting
    }
}
