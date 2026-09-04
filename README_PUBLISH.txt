FIS CRG Snapshot
Generated: 2026-09-04T15:17:07.681Z

Replace these four files in pwa-crg/data/:
  heads.json
  club_specs.json
  head_reference.json
  data_version.json

Operational heads: 976
Reference-only heads: 1966
Total HeadDB rows: 2942
ClubSpecs rows: 6316

Publishing rule: heads.json contains HeadDB records that have at least one ClubSpecsDB row.
head_reference.json contains every HeadDB record in compact reference form.
No CRG application code changes are required.