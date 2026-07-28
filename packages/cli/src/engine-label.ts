// The renderers are exported, so `engineVersion` is whatever a caller passes.
// It is a bare semver from this CLI, but an embedding tool may identify itself
// instead — @geoql/vue-doctor passes `vue-doctor-design`. Prefixing every value
// with `v` printed `vvue-doctor-design`, so the prefix is applied only when the
// label actually opens with a version number. The machine-readable
// `engineVersion` field stays undecorated either way.
export const formatEngineLabel = (engineVersion: string): string =>
  /^\d/u.test(engineVersion) ? `v${engineVersion}` : engineVersion;
