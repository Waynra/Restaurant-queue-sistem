<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $remainingSeconds = 0;
        if ($this->status === 'seated' && $this->ended_at) {
            $remainingSeconds = max(0, now()->diffInSeconds($this->ended_at, false));
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'party_size' => $this->party_size,
            'status' => $this->status,
            'table_id' => $this->table_id,
            'table' => new TableResource($this->whenLoaded('table')),
            'arrived_at' => $this->arrived_at?->toIso8601String(),
            'started_at' => $this->started_at?->toIso8601String(),
            'ended_at' => $this->ended_at?->toIso8601String(),
            'duration_minutes' => $this->duration_minutes,
            'remaining_seconds' => $remainingSeconds,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
