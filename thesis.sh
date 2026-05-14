#!/bin/bash
echo "Thesis"
xelatex -output-directory=out thesis.tex
bibtex out/thesis
xelatex -output-directory=out thesis.tex
xelatex -output-directory=out thesis.tex