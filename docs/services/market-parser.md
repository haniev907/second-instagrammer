# Market parser (`services/market-parser/`)

Сервис подключается к API биржи через вебсокет и слушает новые тики. Тики слушаются только по тем парам, которые были получены ранее с помощью `stockpairs-fetcher`. Список тиков, которые нужно слушать, берется из `config/constants.js`:

```javascript
config.stocks = ['binance', 'hitbtc'];
```

В общем случае, таска с подключением и прослушкой тиков, может никогда не закончиться. Но, на слуай, если что-то пошло не так (например биржа закрыла сессию), с определенной периодичностью сервис пытается создать новые таски на прослушивание. Если предыдущая таска на прослушивание с параметрами (биржа, пара) к этому моменту не упала, то дублирования не происходит. В противном случае, сервис заново запустит эту таску.

## Диаграмма действий

![diag](/docs/images/market-parser.svg)

## Запуск сервиса

```bash
npm run market-parser
```
