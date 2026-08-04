# Sprint 3 Load Test Results

## Test Configuration

The replicated service was tested using k6 against the dispatch service endpoint.

- Endpoint tested: `POST http://localhost:3001/dispatch`
- Virtual users: 10
- Test duration: 30 seconds

The load test simulated concurrent dispatch requests to measure latency, throughput, and reliability under load.

## Results

The k6 test produced the following results:

| Metric | Value |
|---|---|
| p50 latency | XX ms |
| p95 latency | XX ms |
| p99 latency | XX ms |
| Request rate | XX requests/sec |
| Error rate | XX% |

## SLO Comparison

The results were compared against the performance targets defined in `docs/SLO.md`.

| SLO | Target | Result | Status |
|---|---|---|---|
| p95 latency | XX ms | XX ms | Met / Not Met |
| Error rate | XX% | XX% | Met / Not Met |
| Request throughput | XX requests/sec | XX requests/sec | Met / Not Met |

Based on the load test results, the service met the SLO requirements for ________. However, it did not meet the requirements for ________.

## Interpretation

The load test results show how the dispatch service performs when handling multiple concurrent requests. The median latency (p50) represents the typical response time, while the p95 and p99 values show the experience of slower requests during periods of increased load.

The main source of latency is likely the simulated 500ms processing delay in the `/dispatch` endpoint. Each request intentionally waits before returning a response, which increases overall response time. If latency needs to be improved, the service could reduce unnecessary waiting, optimize processing steps, or move longer operations into an asynchronous background workflow.

The error rate indicates the reliability of the service under load. If errors remain low, the service is handling concurrent requests successfully. Future improvements could include adding more replicas, improving load balancing, adding caching where appropriate, and monitoring resource usage to identify additional bottlenecks.                                                    
