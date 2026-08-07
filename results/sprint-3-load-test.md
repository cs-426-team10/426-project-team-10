# Sprint 3 Load Test Results

## Test Configuration

The replicated service endpoint was tested using k6 with the following configuration:

- Virtual users: 10
- Test duration: 30 seconds
- Endpoint: GET /requests/test
- Total requests completed: 300

## Results

The load test completed successfully with no failed requests.

| Metric | Result |
|---|---:|
| Request rate | 9.92 requests/sec |
| Error rate | 0.00% |
| p50 latency | 6.27 ms |
| p95 latency | 9.03 ms |
| p99 latency | 16.69 ms |
| Average latency | 6.63 ms |
| Maximum latency | 17.14 ms |

All 300 requests returned HTTP 200 responses, resulting in a 100% success rate.

## SLO Comparison

The service met the expected reliability requirements under the tested load. 
The measured latency remained low, with a p95 latency of 9.03 ms and a p99 
latency of 16.69 ms. The system also maintained a 0% error rate while handling 
approximately 10 requests per second with 10 concurrent virtual users.

## Conclusion

The replicated service demonstrated stable performance under the tested workload. 
No request failures occurred, and latency remained within acceptable limits 
during the 30-second load test.