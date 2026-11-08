# Spot 3.5.6 verification

The new city control uses a searchable, grouped light sheet for both new/edit place forms and the discovery city filter. Its 31 canonical choices cover all seven emirates plus main cities/areas. There is no free text city entry. Search accepts hamza, whitespace and diacritic variants. Existing draft and record city values normalize on load; unknown legacy values stay visible until a supported city is chosen on save.

## Data correction
Applied hosted migration spot_canonical_abu_dhabi_city. Before: five places in أبوظبي and two in ابوظبي. After: seven places in ابوظبي, and nine places in العين. Only matching city strings and normal update timestamps changed; row fingerprints for other place fields, all visits and all items matched before/after. A rollback-only write of أبو ظبي returned ابوظبي, verifying normalization for old clients. The trigger is SECURITY INVOKER in the private schema, with fixed search_path and no client EXECUTE grants. Existing policies were preserved. The security advisor had no findings about the new trigger/function; existing unrelated findings were not changed.

## Validation
- 38 release routing cases and three preview routes passed, including retained JS/CSS and crop helper.
- City tests cover variant spellings, unique choices, seven emirates, the requested main cities, unknown historical labels and filtering records with mixed spellings.
- Existing crop and publisher proof checks passed.
- Browser QA in an isolated 390px fixture: searched for أبو ظبي, selected canonical ابوظبي; searched for كلباء, saved a new place, reopened edit and confirmed كلباء remained selected. Filtered places by canonical ابوظبي and observed the matching result.
- The first fixture save lacked automatic initial visits; the fixture was corrected to simulate the existing database trigger and the save succeeded. No fixture data was sent to production.
- Physical iPhone/Safari testing was not performed. The frontend remains a candidate behind Madar approval; the requested existing-data cleanup is already live.
