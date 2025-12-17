<!DOCTYPE html>
<html lang="ru">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Форма обратной связи</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .widget-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            padding: 40px;
            width: 100%;
            max-width: 480px;
            animation: slideUp 0.5s ease-out;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .widget-header {
            text-align: center;
            margin-bottom: 30px;
        }

        .widget-header h1 {
            color: #1f2937;
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .widget-header p {
            color: #6b7280;
            font-size: 0.95rem;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            color: #374151;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 0.9rem;
        }

        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background: #f9fafb;
        }

        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #667eea;
            background: #fff;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .form-group textarea {
            min-height: 120px;
            resize: vertical;
        }

        .form-group input::placeholder,
        .form-group textarea::placeholder {
            color: #9ca3af;
        }

        .form-group .error-message {
            color: #ef4444;
            font-size: 0.85rem;
            margin-top: 6px;
            display: none;
        }

        .form-group.has-error input,
        .form-group.has-error textarea {
            border-color: #ef4444;
        }

        .form-group.has-error .error-message {
            display: block;
        }

        .file-input-wrapper {
            position: relative;
            overflow: hidden;
            display: inline-block;
            width: 100%;
        }

        .file-input-wrapper input[type="file"] {
            position: absolute;
            left: 0;
            top: 0;
            opacity: 0;
            cursor: pointer;
            width: 100%;
            height: 100%;
        }

        .file-input-label {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 14px 16px;
            background: #f3f4f6;
            border: 2px dashed #d1d5db;
            border-radius: 12px;
            color: #6b7280;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .file-input-label:hover {
            background: #e5e7eb;
            border-color: #667eea;
            color: #667eea;
        }

        .file-list {
            margin-top: 10px;
            font-size: 0.85rem;
            color: #6b7280;
        }

        .submit-btn {
            width: 100%;
            padding: 16px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            border: none;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
        }

        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.5);
        }

        .submit-btn:active {
            transform: translateY(0);
        }

        .submit-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }

        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin-right: 8px;
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }

        .success-message {
            display: none;
            text-align: center;
            padding: 40px 20px;
        }

        .success-message .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            animation: scaleIn 0.5s ease-out;
        }

        @keyframes scaleIn {
            from {
                transform: scale(0);
            }

            to {
                transform: scale(1);
            }
        }

        .success-message .icon svg {
            width: 40px;
            height: 40px;
            color: #fff;
        }

        .success-message h2 {
            color: #1f2937;
            font-size: 1.5rem;
            margin-bottom: 10px;
        }

        .success-message p {
            color: #6b7280;
        }

        .alert {
            padding: 14px 16px;
            border-radius: 12px;
            margin-bottom: 20px;
            display: none;
        }

        .alert-error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
        }

        .alert-success {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #16a34a;
        }
    </style>
</head>

<body>
    <div class="widget-container">
        <div id="form-section">
            <div class="widget-header">
                <h1>📬 Свяжитесь с нами</h1>
                <p>Заполните форму и мы ответим вам в ближайшее время</p>
            </div>

            <div id="alert" class="alert"></div>

            <form id="feedback-form" enctype="multipart/form-data">
                <div class="form-group" id="name-group">
                    <label for="name">Ваше имя *</label>
                    <input type="text" id="name" name="name" placeholder="Иван Иванов" required>
                    <div class="error-message"></div>
                </div>

                <div class="form-group" id="phone-group">
                    <label for="phone">Телефон *</label>
                    <input type="tel" id="phone" name="phone" placeholder="+79991234567" required>
                    <div class="error-message"></div>
                </div>

                <div class="form-group" id="email-group">
                    <label for="email">Email *</label>
                    <input type="email" id="email" name="email" placeholder="example@mail.ru" required>
                    <div class="error-message"></div>
                </div>

                <div class="form-group" id="subject-group">
                    <label for="subject">Тема *</label>
                    <input type="text" id="subject" name="subject" placeholder="Тема вашего обращения" required>
                    <div class="error-message"></div>
                </div>

                <div class="form-group" id="text-group">
                    <label for="text">Сообщение *</label>
                    <textarea id="text" name="text" placeholder="Опишите ваш вопрос или предложение..."
                        required></textarea>
                    <div class="error-message"></div>
                </div>

                <div class="form-group" id="files-group">
                    <label>Прикрепить файлы (до 5 файлов, макс. 10 МБ каждый)</label>
                    <div class="file-input-wrapper">
                        <div class="file-input-label">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span>Выберите файлы или перетащите сюда</span>
                        </div>
                        <input type="file" id="files" name="files[]" multiple accept="*/*">
                    </div>
                    <div class="file-list" id="file-list"></div>
                    <div class="error-message"></div>
                </div>

                <button type="submit" class="submit-btn" id="submit-btn">
                    Отправить заявку
                </button>
            </form>
        </div>

        <div id="success-section" class="success-message">
            <div class="icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>
            <h2>Спасибо!</h2>
            <p>Ваша заявка успешно отправлена.<br>Мы свяжемся с вами в ближайшее время.</p>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const form = document.getElementById('feedback-form');
            const submitBtn = document.getElementById('submit-btn');
            const alert = document.getElementById('alert');
            const fileInput = document.getElementById('files');
            const fileList = document.getElementById('file-list');
            const formSection = document.getElementById('form-section');
            const successSection = document.getElementById('success-section');

            // Update file list display
            fileInput.addEventListener('change', function () {
                const files = this.files;
                if (files.length > 0) {
                    const names = Array.from(files).map(f => f.name).join(', ');
                    fileList.textContent = `Выбрано: ${names}`;
                } else {
                    fileList.textContent = '';
                }
            });

            // Clear field error
            function clearError(fieldId) {
                const group = document.getElementById(fieldId + '-group');
                if (group) {
                    group.classList.remove('has-error');
                    group.querySelector('.error-message').textContent = '';
                }
            }

            // Add input listeners to clear errors
            ['name', 'phone', 'email', 'subject', 'text'].forEach(field => {
                const input = document.getElementById(field);
                input.addEventListener('input', () => clearError(field));
            });

            // Form submit
            form.addEventListener('submit', async function (e) {
                e.preventDefault();

                // Clear previous errors
                document.querySelectorAll('.form-group').forEach(g => {
                    g.classList.remove('has-error');
                    g.querySelector('.error-message').textContent = '';
                });
                alert.style.display = 'none';

                // Disable button
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading-spinner"></span>Отправка...';

                const formData = new FormData(form);

                try {
                    const response = await fetch('/api/tickets', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                        }
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // Success
                        formSection.style.display = 'none';
                        successSection.style.display = 'block';
                    } else if (response.status === 422) {
                        // Validation errors
                        const errors = data.errors || {};
                        for (const [field, messages] of Object.entries(errors)) {
                            const fieldName = field.replace('files.', 'files');
                            const group = document.getElementById(fieldName + '-group');
                            if (group) {
                                group.classList.add('has-error');
                                group.querySelector('.error-message').textContent = messages[0];
                            }
                        }
                    } else {
                        // Other error
                        alert.className = 'alert alert-error';
                        alert.textContent = data.message || 'Произошла ошибка. Попробуйте позже.';
                        alert.style.display = 'block';
                    }
                } catch (error) {
                    alert.className = 'alert alert-error';
                    alert.textContent = 'Ошибка сети. Проверьте подключение к интернету.';
                    alert.style.display = 'block';
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Отправить заявку';
                }
            });
        });
    </script>
</body>

</html>