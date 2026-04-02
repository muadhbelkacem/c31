# Makefile for LaTeX compilation

MAIN = main
LATEX = pdflatex
BIBER = biber
GLOSSARY = makeglossaries

all: $(MAIN).pdf

$(MAIN).pdf: $(MAIN).tex
	$(LATEX) $(MAIN).tex
	# Ignore errors if glossary or bib files are missing for now
	-$(GLOSSARY) $(MAIN)
	-$(BIBER) $(MAIN)
	$(LATEX) $(MAIN).tex
	$(LATEX) $(MAIN).tex

clean:
	rm -f *.aux *.bbl *.bcf *.blg *.log *.out *.run.xml *.toc *.lof *.lot *.glo *.glg *.gls *.ist *.acn *.acr *.alg
	rm -f $(MAIN).pdf

.PHONY: all clean
