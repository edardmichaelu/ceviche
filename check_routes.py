#!/usr/bin/env python3

from app import create_app

app = create_app()

print('Rutas de cocina registradas:')
for rule in app.url_map.iter_rules():
    if 'cocina' in str(rule.rule):
        print(f'  {rule.rule} -> {rule.endpoint}')

print('\nRutas de orden registradas:')
for rule in app.url_map.iter_rules():
    if 'orden' in str(rule.rule):
        print(f'  {rule.rule} -> {rule.endpoint}')