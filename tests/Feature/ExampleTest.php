<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * Test widget returns a successful response.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/widget');

        $response->assertStatus(200);
    }
}
