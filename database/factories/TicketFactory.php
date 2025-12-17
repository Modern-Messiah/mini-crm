<?php

namespace Database\Factories;

use App\Enums\TicketStatus;
use App\Models\Customer;
use App\Models\Ticket;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ticket>
 */
class TicketFactory extends Factory
{
    protected $model = Ticket::class;

    /**
     * Russian subjects for tickets.
     */
    private static array $subjects = [
        'Вопрос по доставке заказа',
        'Проблема с оплатой',
        'Не работает личный кабинет',
        'Хочу вернуть товар',
        'Консультация по услугам',
        'Жалоба на качество обслуживания',
        'Предложение о сотрудничестве',
        'Вопрос по гарантии',
        'Изменить адрес доставки',
        'Технические неполадки на сайте',
        'Запрос на обратный звонок',
        'Уточнение по ценам',
        'Статус моего заказа',
        'Отмена заказа',
        'Благодарность сотруднику',
    ];

    /**
     * Russian messages for tickets.
     */
    private static array $messages = [
        'Добрый день! Прошу уточнить информацию по моему вопросу. Заранее благодарю за ответ.',
        'Здравствуйте! Столкнулся с проблемой и прошу помочь разобраться в ситуации.',
        'Добрый день! Хотел бы получить консультацию по данному вопросу. Буду ждать ответа.',
        'Прошу рассмотреть мое обращение в кратчайшие сроки. Это очень важно для меня.',
        'Здравствуйте! Пишу вам по поводу возникшей ситуации. Надеюсь на скорое решение.',
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = $this->faker->randomElement(TicketStatus::cases());

        return [
            'customer_id' => Customer::factory(),
            'subject' => $this->faker->randomElement(self::$subjects),
            'text' => $this->faker->randomElement(self::$messages),
            'status' => $status,
            'manager_response_at' => $status === TicketStatus::PROCESSED
                ? $this->faker->dateTimeBetween('-1 week', 'now')
                : null,
        ];
    }

    /**
     * Set the ticket status to new.
     */
    public function statusNew(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => TicketStatus::NEW ,
            'manager_response_at' => null,
        ]);
    }

    /**
     * Set the ticket status to in_progress.
     */
    public function inProgress(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => TicketStatus::IN_PROGRESS,
            'manager_response_at' => null,
        ]);
    }

    /**
     * Set the ticket status to processed.
     */
    public function processed(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => TicketStatus::PROCESSED,
            'manager_response_at' => now(),
        ]);
    }
}
