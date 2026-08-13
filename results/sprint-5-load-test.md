# Sprint 5 Final Load Test Results

## Test Configuration

The fully instrumented system was tested using k6 against the primary request path:

- Virtual users: 10
- Test duration: 60 seconds
- Endpoint: POST /requests
- Load test URL: http://caddy/requests
- Total requests completed: 600
- Request rate: 9.96 requests/second

The test exercised the primary emergency request path through Caddy, the replicated request-service instances, and the asynchronous RabbitMQ processing path.

## Full k6 Summary Output

```text
  █ TOTAL RESULTS

    checks_total.......: 600     9.956704/s
    checks_succeeded...: 100.00% 600 out of 600
    checks_failed......: 0.00%   0 out of 600

    ✓ status is 202

    HTTP
    http_req_duration..............: avg=3.5ms min=373.75µs med=3.16ms max=27.88ms p(90)=5.38ms p(95)=6.56ms p(99)=11.95ms
      { expected_response:true }...: avg=3.5ms min=373.75µs med=3.16ms max=27.88ms p(90)=5.38ms p(95)=6.56ms p(99)=11.95ms
    http_req_failed................: 0.00%  0 out of 600
    http_reqs......................: 600    9.956704/s

    EXECUTION
    iteration_duration.............: avg=1s    min=1s     med=1s     max=1.02s   p(90)=1s     p(95)=1s     p(99)=1.01s
    iterations.....................: 600    9.956704/s
    vus............................: 10     min=10       max=10
    vus_max........................: 10     min=10       max=10

    NETWORK
    data_received..................: 247 kB 4.1 kB/s
    data_sent......................: 130 kB 2.2 kB/s

running (1m00.3s), 00/10 VUs, 600 complete and 0 interrupted iterations
default ✓ [ 100% ] 10 VUs  1m0s

```

## SLO Comparison

According to `docs/SLO.md`, the request-service SLO requires the
`POST /requests` endpoint to have a p95 latency below 300 ms and at least
99.9% successful request submissions.

The final load test measured a p95 latency of 6.56 ms and a 100% success rate.

| SLO                         | Target           | Final Result | Status |
| --------------------------- | ---------------- | ------------ | ------ |
| Request-service p95 latency | < 300 ms         | 6.56 ms      | Met    |
| Request-service reliability | >= 99.9% success | 100% success | Met    |

The final test directly exercised `POST /requests`, so these results provide
a more direct comparison to the request-service SLO than the Sprint 3 test,
which used `GET /requests/test`.

The API gateway, volunteer-service, and dispatch-service SLOs were not
directly evaluated by this load test because the test focused on the primary
request submission path.

## Comparison with Sprint 3

The Sprint 3 load test used 10 virtual users for 30 seconds and tested
`GET /requests/test`. It completed 300 requests with a p95 latency of
9.03 ms and a 0.00% error rate.

The Sprint 5 test used the same number of virtual users but ran for 60
seconds and tested the actual `POST /requests` request path. It completed
600 requests with a p95 latency of 6.56 ms and a 0.00% error rate.

| Metric        |   Sprint 3 |   Sprint 5 |          Change |
| ------------- | ---------: | ---------: | --------------: |
| Virtual users |         10 |         10 |            Same |
| Duration      |     30 sec |     60 sec |         +30 sec |
| Requests      |        300 |        600 |            +300 |
| p95 latency   |    9.03 ms |    6.56 ms |        Improved |
| Error rate    |      0.00% |      0.00% |       No change |
| Request rate  | 9.92 req/s | 9.96 req/s | Slight increase |

The Sprint 5 system maintained a 0.00% error rate while handling twice as
many total requests. The p95 latency also decreased from 9.03 ms to
6.56 ms. This suggests that adding asynchronous processing, health checks,
and observability instrumentation did not introduce a significant latency
penalty under this workload.

The comparison is not a perfect apples-to-apples comparison because Sprint 3
used `GET /requests/test`, while Sprint 5 used the actual `POST /requests`
endpoint. The Sprint 5 test is therefore a better test of the real emergency
request submission path.

## Interpretation

The final system performed well under the tested workload. The 10 virtual
users generated approximately 10 requests per second for 60 seconds, and all
600 requests were accepted successfully. The p95 latency of 6.56 ms was far
below the 300 ms request-service SLO.

The asynchronous RabbitMQ processing path appears to help keep the request
submission path fast because the client receives a `202 Accepted` response
after the request is queued rather than waiting for the background work to
finish. The health-check sidecar also continuously verified that both
request-service replicas were available during the test.

Based on the load test results, there is no obvious bottleneck in the
synchronous request path at this workload. The next likely bottleneck would
be the asynchronous processing layer, particularly RabbitMQ and the single
async worker, if the request rate increased significantly. The worker
processes jobs sequentially, so a large increase in incoming requests could
cause the queue to grow even though the initial `POST /requests` response
remains fast.

If I had another sprint, I would add metrics for RabbitMQ queue depth and
async processing time and test the system at higher request rates. I would
also consider adding additional async workers so that queued requests could
be processed in parallel. This would make the asynchronous portion of the
system more scalable under heavier workloads.
