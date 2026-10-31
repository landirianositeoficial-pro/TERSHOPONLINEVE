#!/usr/bin/env python3
"""Genera catalogo.js leyendo automáticamente todos los .webp de las carpetas."""
from pathlib import Path
import json, re
ROOT = Path(__file__).resolve().parent
BASE = ROOT / 'CATALOGO-DE-DISENO'

def natural_key(p):
    return [int(x) if x.isdigit() else x.casefold() for x in re.split(r'(\d+)', p.name)]

def label(folder):
    name = folder.name.replace('CATALOGO-', '').replace('-', ' ').replace('_', ' ')
    return name.title()

items = []
if BASE.exists():
    for folder in sorted((p for p in BASE.iterdir() if p.is_dir()), key=lambda p: p.name.casefold()):
        images = sorted((p for p in folder.iterdir() if p.is_file() and p.suffix.casefold() == '.webp'), key=natural_key)
        items.append({'folder': folder.name, 'nombre': label(folder), 'imagenes': [p.relative_to(ROOT).as_posix() for p in images]})
out = '/* Archivo generado automáticamente por generar_catalogo.py. No editar manualmente. */\nwindow.TERSHOP_DESIGNS = ' + json.dumps(items, ensure_ascii=False, separators=(',', ':')) + ';\n'
(ROOT / 'catalogo.js').write_text(out, encoding='utf-8')
print(f'Catálogo generado: {len(items)} colecciones, {sum(len(x["imagenes"]) for x in items)} diseños WebP.')
