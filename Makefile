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
	$(LATEX) -output-directory=$(OUT_DIR) $(MAIN).tex
	# Run bibliography and glossary tools on files inside out/
	-$(GLOSSARY) -d $(OUT_DIR) $(MAIN)
	-$(BIBER) --output-directory $(OUT_DIR) $(OUT_DIR)/$(MAIN)
	$(LATEX) -output-directory=$(OUT_DIR) $(MAIN).tex
	$(LATEX) -output-directory=$(OUT_DIR) $(MAIN).tex

clean:
	rm -rf $(OUT_DIR)

.PHONY: all clean
