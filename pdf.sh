#!/bin/bash
echo "Pdf"
pdflatex -output-directory=out main.tex
bibtex out/main
pdflatex -output-directory=out main.tex
pdflatex -output-directory=out main.tex