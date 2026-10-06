// 把 index.html 與 src/*.js 打包成單一 HTML（dist/dragons-heroes.html），可離線直接開啟
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
  const code = fs.readFileSync(path.join(root, src), 'utf8');
  return `<script>\n${code}\n</script>`;
});
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'dragons-heroes.html'), html);
console.log('built dist/dragons-heroes.html', (html.length / 1024).toFixed(1), 'KB');
