<!DOCTYPE html>
<html lang="ru">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Mini-CRM')</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f1f5f9;
            min-height: 100vh;
        }

        .navbar {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .navbar-brand {
            color: #fff;
            font-size: 1.25rem;
            font-weight: 700;
            text-decoration: none;
        }

        .navbar-user {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .navbar-user span {
            color: #94a3b8;
        }

        .logout-btn {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
            transition: background 0.2s;
        }

        .logout-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 24px;
        }

        .page-header {
            margin-bottom: 24px;
        }

        .page-header h1 {
            color: #1e293b;
            font-size: 1.5rem;
            font-weight: 600;
        }

        .card {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .card-header {
            background: #f8fafc;
            padding: 16px 24px;
            border-bottom: 1px solid #e2e8f0;
            font-weight: 600;
            color: #334155;
        }

        .card-body {
            padding: 24px;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
        }

        .table th,
        .table td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }

        .table th {
            background: #f8fafc;
            font-weight: 600;
            color: #475569;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .table tr:hover {
            background: #f8fafc;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            text-decoration: none;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
        }

        .btn-primary {
            background: #3b82f6;
            color: #fff;
        }

        .btn-primary:hover {
            background: #2563eb;
        }

        .btn-secondary {
            background: #e2e8f0;
            color: #475569;
        }

        .btn-secondary:hover {
            background: #cbd5e1;
        }

        .btn-sm {
            padding: 6px 12px;
            font-size: 0.8rem;
        }

        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .badge-blue {
            background: #dbeafe;
            color: #1d4ed8;
        }

        .badge-yellow {
            background: #fef3c7;
            color: #b45309;
        }

        .badge-green {
            background: #dcfce7;
            color: #15803d;
        }

        .filter-form {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 20px;
        }

        .filter-form input,
        .filter-form select {
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 0.875rem;
        }

        .filter-form input:focus,
        .filter-form select:focus {
            outline: none;
            border-color: #3b82f6;
        }

        .alert {
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .alert-success {
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #bbf7d0;
        }

        .pagination {
            display: flex;
            gap: 4px;
            margin-top: 20px;
            justify-content: center;
        }

        .pagination a,
        .pagination span {
            padding: 8px 14px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            text-decoration: none;
            color: #475569;
            font-size: 0.875rem;
        }

        .pagination a:hover {
            background: #f1f5f9;
        }

        .pagination .active span {
            background: #3b82f6;
            color: #fff;
            border-color: #3b82f6;
        }

        @media (max-width: 768px) {
            .filter-form {
                flex-direction: column;
            }

            .table-responsive {
                overflow-x: auto;
            }
        }
    </style>
</head>

<body>
    <nav class="navbar">
        <a href="{{ route('admin.tickets.index') }}" class="navbar-brand">🎯 Mini-CRM</a>
        <div class="navbar-user">
            <span>{{ auth()->user()->name }}</span>
            <form action="{{ route('logout') }}" method="POST" style="display: inline;">
                @csrf
                <button type="submit" class="logout-btn">Выйти</button>
            </form>
        </div>
    </nav>

    <div class="container">
        @if (session('success'))
            <div class="alert alert-success">
                {{ session('success') }}
            </div>
        @endif

        @yield('content')
    </div>
</body>

</html>