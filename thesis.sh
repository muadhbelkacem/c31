#!/bin/bash
echo "Thesis"
pdflatex -output-directory=thesis thesis.tex
bibtex out/thesis
pdflatex -output-directory=thesis thesis.tex
pdflatex -output-directory=thesis thesis.tex