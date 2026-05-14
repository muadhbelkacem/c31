#!/bin/bash
echo "Pdf"
xelatex -output-directory=out main.tex
bibtex out/main
xelatex -output-directory=out main.tex
xelatex -output-directory=out main.tex