# auth.md - AOSHA Platform Agent Registration & Authorization

> This document defines the authentication, authorization, and registration protocol for autonomous AI agents, LLM tool-calling systems, and enterprise automated workflows integrating with the AOSHA Platform.

## 1. Target Audience
This specification is intended for autonomous AI agents, multi-agent frameworks (MCP, A2A, LangChain, AutoGen), and automated enterprise compliance monitors requesting authenticated access to AOSHA resources.

## 2. Discovery Endpoints
- **OAuth Authorization Server:** [/.well-known/oauth-authorization-server](https://aosha.sa/.well-known/oauth-authorization-server)
- **OpenID Connect Configuration:** [/.well-known/openid-configuration](https://aosha.sa/.well-known/openid-configuration)
- **OAuth Protected Resource Metadata (PRM):** [/.well-known/oauth-protected-resource](https://aosha.sa/.well-known/oauth-protected-resource)
- **API Catalog (RFC 9727):** [/.well-known/api-catalog](https://aosha.sa/.well-known/api-catalog)
- **MCP Server Card (SEP-1649):** [/.well-known/mcp/server-card.json](https://aosha.sa/.well-known/mcp/server-card.json)
- **Agent Skills Index:** [/.well-known/agent-skills/index.json](https://aosha.sa/.well-known/agent-skills/index.json)

## 3. Registration & Provisioning Flow
Autonomous agents can register programmatically using either identity assertion or anonymous key issuance:

- **Registration Endpoint:** `POST https://aosha.sa/api/agent/register`
- **Claim Endpoint:** `POST https://aosha.sa/api/agent/claim`
- **Supported Identity Types:** `identity_assertion` (ID-JAG, verified email), `anonymous`
- **Credential Types:** `bearer_token`, `api_key`

### Request Example
```http
POST /api/agent/register HTTP/1.1
Host: aosha.sa
Content-Type: application/json

{
  "client_name": "Autonomous Safety Auditor",
  "identity_type": "anonymous",
  "requested_scopes": ["aosha:classification:read", "aosha:lms:read"]
}
```

## 4. Authenticated Request Format
Include the issued token in the standard HTTP `Authorization` header:
```http
GET /api/classification HTTP/1.1
Host: aosha.sa
Authorization: Bearer <access_token>
```

## 5. Supported Scopes
- `aosha:classification:read` - Query Six Stars facility maturity ratings and benchmark criteria.
- `aosha:lms:read` - Query course catalogs, trainer records, and verified credentials.
- `aosha:hsse:read` - Query OSH policies, civil security plans, and environmental metrics.
- `aosha:inspection:read` - Read field observation templates and CAPA workflow status.

## 6. Security & Governance
- All API communication enforces TLS 1.3 encryption.
- Default rate limit: 120 requests/minute per agent identity.
- Technical contact & human escalation: `info@aosha.sa`.
