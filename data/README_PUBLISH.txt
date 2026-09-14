FIS CRG Snapshot
Generated: 2026-09-14T13:58:30.469Z

Replace these four files in pwa-crg/data/:
  heads.json
  club_specs.json
  head_reference.json
  data_version.json

Operational heads: 975
Reference-only heads: 1965
Total HeadDB rows: 2940
ClubSpecs rows: 6315

Publishing rule: heads.json contains HeadDB records that have at least one ClubSpecsDB row.
head_reference.json contains every HeadDB record in compact reference form.
No CRG application code changes are required.