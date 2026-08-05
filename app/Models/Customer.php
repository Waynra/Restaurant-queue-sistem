<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'party_size',
        'status',
        'table_id',
        'arrived_at',
        'started_at',
        'ended_at',
        'duration_minutes',
    ];

    protected $casts = [
        'arrived_at' => 'datetime',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function table()
    {
        return $this->belongsTo(Table::class);
    }

    public function histories()
    {
        return $this->hasMany(History::class);
    }
}
