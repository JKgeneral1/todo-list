# По порядку — To-Do List

Небольшой адаптивный сайт на русском языке. Создан как тестовое задание с помощью **OpenAI Codex**: AI использован для подготовки интерфейса, JavaScript, Docker-конфигурации и автоматизированных проверок.

## Возможности

- Добавление задачи кнопкой или Enter.
- Отметка выполнения и возврат к активной задаче.
- Удаление отдельных задач.
- Сохранение в localStorage после каждого изменения.
- Работа с клавиатуры, адаптация под телефон, безопасный вывод текста.

Данные остаются в текущем браузере на текущем домене. Синхронизации между устройствами нет. Очистка данных браузера удаляет задачи.

## Локальный запуск

Сайт не требует Node.js или сборки:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory public
```

Откройте http://localhost:4173. Используйте HTTP-сервер вместо открытия HTML через file://.

## Docker на сервере

```sh
docker network inspect npm_shared
docker compose up -d --build
docker compose ps
docker compose exec web nginx -t
```

Compose использует существующую внешнюю сеть `npm_shared`. На чистом сервере сначала создайте её командой `docker network create npm_shared` и подключите к ней ваш reverse proxy.

Контейнер работает от UID 101, с файловой системой только для чтения, временным /tmp, без capabilities и без публикации портов хоста. Проверка здоровья: `/health`. Reverse proxy обращается к `http://todo-list-web:8080`.

## Поддомен и HTTPS

Рабочий сайт: https://todo.pervakov.com

DNS-запись A в Cloudflare указывает на origin-сервер; режим DNS only. HTTPS завершается в существующем Nginx Proxy Manager. Конфигурация `deploy/proxy-todo.conf` подключена через `/data/nginx/custom/http.conf` строкой `include /data/nginx/custom/todo.conf;`. Маршрут управляется этим конфигурационным файлом, а не через UI Proxy Hosts.

Сертификат Let's Encrypt `todo-pervakov` выпущен через webroot `/data/letsencrypt-acme-challenge`. Он хранится в постоянном томе прокси. Файлы `deploy/todo-cert-renew.service` и `deploy/todo-cert-renew.timer` установлены в `/etc/systemd/system/`: ежедневная проверка продлевает сертификат при необходимости и перезагружает nginx.

Проверка развёртывания:

```sh
curl -I https://todo.pervakov.com/
systemctl list-timers todo-cert-renew.timer
```

Для работы с Cloudflare DNS используется API token с Zone Read и DNS Edit, ограниченный зоной pervakov.com. Секрет хранится локально в `.env` с правами 600, исключён из Git и Docker-образа. Этот токен проверен через Cloudflare API и использован для создания записи. `wrangler whoami` требует дополнительных прав для чтения аккаунта; его ошибка при таком ограниченном токене не означает недействительность DNS-токена.

## Проверки

```sh
npm ci
npx playwright install chromium
npm run check
npm test
```

Playwright проверяет добавление, выполнение, восстановление после обновления, удаление, пустой ввод, безопасный вывод HTML, мобильную ширину и ошибки хранилища. На Linux браузеру могут потребоваться системные зависимости: `npx playwright install-deps chromium`.

## Структура

- `public/` — весь сайт без сторонних библиотек и внешних ресурсов.
- `deploy/nginx.conf` — конфигурация nginx контейнера.
- `Dockerfile`, `compose.yaml` — запуск за существующим reverse proxy.
- `tests/` — браузерные сценарии.

Node.js и npm нужны только для инструментов разработки (Wrangler и Playwright); в production работает nginx.
