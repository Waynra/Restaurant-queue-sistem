<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\QueueController;

Route::post('/arrive', [QueueController::class, 'arrive']);
Route::get('/status', [QueueController::class, 'status']);
Route::post('/serve/{customer}', [QueueController::class, 'serve']);
Route::post('/seat', [QueueController::class, 'seat']);
Route::get('/history', [QueueController::class, 'history']);
