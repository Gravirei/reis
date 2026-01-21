# API Design

## Decision Tree: API Architecture Style

```
What API architecture should we use?
  ├─ REST (RESTful API) [weight: 8] [priority: high] [risk: low] [recommended]
  │   ├─ Design Approach
  │   │   ├─ Resource-based URLs [recommended] → /users, /posts/{id}
  │   │   ├─ RPC-style → /getUser, /createPost
  │   │   └─ Hypermedia (HATEOAS) → Self-describing API
  │   ├─ Response Format
  │   │   ├─ JSON [recommended] → Standard for web
  │   │   ├─ XML → Legacy systems
  │   │   └─ MessagePack → Binary, efficient
  │   ├─ Versioning Strategy
  │   │   ├─ URL versioning [recommended] → /v1/users, /v2/users
  │   │   ├─ Header versioning → Accept: application/vnd.api.v1+json
  │   │   └─ Query parameter → /users?version=1
  │   ├─ Documentation
  │   │   ├─ OpenAPI/Swagger [recommended] → Interactive docs
  │   │   ├─ API Blueprint → Markdown-based
  │   │   └─ Postman Collections → Shareable examples
  │   └─ Best for
  │       ├─ Web applications → Most common
  │       ├─ Mobile apps → Wide client support
  │       ├─ Public APIs → Well-understood
  │       └─ CRUD operations → Natural fit
  │
  ├─ GraphQL [weight: 7] [priority: medium] [risk: medium]
  │   ├─ Implementation
  │   │   ├─ Apollo Server [weight: 9] [recommended]
  │   │   │   ├─ Features: Full-featured, great tooling
  │   │   │   ├─ Caching: Built-in Apollo Client
  │   │   │   └─ Subscriptions: Real-time support
  │   │   ├─ Relay → Facebook's approach, complex
  │   │   └─ GraphQL Yoga → Lightweight, modern
  │   ├─ Schema Design
  │   │   ├─ Code-first [recommended] → TypeScript decorators
  │   │   ├─ Schema-first → SDL files
  │   │   └─ Auto-generated → From database
  │   ├─ Advantages
  │   │   ├─ Single endpoint → /graphql
  │   │   ├─ Client specifies data → No over-fetching
  │   │   ├─ Strong typing → Type safety
  │   │   └─ Introspection → Self-documenting
  │   ├─ Challenges
  │   │   ├─ Caching complexity → Non-standard HTTP caching
  │   │   ├─ N+1 query problem → Needs DataLoader
  │   │   ├─ File uploads → Requires special handling
  │   │   └─ Learning curve → Team must learn GraphQL
  │   └─ Best for
  │       ├─ Complex data requirements → Multiple related entities
  │       ├─ Mobile apps → Reduce bandwidth
  │       ├─ Multiple clients → Each gets what it needs
  │       └─ Rapid iteration → Schema evolution
  │
  ├─ gRPC [weight: 6] [priority: low] [risk: medium]
  │   ├─ Protocol Buffers
  │   │   ├─ Define .proto files → Strongly typed schemas
  │   │   ├─ Code generation → Client/server stubs
  │   │   └─ Backward compatibility → Version-safe
  │   ├─ Communication Patterns
  │   │   ├─ Unary → Single request/response
  │   │   ├─ Server streaming → Multiple responses
  │   │   ├─ Client streaming → Multiple requests
  │   │   └─ Bidirectional streaming → Full duplex
  │   ├─ Advantages
  │   │   ├─ Performance → Binary protocol, HTTP/2
  │   │   ├─ Type safety → Strong contracts
  │   │   ├─ Streaming → Native support
  │   │   └─ Code generation → Less boilerplate
  │   ├─ Challenges
  │   │   ├─ Browser support → Limited without proxy
  │   │   ├─ Debugging → Binary format harder to inspect
  │   │   ├─ Learning curve → Protobuf syntax
  │   │   └─ Tooling → Less mature than REST
  │   └─ Best for
  │       ├─ Microservices → Service-to-service
  │       ├─ Real-time systems → Low latency needed
  │       ├─ Mobile backends → Efficient binary
  │       └─ Polyglot systems → Multi-language support
  │
  ├─ WebSocket [weight: 6] [priority: low] [risk: medium]
  │   ├─ Protocols
  │   │   ├─ Socket.io [recommended] → Easy, fallback support
  │   │   ├─ Native WebSocket → Standard, lightweight
  │   │   └─ Server-Sent Events → One-way, simpler
  │   ├─ Message Format
  │   │   ├─ JSON → Human-readable
  │   │   ├─ Protocol Buffers → Efficient binary
  │   │   └─ MessagePack → Compact JSON alternative
  │   └─ Best for
  │       ├─ Real-time apps → Chat, notifications
  │       ├─ Live updates → Stock tickers, sports scores
  │       ├─ Collaborative editing → Google Docs-style
  │       └─ Gaming → Low latency needed
  │
  └─ Webhook [weight: 5] [priority: low] [risk: low]
      ├─ Event-driven → Server pushes to clients
      ├─ Retry Logic → Handle failures gracefully
      ├─ Security → HMAC signatures, IP whitelisting
      └─ Best for
          ├─ Integrations → Third-party services
          ├─ Async notifications → Payment confirmations
          └─ Event broadcasting → System events
```

## Context

API architecture choice depends on:
- Client requirements (web, mobile, desktop)
- Data complexity and relationships
- Real-time needs
- Team expertise
- Performance requirements

## Recommendations

**REST is recommended** for most applications because:
- Universal understanding and support
- Simple to implement and test
- Great tooling and documentation
- Works everywhere (browsers, mobile, servers)
- Established patterns and best practices

**Use GraphQL** if:
- You have complex, nested data relationships
- Multiple client types with different needs
- You want to avoid versioning endpoints
- Mobile bandwidth is a concern
- Your team is willing to invest in learning

**Use gRPC** if:
- Building microservices (service-to-service)
- Performance is critical
- Strong typing is required
- Browser access is not needed

**Use WebSocket** if:
- You need true real-time bidirectional communication
- Low latency is critical
- You're building chat, gaming, or live updates

## REST Best Practices

### URL Structure
```
✅ Good: GET /api/users/{id}
❌ Bad:  GET /api/getUser?id={id}

✅ Good: POST /api/users
❌ Bad:  POST /api/createUser

✅ Good: GET /api/users/{id}/posts
❌ Bad:  GET /api/posts?userId={id}
```

### HTTP Methods
- `GET` - Retrieve resource(s)
- `POST` - Create new resource
- `PUT` - Update entire resource
- `PATCH` - Update partial resource
- `DELETE` - Delete resource

### Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content (successful delete)
- `400` - Bad Request (client error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Implementation Checklist

- [ ] Choose API style (REST/GraphQL/gRPC)
- [ ] Design URL structure (REST) or schema (GraphQL)
- [ ] Implement authentication (JWT, OAuth)
- [ ] Add rate limiting
- [ ] Set up CORS properly
- [ ] Implement error handling
- [ ] Add request validation
- [ ] Write API documentation
- [ ] Set up API versioning
- [ ] Add monitoring/analytics
- [ ] Implement caching strategy
- [ ] Write integration tests
- [ ] Create client SDK (optional)
