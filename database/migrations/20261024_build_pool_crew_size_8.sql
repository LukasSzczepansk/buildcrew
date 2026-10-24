-- BuildCrew: allow preferred crew sizes up to 8 in the Build Pool.
-- The crew member limit itself is enforced in application code (MAX_CREW_SIZE) and needs no migration.
-- Apply once, then raise `preferredCrewSize` max in src/lib/validations.ts and the select in
-- src/components/build/build-pool-listing-manager.tsx to match. Safe to run repeatedly.

alter table build_pool_listings drop constraint if exists build_pool_listings_crew_size_check;
alter table build_pool_listings
  add constraint build_pool_listings_crew_size_check check (preferred_crew_size between 2 and 8);
