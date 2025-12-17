<?php

namespace Tests\Feature;

use App\Enums\TicketStatus;
use App\Models\Customer;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TicketApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        Role::create(['name' => 'admin']);
        Role::create(['name' => 'manager']);
    }

    public function test_can_create_ticket_via_api(): void
    {
        $response = $this->postJson('/api/tickets', [
            'name' => 'Test User',
            'phone' => '+79991234567',
            'email' => 'test@example.com',
            'subject' => 'Test Subject',
            'text' => 'Test message content',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Заявка успешно создана',
            ]);

        $this->assertDatabaseHas('customers', [
            'phone' => '+79991234567',
            'email' => 'test@example.com',
        ]);

        $this->assertDatabaseHas('tickets', [
            'subject' => 'Test Subject',
            'status' => 'new',
        ]);
    }

    public function test_validates_phone_e164_format(): void
    {
        $response = $this->postJson('/api/tickets', [
            'name' => 'Test User',
            'phone' => '89991234567', // Invalid format
            'email' => 'test@example.com',
            'subject' => 'Test Subject',
            'text' => 'Test message',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    }

    public function test_validates_required_fields(): void
    {
        $response = $this->postJson('/api/tickets', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'phone', 'email', 'subject', 'text']);
    }

    public function test_rate_limit_one_ticket_per_day(): void
    {
        // Create first ticket
        $this->postJson('/api/tickets', [
            'name' => 'Test User',
            'phone' => '+79991234567',
            'email' => 'test@example.com',
            'subject' => 'First ticket',
            'text' => 'First message',
        ])->assertStatus(201);

        // Try to create second ticket with same phone
        $response = $this->postJson('/api/tickets', [
            'name' => 'Test User 2',
            'phone' => '+79991234567',
            'email' => 'other@example.com',
            'subject' => 'Second ticket',
            'text' => 'Second message',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    }

    public function test_statistics_requires_authentication(): void
    {
        $response = $this->getJson('/api/tickets/statistics');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_get_statistics(): void
    {
        $user = User::factory()->create();
        $user->assignRole('manager');

        // Create some tickets
        Customer::factory()
            ->has(Ticket::factory()->count(3))
            ->create();

        $response = $this->actingAs($user)
            ->getJson('/api/tickets/statistics');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => ['day', 'week', 'month', 'total'],
            ]);
    }

    public function test_can_upload_files_with_ticket(): void
    {
        Storage::fake('media');

        $file = UploadedFile::fake()->create('document.pdf', 100);

        $response = $this->postJson('/api/tickets', [
            'name' => 'Test User',
            'phone' => '+79998887766',
            'email' => 'files@example.com',
            'subject' => 'Ticket with files',
            'text' => 'Message with attachment',
            'files' => [$file],
        ]);

        $response->assertStatus(201);

        $ticket = Ticket::first();
        $this->assertCount(1, $ticket->getMedia('attachments'));
    }
}
