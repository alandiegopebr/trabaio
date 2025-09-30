#!/bin/bash
# Compile and run the simulator
cd "$(dirname "$0")/src"
javac Main.java Investment.java
if [ $? -eq 0 ]; then
  java Main
else
  echo "Erro na compilação."
fi
