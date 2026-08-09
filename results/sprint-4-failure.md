# Sprint 4 Failure Scenario

## Failure Scenario

The request-service was configured with a scripted fault-injection mechanism using the `FAULT_DELAY_MS` environment variable. This allows additional latency to be added to a request-service replica without changing the application code. For this test, `request-service-1` was configured with `FAULT_DELAY_MS=5000`, causing it to intentionally delay requests by five seconds. `request-service-2` remained healthy with `FAULT_DELAY_MS=0`.

## How to Trigger the Failure

The failure scenario can be enabled by setting the `FAULT_DELAY_MS` environment variable in Docker Compose. For example:

```yaml
environment:
  FAULT_DELAY_MS: 5000
```

After rebuilding the request-service containers, requests handled by that replica print `Fault injection: delaying request by 5000ms` in the service logs.

The system was tested through Caddy, which load balances requests between the two request-service replicas.

## System Response

The system does not completely fail when one replica is intentionally slowed down. Caddy continues to route requests between the two request-service replicas, so the system remains available even though one replica is intentionally slowed down. During testing, a request routed to the healthy replica completed successfully, while the fault-injected replica logged the five-second delay.

The test also demonstrated the shared Redis cache. The first request for `failure-test` was a cache miss and took approximately 1.27 seconds. A second request for the same ID was a cache hit and completed in approximately 0.13 seconds.

This means the system can continue serving requests even when one replica has additional latency. However, the slow replica can still cause increased response time when Caddy routes a request to it.

## Production Behavior

A real production system would use monitoring and observability tools to detect increased latency and unhealthy instances. A load balancer could use health checks and remove unhealthy or overloaded instances from rotation. The system could also use timeouts, retries with backoff, circuit breakers, and autoscaling to reduce the impact of a slow service instance.

The fault-injection mechanism used here is intended for testing and demonstration. In production, the system would detect and respond to failures automatically rather than intentionally adding latency.
