#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sqlite3

ARQUIVO_BANCO = "banco.db"

def garantir_tabela():
    conn = sqlite3.connect(ARQUIVO_BANCO)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS imeis_autorizados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            imei TEXT UNIQUE NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def autorizar(imei: str):
    imei = (imei or "").strip()
    if not imei.isdigit() or len(imei) < 10:
        print("❌ IMEI inválido. Digite apenas números (mínimo 10 dígitos).")
        return

    conn = sqlite3.connect(ARQUIVO_BANCO)
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO imeis_autorizados (imei) VALUES (?)", (imei,))
        conn.commit()
        print(f"✅ IMEI {imei} autorizado com sucesso.")
    except sqlite3.IntegrityError:
        print(f"ℹ️ IMEI {imei} já estava autorizado.")
    finally:
        conn.close()

if __name__ == "__main__":
    garantir_tabela()
    try:
        imei_input = input("Digite o IMEI a autorizar: ").strip()
    except KeyboardInterrupt:
        print("\nCancelado.")
        raise SystemExit(0)
    autorizar(imei_input)
