<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HistoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'table_id' => $this->table_id,
            'table' => new TableResource($this->whenLoaded('table')),
            'action' => $this->action,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
