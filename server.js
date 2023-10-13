const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('I\'m alive');
});

app.listen(8080, () => {
  console.log('Server started on port 8080');
});

// バックグラウンドでサーバーを実行
const server = app.listen(8080, () => {
  console.log('Server started on port 8080');
});

// プロセスを終了しない
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Server stopped');
    process.exit();
  });
});
