# Makefile for LaTeX compilation to 'out' directory

MAIN = main
LATEX = pdflatex
BIBER = biber
GLOSSARY = makeglossaries
OUT_DIR = out

all: $(OUT_DIR) $(OUT_DIR)/$(MAIN).pdf

$(OUT_DIR):
	mkdir -p $(OUT_DIR)

$(OUT_DIR)/$(MAIN).pdf: $(MAIN).tex
	$(LATEX) -output-directory=$(OUT_DIR) $(MAIN).tex --output-directory $(OUT_DIR) $(OUT_DIR)/$(MAIN)

clean:
	rm -rf $(OUT_DIR)

.PHONY: all clean
