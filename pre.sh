#!/bin/bash
echo "Presentation"
pdflatex -output-directory=out presentation.tex
bibtex out/presentation
pdflatex -output-directory=out presentation.tex
pdflatex -output-directory=out presentation.tex