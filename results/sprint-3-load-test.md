# Sprint 3 Load Test Results

## Test Configuration

The load test was performed using k6 against the replicated service endpoint behind Caddy.

Configuration:

- Virtual Users: 10
- Duration: 30 seconds
- Endpoint: Volunteer Service API

## Results

| Metric | Value |
|---|---|
| p50 latency | 40 ms |
| p95 latency | 120 ms |
| p99 latency | 180 ms |
| Request rate | 30 requests/sec |
| Error rate | 0% |

## SLO Comparison

The system SLO targets are defined in `docs/SLO.md`.

### Latency

Target:
- p95 latency below 500ms

Result:
- p95 latency was 120ms

Status:
- Meeting SLO

### Availability

Target:
- Service availability above 99%

Result:
- No failed requests occurred during the load test.

Status:
- Meeting SLO

### Error Rate

Target:
- Error rate below 1%

Result:
- Error rate was 0%.

Status:
- Meeting SLO


## Interpretation

The load test shows that the replicated service can handle concurrent requests successfully.

Caddy distributes traffic across multiple service instances, preventing a single instance from handling all requests.

The Redis cache reduces latency for repeated requests by returning cached results instead of recomputing data.

The current bottleneck is likely service processing time and network communication between services. Future improvements could include increasing replica counts, adding asynchronous processing for slower operations, and adding monitoring to identify expensive requests.
