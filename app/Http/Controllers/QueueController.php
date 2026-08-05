<?php

namespace App\Http\Controllers;

use App\Http\Requests\ArriveRequest;
use App\Http\Requests\SeatRequest;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\TableResource;
use App\Models\Customer;
use App\Models\Table;
use App\Services\QueueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class QueueController extends Controller
{
    public function __construct(
        protected QueueService $queueService
    ) {}

    /**
     * POST /api/arrive
     * Register customer arrival and auto-assign a table if available.
     */
    public function arrive(ArriveRequest $request): JsonResponse
    {
        try {
            $customer = $this->queueService->arrive(
                $request->input('name'),
                $request->input('party_size')
            );

            return response()->json([
                'success' => true,
                'message' => $customer->status === 'seated'
                    ? "Customer seated at {$customer->table->name}."
                    : "Customer added to the waiting queue.",
                'data' => new CustomerResource($customer),
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * GET /api/status
     * Retrieve the current restaurant status: tables, active customers, and waiting queue.
     */
    public function status(): JsonResponse
    {
        $tables = Table::with('activeCustomer')->get();
        
        $waitingQueue = Customer::where('status', 'waiting')
            ->orderBy('party_size', 'desc')
            ->orderBy('arrived_at', 'asc')
            ->get();

        $activeCustomers = Customer::where('status', 'seated')
            ->with('table')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'tables' => TableResource::collection($tables),
                'waiting_queue' => CustomerResource::collection($waitingQueue),
                'active_customers' => CustomerResource::collection($activeCustomers),
            ]
        ]);
    }

    /**
     * POST /api/serve/{customer}
     * Force complete customer, vacating the table and seating the next queued customer.
     */
    public function serve(Customer $customer): JsonResponse
    {
        try {
            $result = $this->queueService->serve($customer);

            $message = "Customer {$customer->name} served and table freed.";
            if ($result['next_customer']) {
                $message .= " Customer {$result['next_customer']->name} automatically seated.";
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'completed_customer' => new CustomerResource($result['completed_customer']),
                    'next_customer' => $result['next_customer'] ? new CustomerResource($result['next_customer']) : null,
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * POST /api/seat
     * Manually seat a customer from the queue (Drag & Drop support).
     */
    public function seat(SeatRequest $request): JsonResponse
    {
        try {
            $customer = Customer::findOrFail($request->input('customer_id'));
            $table = Table::findOrFail($request->input('table_id'));

            $updatedCustomer = $this->queueService->seatCustomer($customer, $table);

            return response()->json([
                'success' => true,
                'message' => "Customer {$customer->name} seated at {$table->name}.",
                'data' => new CustomerResource($updatedCustomer),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * GET /api/history
     * Get paginated customer history logs with sorting and filtering.
     */
    public function history(Request $request): JsonResponse
    {
        $query = Customer::query()->with('table');

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('party_size')) {
            $query->where('party_size', $request->input('party_size'));
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->input('search') . '%');
        }

        // Sorting mappings
        $sortBy = $request->input('sort_by', 'date');
        $sortOrder = $request->input('sort_order', 'desc');

        $sortMap = [
            'name' => 'name',
            'party' => 'party_size',
            'duration' => 'duration_minutes',
            'status' => 'status',
            'date' => 'arrived_at',
        ];

        if (array_key_exists($sortBy, $sortMap)) {
            $query->orderBy($sortMap[$sortBy], $sortOrder);
        } elseif ($sortBy === 'table') {
            // Sort by table name using a left join
            $query->leftJoin('tables', 'customers.table_id', '=', 'tables.id')
                ->select('customers.*')
                ->orderBy('tables.name', $sortOrder);
        } else {
            $query->orderBy('arrived_at', $sortOrder);
        }

        $perPage = $request->integer('per_page', 10);
        $paginated = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => CustomerResource::collection($paginated)->response()->getData(true)
        ]);
    }
}
