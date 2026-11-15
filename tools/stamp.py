"""Stamp every script and the stylesheet with a short hash of its contents.

GitHub Pages lets browsers cache files for about ten minutes, which can leave
a new page running old scripts. The import map below sends each module to a
URL that changes whenever the file changes. Run before every push:

    python3 tools/stamp.py
"""
import hashlib, json, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
h = lambda p: hashlib.sha1(p.read_bytes()).hexdigest()[:8]
mods = sorted((root / 'src').glob('*.js'))
imap = {f'./src/{p.name}': f'./src/{p.name}?v={h(p)}' for p in mods}
block = '<script type="importmap">' + json.dumps({'imports': imap}, separators=(',', ':')) + '</script>'

html = (root / 'index.html').read_text()
html = re.sub(r'<script type="importmap">.*?</script>\n?', '', html, flags=re.S)
html = html.replace('<script type="module" src="src/game.js', block + '\n<script type="module" src="src/game.js', 1)
html = re.sub(r'src="src/game\.js(\?v=\w+)?"', f'src="src/game.js?v={h(root / "src/game.js")}"', html)
html = re.sub(r'href="styles/main\.css(\?v=\w+)?"', f'href="styles/main.css?v={h(root / "styles/main.css")}"', html)
(root / 'index.html').write_text(html)
print(f'stamped {len(mods)} modules and the stylesheet')
