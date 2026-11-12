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

Целевой адрес: `https://todo.pervakov.com` (публикация требует отдельной настройки DNS и сертификата).

1. Установите инструменты: `npm ci`.
2. Проверьте Cloudflare: `npm run cf:whoami`. Для Wrangler можно использовать `npx wrangler login`; для DNS API нужен API token с Zone Read и DNS Edit для зоны pervakov.com. Не сохраняйте секреты в репозитории.
3. В Cloudflare создайте запись `todo` с проверенным адресом origin-сервера. Не копируйте IP из публичного DNS проксируемого сайта: это может быть адрес Cloudflare.
4. В Nginx Proxy Manager добавьте Proxy Host `todo.pervakov.com`, scheme `http`, host `todo-list-web`, port `8080`.
5. Выпустите сертификат для этого поддомена, включите Force SSL и используйте Cloudflare SSL/TLS Full (strict).
6. Проверьте DNS, HTTPS, функциональность и отсутствие изменений у остальных сайтов.

## Проверки

```sh
npm ci
npx playwright install chromium
npm run check
npm test
```

Playwright проверяет добавление, выполнение, восстановление после обновления, удаление, пустой ввод, безопасный вывод HTML, мобильную ширину и ошибки хранилища. На Linux браузеру могут потребоваться системные зависимости: `npx playwright install-deps chromium`.

Проверка в изолированном контейнере без установки библиотек на хост:

```sh
docker run --rm --shm-size=256m -v "$PWD:/work" -w /work mcr.microsoft.com/playwright:v1.65.0-noble npm test
```

## Структура

- `public/` — весь сайт без сторонних библиотек и внешних ресурсов.
- `deploy/nginx.conf` — конфигурация nginx контейнера.
- `Dockerfile`, `compose.yaml` — запуск за существующим reverse proxy.
- `tests/` — браузерные сценарии.

Node.js и npm нужны только для инструментов разработки (Wrangler и Playwright); в production работает nginx.
