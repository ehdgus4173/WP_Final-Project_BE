// Swagger UI용 OpenAPI 스펙 로드
// 스펙 원본은 docs/openapi.yaml (단일 출처). 시작 때 한 번 파싱, 파일 없거나 깨지면 바로 실패

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const SPEC_PATH = path.resolve(__dirname, "../../docs/openapi.yaml");

const swaggerDocument = yaml.load(fs.readFileSync(SPEC_PATH, "utf8"));

module.exports = { swaggerDocument };
