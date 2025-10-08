#!/usr/bin/python3
import sys
import os

# Adiciona o diretório da aplicação ao Python path
sys.path.insert(0, os.path.dirname(__file__))

# Importa a aplicação Flask
from app import app as application

if __name__ == "__main__":
    application.run()