#!/usr/bin/env python3
"""Zet partials/header.html en partials/footer.html in alle .html-pagina's.

Gebruik (vanuit de hoofdmap):  python3 tools/sync-layout.py

Pagina's bevatten de markeringen <!-- HEADER --> ... <!-- /HEADER --> en
<!-- FOOTER --> ... <!-- /FOOTER -->. Alles daartussen wordt vervangen.
Het actieve menu-item krijgt automatisch aria-current="page".
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
header = (ROOT / "partials/header.html").read_text(encoding="utf-8").strip()
footer = (ROOT / "partials/footer.html").read_text(encoding="utf-8").strip()

# Pagina's die in het menu bij een ander item horen.
ACTIVE = {"woning.html": "aanbod.html"}

for page in sorted(ROOT.glob("*.html")):
    html = page.read_text(encoding="utf-8")
    active = ACTIVE.get(page.name, page.name)
    h = header.replace(f'<a href="{active}">', f'<a href="{active}" aria-current="page">', 1)
    new = re.sub(r"<!-- HEADER -->.*?<!-- /HEADER -->", lambda _: f"<!-- HEADER -->\n{h}\n<!-- /HEADER -->", html, flags=re.S)
    new = re.sub(r"<!-- FOOTER -->.*?<!-- /FOOTER -->", lambda _: f"<!-- FOOTER -->\n{footer}\n<!-- /FOOTER -->", new, flags=re.S)
    if new != html:
        page.write_text(new, encoding="utf-8")
        print("bijgewerkt:", page.name)
