#!/bin/bash
echo "Thesis"
pdflatex -output-directory=out thesis.tex
bibtex out/thesis
pdflatex -output-directory=out thesis.tex
pdflatex -output-directory=out thesis.tex