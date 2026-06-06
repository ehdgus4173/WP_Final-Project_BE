// src/config/swagger.js — loads the OpenAPI spec for Swagger UI.
//
// The spec lives in docs/openapi.yaml (single source of truth, Tech-Spec §2.1).
// Parsed once at startup; a missing/invalid file fails loud.

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const SPEC_PATH = path.resolve(__dirname, "../../docs/openapi.yaml");

const swaggerDocument = yaml.load(fs.readFileSync(SPEC_PATH, "utf8"));

module.exports = { swaggerDocument };
