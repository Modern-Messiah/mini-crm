<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class WidgetController extends Controller
{
    public function index(): View
    {
        return view('widget');
    }
}
