<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'capacity',
        'status',
    ];

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function activeCustomer()
    {
        return $this->hasOne(Customer::class)->where('status', 'seated');
    }
}
