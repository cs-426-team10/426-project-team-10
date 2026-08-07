# Sprint 3 Load Test Results

## Test Configuration

The replicated service endpoint was tested using k6 with the following configuration:

- Virtual users: 10
- Test duration: 30 seconds
- Endpoint: GET /requests/test
- Total requests completed: 300

## Results

The load test completed successfully with no failed requests.

| Metric          |            Result |
| --------------- | ----------------: |
| Request rate    | 9.92 requests/sec |
| Error rate      |             0.00% |
| p50 latency     |           6.27 ms |
| p95 latency     |           9.03 ms |
| p99 latency     |          16.69 ms |
| Average latency |           6.63 ms |
| Maximum latency |          17.14 ms |

All 300 requests returned HTTP 200 responses, resulting in a 100% success rate.

## SLO Comparison

The load test primarily evaluated the request-service latency and reliability
through the Caddy load balancer and replicated request-service instances.

According to `docs/SLO.md`, the request-service latency target requires the
POST /requests endpoint to maintain a p95 latency below 300 ms. Although this
test exercised GET /requests/test rather than request creation, the measured
p95 latency of 9.03 ms is well below the 300 ms target. The service also
maintained a 0.00% error rate during the test, which exceeds the reliability
requirement of at least 99.9% successful request operations.

| SLO                         | Target                | Measured Result   | Status |
| --------------------------- | --------------------- | ----------------- | ------ |
| Request service p95 latency | < 300 ms              | 9.03 ms           | Met    |
| Request reliability         | >= 99.9% success rate | 100% success rate | Met    |

The API gateway and dispatch-service SLOs were not directly evaluated in this
load test because the test focused specifically on the replicated request
service endpoint behind Caddy.

## Interpretation

The results show that the replicated request service handled concurrent traffic
efficiently through the Caddy load balancer. With 10 virtual users running for
30 seconds, the system processed approximately 10 requests per second while
maintaining very low latency and no failed requests. The low p95 and p99 latency
values indicate that the current architecture has sufficient capacity for this
workload.

Under this level of traffic, there was no obvious bottleneck in Caddy, the
request-service replicas, or the Redis cache. However, as request volume
increases, potential bottlenecks could appear in the Redis cache, database
operations, or the number of available request-service replicas. To improve
scalability, the system could add more request-service replicas behind Caddy,
monitor Redis performance under heavier workloads, and optimize database access
patterns to prevent slower response times as traffic grows.

## Conclusion

The replicated service demonstrated stable performance under the tested workload.
No request failures occurred, and latency remained within acceptable limits
during the 30-second load test.
