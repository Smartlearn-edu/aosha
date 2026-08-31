# AOSHA Platform - Agent Authentication & Registration (Auth.md)

> This document defines the authentication, authorization, and registration protocol for autonomous AI agents, LLM tool-calling systems, and enterprise automated workflows integrating with the AOSHA Platform.

## 1. Overview
AOSHA provides standard OAuth 2.0 and OpenID Connect discovery endpoints to enable programmatic, secure agent access to Moodle LMS courses, Six Stars classification data, HSSE management matrices, and inspection reporting services.

## 2. Discovery Endpoints
- **OAuth Authorization Server:** [/.well-known/oauth-authorization-server](https://aosha.sa/.well-known/oauth-authorization-server)
- **OpenID Connect Configuration:** [/.well-known/openid-configuration](https://aosha.sa/.well-known/openid-configuration)
- **OAuth Protected Resource:** [/.well-known/oauth-protected-resource](https://aosha.sa/.well-known/oauth-protected-resource)
- **API Catalog (RFC 9727):** [/.well-known/api-catalog](https://aosha.sa/.well-known/api-catalog)
- **MCP Server Card (SEP-1649):** [/.well-known/mcp/server-card.json](https://aosha.sa/.well-known/mcp/server-card.json)
- **Agent Skills Discovery:** [/.well-known/agent-skills/index.json](https://aosha.sa/.well-known/agent-skills/index.json)

## 3. Agent Registration & Credentials
To interact with AOSHA protected endpoints, AI agents should obtain authorization credentials via the following methods:

### Method A: Moodle REST WebService Token
1. Enterprise administrators generate an API WebService token within `https://lms.aosha.sa`.
2. Agents include the token in HTTP requests:
   ```http
   GET https://lms.aosha.sa/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_course_get_courses&moodlewsrestformat=json
   ```

### Method B: OAuth 2.0 Bearer Tokens
Include the issued Bearer token in the standard Authorization header:
```http
Authorization: Bearer <access_token>
```

## 4. Supported Scopes
- `aosha:classification:read` - Query Six Stars facility maturity ratings and benchmark criteria.
- `aosha:lms:read` - Query course catalogs, trainer records, and verified credentials.
- `aosha:hsse:read` - Query OSH policies, civil security plans, and environmental metrics.
- `aosha:inspection:read` - Read field observation templates and CAPA workflow status.

## 5. Security & Rate Limiting
- All API interactions must use TLS 1.3 encryption.
- Default agent rate limit is 120 requests/minute per client ID.
- For dedicated enterprise high-throughput access or custom agent registration, contact `info@aosha.sa`.
