"""Hybrid local skill extraction: exact, synonym, and conservative embedding matching."""
from __future__ import annotations

import json
import logging
import re
from pathlib import Path

logger = logging.getLogger(__name__)

DEFAULT_SKILLS_LIBRARY = {
    # Programming and software
    "Python": {"synonyms": ["python"], "description": "Python programming scripting data backend automation"},
    "Java": {"synonyms": ["java"], "description": "Java programming object oriented backend"},
    "C": {"synonyms": ["c programming", "language c"], "description": "C programming language systems embedded software"},
    "C++": {"synonyms": ["c++", "cpp"], "description": "C++ programming language systems embedded software"},
    "C#": {"synonyms": ["c#", "c sharp"], "description": "C sharp programming Microsoft .NET"},
    "JavaScript": {"synonyms": ["javascript"], "description": "JavaScript web frontend backend programming"},
    "TypeScript": {"synonyms": ["typescript"], "description": "TypeScript typed JavaScript frontend backend"},
    "React": {"synonyms": ["react", "reactjs", "react.js"], "description": "React frontend user interface components"},
    "Node.js": {"synonyms": ["node.js", "nodejs"], "description": "Node.js backend JavaScript runtime"},
    "SQL": {"synonyms": ["sql", "mysql"], "description": "SQL relational database querying"},
    "PostgreSQL": {"synonyms": ["postgresql", "postgres"], "description": "PostgreSQL relational database"},
    "MongoDB": {"synonyms": ["mongodb", "mongo"], "description": "MongoDB NoSQL document database"},
    "Git": {"synonyms": ["git", "github", "gitlab", "version control", "bitbucket"], "description": "Git source control collaboration"},
    "Linux": {"synonyms": ["linux", "unix", "nix"], "description": "Linux operating system command line"},
    "Docker": {"synonyms": ["docker", "containerization", "containers"], "description": "Docker containers deployment"},

    # Cloud and data
    "AWS": {"synonyms": ["aws", "amazon web services"], "description": "AWS cloud services"},
    "Azure": {"synonyms": ["azure", "microsoft azure"], "description": "Azure cloud services"},
    "GCP": {"synonyms": ["gcp", "google cloud"], "description": "Google Cloud Platform services"},
    "Machine Learning": {"synonyms": ["machine learning", "artificial intelligence"], "description": "machine learning models prediction classification"},
    "Deep Learning": {"synonyms": ["deep learning", "neural networks"], "description": "deep learning neural networks"},
    "NLP": {"synonyms": ["nlp", "natural language processing"], "description": "natural language processing text analytics"},
    "Data Analysis": {"synonyms": ["data analysis", "analytics", "data analytics"], "description": "data analysis reporting insights"},
    "Pandas": {"synonyms": ["pandas"], "description": "Pandas Python dataframe data analysis"},
    "NumPy": {"synonyms": ["numpy"], "description": "NumPy numerical computing arrays"},
    "Power BI": {"synonyms": ["power bi", "powerbi"], "description": "Power BI business intelligence dashboard"},
    "Excel": {"synonyms": ["excel", "microsoft excel", "ms excel"], "description": "Excel spreadsheet analysis"},

    # Engineering
    "FPGA": {"synonyms": ["fpga", "fpgas"], "description": "FPGA programmable logic hardware design"},
    "VHDL": {"synonyms": ["vhdl"], "description": "VHDL hardware description language FPGA"},
    "PCB": {"synonyms": ["pcb", "printed circuit board"], "description": "PCB electronic circuit board design"},
    "ModelSim": {"synonyms": ["modelsim"], "description": "ModelSim simulation tool VHDL FPGA"},
    "Oscilloscope": {"synonyms": ["oscilloscope", "oscilloscopes"], "description": "Oscilloscope electronic debugging measurement"},
    "CAD": {"synonyms": ["cad", "computer-aided design"], "description": "CAD computer aided design engineering drawings"},
    "Embedded Systems": {"synonyms": ["embedded systems", "embedded software"], "description": "embedded systems firmware hardware software"},
    "RTOS": {"synonyms": ["rtos", "real-time operating system"], "description": "RTOS real time embedded operating system"},

    # Business
    "PowerPoint": {"synonyms": ["powerpoint", "microsoft powerpoint"], "description": "PowerPoint presentations business communication"},
    "SAP": {"synonyms": ["sap", "sap ewm", "s/4 hana", "s4 hana"], "description": "SAP enterprise resource planning operations"},
    "Strategy": {"synonyms": ["strategy", "strategic planning", "business strategy"], "description": "business strategy market research competitive analysis"},
    "Operations": {"synonyms": ["operations", "supply chain", "logistics", "warehouse", "entrepôt"], "description": "operations supply chain logistics warehouse"},
    "Finance": {"synonyms": ["finance", "financial analysis"], "description": "finance financial analysis business"},
    "Accounting": {"synonyms": ["accounting", "comptabilité", "comptabilite"], "description": "accounting bookkeeping audit tax"},

    # Cybersecurity
    "Cybersecurity": {"synonyms": ["cybersecurity", "information security", "computer security"], "description": "cybersecurity security vulnerability defense"},
    "Penetration Testing": {"synonyms": ["penetration testing", "pentesting", "pen testing"], "description": "penetration testing offensive security"},
    "SIEM": {"synonyms": ["siem"], "description": "SIEM security monitoring logs"},
    "Threat Hunting": {"synonyms": ["threat hunting", "threat intelligence"], "description": "threat hunting cyber threat intelligence"},
    "TCP/IP": {"synonyms": ["tcp/ip", "tcp ip"], "description": "TCP IP networking protocol"},
    "Wireshark": {"synonyms": ["wireshark"], "description": "Wireshark packet analysis networking"},
    "Malware Analysis": {"synonyms": ["malware analysis", "malware"], "description": "malware analysis reverse engineering"},
    "Networking": {"synonyms": ["networking", "network protocols", "osi model", "dns"], "description": "computer networking TCP IP infrastructure"},

    # Soft/product
    "Communication": {"synonyms": ["communication", "presentation", "written and verbal communication"], "description": "communication teamwork presentation"},
    "Problem Solving": {"synonyms": ["problem solving", "analytical thinking", "résolution de problèmes", "resolution de problemes"], "description": "problem solving analytical thinking"},
    "Agile": {"synonyms": ["agile", "scrum", "kanban"], "description": "Agile Scrum software project method"},
    "UI/UX": {"synonyms": ["ui/ux", "ux", "user experience", "user interface"], "description": "user interface user experience design"},
    "Figma": {"synonyms": ["figma"], "description": "Figma interface design prototyping"},
}


def ensure_skills_library(path: Path) -> None:
    """Create the local skill library if it does not already exist."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_text(json.dumps(DEFAULT_SKILLS_LIBRARY, indent=2, ensure_ascii=False), encoding="utf-8")


def load_skills_library(path: Path) -> dict[str, dict[str, object]]:
    """Load skills library, supporting both dict and list-like legacy formats."""
    ensure_skills_library(path)
    data = json.loads(path.read_text(encoding="utf-8"))
    normalized: dict[str, dict[str, object]] = {}
    for skill, value in data.items():
        if isinstance(value, dict):
            synonyms = [str(v) for v in value.get("synonyms", [])]
            description = str(value.get("description", f"{skill} {' '.join(synonyms)}"))
        elif isinstance(value, list):
            synonyms = [str(v) for v in value]
            description = f"{skill} {' '.join(synonyms)}"
        else:
            synonyms = [str(value)]
            description = f"{skill} {value}"
        normalized[skill] = {"synonyms": synonyms, "description": description}
    return normalized


class SkillExtractor:
    """Extract skills with exact/synonym matching plus conservative semantic matching.

    Exact and synonym matches are always trusted. Embedding hits are accepted only
    when the best skill is both high-confidence and clearly above the second best
    skill. This reduces false positives in unrelated or multilingual postings.
    """

    def __init__(
        self,
        library_path: Path,
        model_name: str | None = None,
        device: str = "cpu",
        enable_embeddings: bool = True,
        threshold: float = 0.68,
        max_skills: int = 15,
        margin: float = 0.06,
    ) -> None:
        self.skills = load_skills_library(library_path)
        self.threshold = threshold
        self.margin = margin
        self.max_skills = max_skills
        self.model = None
        self.skill_embeddings = None
        self.skill_names = list(self.skills.keys())
        if enable_embeddings and model_name:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info("Loading embedding model for semantic skill matching: %s", model_name)
                self.model = SentenceTransformer(model_name, device=device)
                descriptions = [str(self.skills[name]["description"]) for name in self.skill_names]
                self.skill_embeddings = self.model.encode(descriptions, convert_to_tensor=True, normalize_embeddings=True)
            except Exception as exc:  # pragma: no cover - optional dependency/model
                logger.warning("Embedding skill matching disabled: %s", exc)

    @staticmethod
    def _matches_term(text: str, term: str) -> bool:
        term_l = term.lower().strip()
        if not term_l:
            return False
        # Very short aliases are risky. Require uppercase-ish token in original
        # text for C/JS/TS/ML style terms, except known symbols like C++/C#.
        if len(term_l) <= 2 and term_l not in {"c#", "c++"}:
            return re.search(rf"(?<![A-Za-z0-9]){re.escape(term)}(?![A-Za-z0-9])", text) is not None
        return re.search(rf"(?<![a-z0-9]){re.escape(term_l)}(?![a-z0-9])", text.lower()) is not None

    def _keyword_hits(self, text: str) -> set[str]:
        found: set[str] = set()
        for skill, payload in self.skills.items():
            terms = [skill, *[str(s) for s in payload.get("synonyms", [])]]
            for term in terms:
                if self._matches_term(text, term):
                    found.add(skill)
                    break
        return found

    def _embedding_hits(self, text: str) -> set[str]:
        if self.model is None or self.skill_embeddings is None or len(text.split()) < 12:
            return set()
        from sentence_transformers import util
        words = text.split()
        chunks = [" ".join(words[i:i + 100]) for i in range(0, min(len(words), 400), 100)]
        found: set[str] = set()
        for chunk in chunks:
            emb = self.model.encode(chunk, convert_to_tensor=True, normalize_embeddings=True)
            sims = util.cos_sim(emb, self.skill_embeddings)[0].detach().cpu().tolist()
            ranked = sorted(enumerate(sims), key=lambda item: item[1], reverse=True)
            if not ranked:
                continue
            top_idx, top_score = ranked[0]
            second_score = ranked[1][1] if len(ranked) > 1 else 0.0
            if top_score >= self.threshold and (top_score - second_score) >= self.margin:
                found.add(self.skill_names[top_idx])
        return found

    def extract(self, text: str) -> list[str]:
        """Return a stable, capped list of extracted skills."""
        keyword = self._keyword_hits(text)
        semantic = self._embedding_hits(text)
        ordered = sorted(keyword | semantic, key=lambda s: (s not in keyword, s.lower()))
        return ordered[: self.max_skills]
