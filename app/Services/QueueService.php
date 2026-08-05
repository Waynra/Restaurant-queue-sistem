<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Table;
use App\Models\History;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use InvalidArgumentException;

class QueueService
{
    /**
     * Handle customer arrival.
     * Assigns to the smallest available table that fits them, or queues them.
     */
    public function arrive(string $name, int $partySize): Customer
    {
        if ($partySize <= 0) {
            throw new InvalidArgumentException('Party size must be greater than zero.');
        }

        return DB::transaction(function () use ($name, $partySize) {
            // 1. Create the customer
            $customer = Customer::create([
                'name' => $name,
                'party_size' => $partySize,
                'status' => 'waiting',
                'arrived_at' => now(),
            ]);

            // Log arrival in history
            History::create([
                'customer_id' => $customer->id,
                'action' => 'arrived',
            ]);

            // 2. Try to auto-assign a table
            $this->autoAssignTable($customer);

            return $customer->fresh(['table']);
        });
    }

    /**
     * Manually seat a customer from the queue onto a table (supports drag & drop).
     */
    public function seatCustomer(Customer $customer, Table $table): Customer
    {
        if ($customer->status !== 'waiting') {
            throw new InvalidArgumentException('Customer is not in the waiting queue.');
        }

        if ($table->status !== 'available') {
            throw new InvalidArgumentException('Table is already occupied.');
        }

        if ($customer->party_size > $table->capacity) {
            throw new InvalidArgumentException('Table capacity is too small for this party.');
        }

        return DB::transaction(function () use ($customer, $table) {
            $duration = ($customer->party_size * 15) + rand(5, 15);
            $startedAt = now();
            $endedAt = $startedAt->copy()->addMinutes($duration);

            $customer->update([
                'status' => 'seated',
                'table_id' => $table->id,
                'started_at' => $startedAt,
                'ended_at' => $endedAt,
                'duration_minutes' => $duration,
            ]);

            $table->update([
                'status' => 'occupied',
            ]);

            History::create([
                'customer_id' => $customer->id,
                'table_id' => $table->id,
                'action' => 'seated',
            ]);

            return $customer;
        });
    }

    /**
     * Force complete a customer, vacating the table and checking the queue.
     */
    public function serve(Customer $customer): array
    {
        if ($customer->status !== 'seated') {
            throw new InvalidArgumentException('Customer is not currently seated.');
        }

        return DB::transaction(function () use ($customer) {
            $table = $customer->table;
            $tableId = $customer->table_id;

            // 1. Complete the current customer
            $customer->update([
                'status' => 'completed',
                'ended_at' => now(),
                'table_id' => null,
            ]);

            // Log completion in history
            History::create([
                'customer_id' => $customer->id,
                'table_id' => $tableId,
                'action' => 'completed',
            ]);

            // Set table back to available
            $table->update([
                'status' => 'available',
            ]);

            // 2. Check waiting queue for automatic assignment
            $nextCustomer = $this->assignNextFromQueue($table);

            return [
                'completed_customer' => $customer,
                'next_customer' => $nextCustomer,
            ];
        });
    }

    /**
     * Automatically assign the smallest available table that can fit the customer.
     */
    protected function autoAssignTable(Customer $customer): bool
    {
        // Find available tables that can fit the party size, ordered by capacity ascending (smallest first)
        $availableTable = Table::where('status', 'available')
            ->where('capacity', '>=', $customer->party_size)
            ->orderBy('capacity', 'asc')
            ->first();

        if ($availableTable) {
            $this->seatCustomer($customer, $availableTable);
            return true;
        }

        return false;
    }

    /**
     * Find and seat the highest priority customer from the queue that fits the table.
     */
    protected function assignNextFromQueue(Table $table): ?Customer
    {
        // Fetch queue: status = waiting, sorted by party_size DESC, then arrived_at ASC
        $nextCustomer = Customer::where('status', 'waiting')
            ->where('party_size', '<=', $table->capacity)
            ->orderBy('party_size', 'desc')
            ->orderBy('arrived_at', 'asc')
            ->first();

        if ($nextCustomer) {
            $this->seatCustomer($nextCustomer, $table);
            return $nextCustomer;
        }

        return null;
    }
}
