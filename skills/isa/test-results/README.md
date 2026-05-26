# Test Results - ISA skill SBP experiment

Captured runs of the fixture invocation against the semantic-blueprint version
and optionally against the plain-markdown baseline.

See `../test-fixture.md` for the protocol.

## Layout

- `run-NN.md` - semantic-blueprint runs (numbered, fresh-context each)
- `baseline-NN.md` - baseline runs (optional, for comparison)
- `log.csv` - append-only summary across all run sets

## log.csv schema

`date,branch,model,runs_count,section_presence_rate,artifact_schema_rate,evidence_format_rate,destination_choice_rate,shape_variance_notes`
