#!/usr/bin/env python3
"""Validate the Retail Management source build before production reconciliation."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "course-data" / "retail-management"

REQUIRED_LESSON_MARKERS = [
    "Learning Outcomes",
    "Knowledge Check",
    "Feedback",
    "Key Takeaways",
    "Visual Guidance",
]
ACTIVITY_MARKERS = ["Practical Activity", "Activity"]


def numbered_questions(text: str):
    return [int(n) for n in re.findall(r"(?m)^\s*(\d+)\.\s+", text)]


def declared_number(text: str, label: str):
    match = re.search(rf"\*\*{re.escape(label)}:\*\*\s*(\d+)", text, re.I)
    return int(match.group(1)) if match else None


def main():
    failures = []
    warnings = []
    lesson_count = 0
    assessment_count = 0

    for module_no in range(1, 9):
        module = COURSE / f"module-{module_no}"
        if not module.is_dir():
            failures.append(f"Missing module directory: {module}")
            continue

        for lesson_no in range(1, 9):
            path = module / f"lesson-{lesson_no}.md"
            if not path.is_file():
                failures.append(f"Missing lesson: {path}")
                continue
            lesson_count += 1
            text = path.read_text(encoding="utf-8")
            words = re.findall(r"\b[\w’'-]+\b", text)
            if len(words) < 500:
                warnings.append(f"Short lesson review recommended ({len(words)} words): {path}")
            for marker in REQUIRED_LESSON_MARKERS:
                if marker.lower() not in text.lower():
                    failures.append(f"Missing lesson component '{marker}': {path}")
            if not any(marker.lower() in text.lower() for marker in ACTIVITY_MARKERS):
                failures.append(f"Missing activity component: {path}")
            if "study time" not in text.lower():
                warnings.append(f"No explicit estimated study time: {path}")

        formative = module / "formative-assessment.md"
        summative_candidates = [
            module / "summative-assessment.md",
            module / "summative-assessment-bank.md",
        ]
        summatives = [p for p in summative_candidates if p.is_file()]

        if not formative.is_file():
            failures.append(f"Missing formative assessment: {module}")
        else:
            assessment_count += 1
            check_assessment(formative, 32, 15, failures)

        if len(summatives) != 1:
            failures.append(f"Expected exactly one summative assessment file in {module}; found {len(summatives)}")
        else:
            assessment_count += 1
            check_assessment(summatives[0], 52, 25, failures)

    print(f"Retail Management audit: {lesson_count}/64 lessons; {assessment_count}/16 assessment banks")
    if warnings:
        print(f"\nWARNINGS ({len(warnings)}):")
        for item in warnings:
            print(f"- {item}")
    if failures:
        print(f"\nFAILURES ({len(failures)}):")
        for item in failures:
            print(f"- {item}")
        return 1

    print("\nPASS: source structure, required lesson components and assessment integrity checks passed.")
    return 0


def check_assessment(path: Path, bank_size: int, delivery: int, failures: list[str]):
    text = path.read_text(encoding="utf-8")
    declared_bank = declared_number(text, "Question bank")
    declared_delivery = declared_number(text, "Delivery")
    declared_pass = declared_number(text, "Pass mark")
    declared_attempts = declared_number(text, "Maximum attempts")

    expected_meta = {
        "question bank": (declared_bank, bank_size),
        "delivery": (declared_delivery, delivery),
        "pass mark": (declared_pass, 70),
        "maximum attempts": (declared_attempts, 3),
    }
    for name, (actual, expected) in expected_meta.items():
        if actual != expected:
            failures.append(f"{path}: {name} is {actual!r}, expected {expected}")

    nums = numbered_questions(text)
    expected_nums = list(range(1, bank_size + 1))
    if nums != expected_nums:
        failures.append(f"{path}: question numbering is not exactly 1..{bank_size}")

    answers = len(re.findall(r"(?im)^\s*\*\*Correct answer:\s*[A-D]\*\*\s*$", text))
    if answers != bank_size:
        failures.append(f"{path}: found {answers} answer keys, expected {bank_size}")


if __name__ == "__main__":
    sys.exit(main())
