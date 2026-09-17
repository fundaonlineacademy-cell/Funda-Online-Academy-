# Funda Online Academy coding-agent instructions

Before making any code change in this repository, read and follow these files in order:

1. `/AGENTS.md`
2. `/FOA_APPROVED_STATE.md`
3. `/FOA_CHANGE_CONTROL.md`

The owner, Aziwe Futhe, requires strict scope control. Changing one requested behaviour does **not** authorize redesign, cleanup, refactoring, restoration of older behaviour, wording changes, layout changes, or changes to adjacent portals/features.

If a previous owner decision is documented as protected, preserve it unless the current owner request explicitly supersedes it.

Do not add another broad runtime override to fight an existing override. If scripts are competing, treat that as a separate cleanup task and keep the current requested change narrow.

For substantial changes, use a branch and pull request and complete the FOA PR scope template.