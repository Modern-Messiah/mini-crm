<?php

namespace Tests\Feature;

use App\Enums\TicketStatus;
use App\Models\Customer;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminTicketTest extends TestCase
{
    use RefreshDatabase;

    protected User $manager;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'admin']);
        Role::create(['name' => 'manager']);

        $this->manager = User::factory()->create();
        $this->manager->assignRole('manager');
    }

    public function test_guest_cannot_access_admin_panel(): void
    {
        $response = $this->get('/admin/tickets');

        $response->assertRedirect('/login');
    }

    public function test_manager_can_view_tickets_list(): void
    {
        Customer::factory()
            ->has(Ticket::factory()->count(5))
            ->create();

        $response = $this->actingAs($this->manager)
            ->get('/admin/tickets');

        $response->assertStatus(200)
            ->assertSee('Список заявок');
    }

    public function test_can_filter_tickets_by_status(): void
    {
        $customer = Customer::factory()->create();
        Ticket::factory()->statusNew()->create(['customer_id' => $customer->id, 'subject' => 'New Ticket']);
        Ticket::factory()->processed()->create(['customer_id' => $customer->id, 'subject' => 'Processed Ticket']);

        $response = $this->actingAs($this->manager)
            ->get('/admin/tickets?status=new');

        $response->assertStatus(200)
            ->assertSee('New Ticket')
            ->assertDontSee('Processed Ticket');
    }

    public function test_can_view_ticket_details(): void
    {
        $customer = Customer::factory()->create(['name' => 'John Doe']);
        $ticket = Ticket::factory()->create([
            'customer_id' => $customer->id,
            'subject' => 'Test Subject',
            'text' => 'Detailed message content',
        ]);

        $response = $this->actingAs($this->manager)
            ->get("/admin/tickets/{$ticket->id}");

        $response->assertStatus(200)
            ->assertSee('Test Subject')
            ->assertSee('Detailed message content')
            ->assertSee('John Doe');
    }

    public function test_can_update_ticket_status(): void
    {
        $ticket = Ticket::factory()
            ->for(Customer::factory())
            ->statusNew()
            ->create();

        $response = $this->actingAs($this->manager)
            ->patch("/admin/tickets/{$ticket->id}/status", [
                'status' => 'in_progress',
            ]);

        $response->assertRedirect();

        $ticket->refresh();
        $this->assertEquals(TicketStatus::IN_PROGRESS, $ticket->status);
    }

    public function test_marking_as_processed_sets_response_date(): void
    {
        $ticket = Ticket::factory()
            ->for(Customer::factory())
            ->inProgress()
            ->create();

        $this->assertNull($ticket->manager_response_at);

        $this->actingAs($this->manager)
            ->patch("/admin/tickets/{$ticket->id}/status", [
                'status' => 'processed',
            ]);

        $ticket->refresh();
        $this->assertEquals(TicketStatus::PROCESSED, $ticket->status);
        $this->assertNotNull($ticket->manager_response_at);
    }

    public function test_login_page_is_accessible(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200)
            ->assertSee('Mini-CRM');
    }

    public function test_user_can_login(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $response = $this->post('/login', [
            'email' => 'test@example.com',
            'password' => 'password',
        ]);

        $response->assertRedirect('/admin/tickets');
        $this->assertAuthenticatedAs($user);
    }

    public function test_user_cannot_login_with_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $response = $this->post('/login', [
            'email' => 'test@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertRedirect();
        $this->assertGuest();
    }
}
