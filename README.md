# CS 426 Summer 2026 — Team 10

**Team Members**

- Theresa Foley — [tfoley@umass.edu](mailto:tfoley@umass.edu)
- Amanda Sherman — [asherman@umass.edu](mailto:asherman@umass.edu)

## Project Overview

Our project simulates a community emergency resource coordination system that connects residents, emergency responders, shelters, food banks, healthcare providers, and volunteers during natural disasters and other large-scale emergencies.

The platform enables users to report urgent needs, locate available shelters and essential resources, request assistance, and coordinate volunteer efforts in real time. During events such as hurricanes, floods, or wildfires, a single server would become insufficient because thousands of users may simultaneously access the system to submit requests, update resource availability, and retrieve critical information. The distributed architecture allows the system to scale across multiple service instances while improving reliability and resilience.

From a Computing for the Common Good perspective, this system is designed to benefit disaster-affected communities, particularly people who may have difficulty accessing emergency resources during a crisis. A reliable coordination system can help emergency resources reach people more quickly and efficiently.

## Architecture

The system is composed of multiple containerized services and infrastructure components:

- **Caddy** — API gateway and load balancer for incoming request traffic.
- **request-service-1** — First request-service replica.
- **request-service-2** — Second request-service replica.
- **dispatch-service** — Handles emergency resource dispatch requests.
- **request-sidecar** — Monitors the health of the request-service replicas.
- **async-worker** — Consumes asynchronous request-processing jobs.
- **RabbitMQ** — Message broker for asynchronous request processing.
- **Redis** — Shared cache used by the request-service replicas.
- **Prometheus** — Collects metrics from the custom services.
- **Grafana** — Provides the observability dashboard backed by Prometheus.

The complete service architecture is documented in [`docs/SERVICES.md`](docs/SERVICES.md).

## Repository Structure

```text
.
├── docs/
│   ├── PROJECT.md
│   ├── SERVICES.md
│   └── SLO.md
├── results/
│   ├── sprint-3-load-test.md
│   ├── sprint-4-failure.md
│   └── sprint-5-load-test.md
├── load-tests/
│   ├── sprint-3-load-test.js
│   └── sprint-5-load-test.js
├── grafana/
│   ├── Dockerfile
│   └── provisioning/
│       ├── datasources/
│       │   └── prometheus.yml
│       └── dashboards/
│           ├── dashboard.yml
│           └── system-overview.json
├── prometheus/
├── request-service/
├── dispatch-service/
├── request-sidecar/
├── async-worker/
├── docker-compose.yml
└── README.md
```

## Requirements

The standard system requires:

- Docker
- Docker Compose
- Git

k6 is required only when running the final load test locally.

## Starting the System

Clone the repository and enter the project directory:

```bash
git clone https://github.com/cs-426-team10/426-project-team-10.git
cd 426-project-team-10
```

Start the complete system with Docker Compose:

```bash
docker compose up --build
```

Docker Compose starts the application services, Redis, RabbitMQ, Prometheus, and Grafana together.

To run the services in the background:

```bash
docker compose up --build -d
```

Check the status of all containers with:

```bash
docker compose ps
```

To stop the system:

```bash
docker compose down
```

To stop the system and remove its Docker volumes:

```bash
docker compose down -v
```

## Service Endpoints

The main externally accessible services are:

| Service           | URL                     | Purpose                            |
| ----------------- | ----------------------- | ---------------------------------- |
| Caddy API Gateway | `http://localhost:8080` | Main entry point and load balancer |
| Dispatch Service  | `http://localhost:3001` | Emergency dispatch endpoint        |
| Prometheus        | `http://localhost:9090` | Metrics collection and querying    |
| Grafana           | `http://localhost:3002` | Metrics dashboard                  |

The request-service replicas run on port `3000` inside the Docker Compose network. They are accessed through Caddy rather than directly from the host.

The request-sidecar is exposed on host port `4003` for testing.

## Main Request Path

The primary emergency request path is:

```text
Client
  |
  v
Caddy API Gateway
  |
  +--------------------+
  |                    |
  v                    v
request-service-1   request-service-2
  |                    |
  +---------+----------+
            |
            v
          Redis
            |
            v
         RabbitMQ
            |
            v
       async-worker
```

Caddy distributes incoming requests across the two request-service replicas.

The request-service stores and retrieves request information using Redis and places asynchronous processing jobs onto RabbitMQ. The async-worker consumes those jobs so that the initial request does not need to wait for background processing to finish.

## Environment Variables

The standard Docker Compose setup does not require the user to create a separate `.env` file or manually provide environment variables.

Service connection information used by the containers is configured through Docker Compose and the internal Docker network. Services communicate using their Docker Compose service names rather than host-specific container IP addresses.

For example:

```text
redis://redis:6379
```

is used for communication with Redis, and RabbitMQ is accessed through its Docker Compose service name.

No production secrets or external API credentials are required to run the simulated system.

## Prometheus Metrics

Each custom service exposes a Prometheus-compatible metrics endpoint at:

```text
GET /metrics
```

The application metrics include:

- `http_requests_total` — counter tracking HTTP requests.
- `http_response_duration_ms` — histogram tracking HTTP response duration in milliseconds.

The services also expose standard Node.js process metrics through `prom-client`.

Prometheus is configured to scrape the custom services defined in the Prometheus configuration.

Prometheus can be opened at:

```text
http://localhost:9090
```

The Prometheus targets page can be used to verify that application targets are being scraped successfully.

## Grafana Dashboard

Grafana is automatically provisioned with:

- a Prometheus data source
- the Community Solar Monitoring Dashboard

Open Grafana at:

```text
http://localhost:3002
```

The dashboard is committed to the repository at:

```text
grafana/provisioning/dashboards/system-overview.json
```

The dashboard contains three required observability panels:

1. **Request Rate**
2. **Error Rate**
3. **P95 Latency**

The dashboard is automatically loaded when the Grafana container starts.

## Health Monitoring

The request-sidecar provides health monitoring for the request-service replicas.

It periodically checks the request-service health endpoints and emits structured JSON log messages describing the health of the services.

The sidecar demonstrates the sidecar pattern by keeping monitoring functionality separate from the main request-processing application.

## Structured Logging

The custom services use structured JSON logging.

Log entries contain, at minimum:

- timestamp
- log level
- message

HTTP request log entries additionally include request information such as:

- HTTP method
- request path
- status code
- response time

This allows logs to be consumed by automated logging and observability systems rather than requiring human-readable log parsing.

## Load Testing

The final load test was performed with k6 against the primary request path:

```text
POST /requests
```

The request was sent through Caddy so that the test exercised the load-balanced, replicated system rather than directly targeting a single request-service container.

The final test configuration was:

| Setting        |                Value |
| -------------- | -------------------: |
| Virtual users  |                   10 |
| Duration       |           60 seconds |
| Total requests |                  600 |
| Request rate   | 9.96 requests/second |
| p95 latency    |              6.56 ms |
| Error rate     |                0.00% |

The complete k6 summary, SLO comparison, Sprint 3 comparison, and bottleneck interpretation are available in:

[`results/sprint-5-load-test.md`](results/sprint-5-load-test.md)

### Running the Load Test

Start the complete system first:

```bash
docker compose up --build -d
```

Verify that the services are running:

```bash
docker compose ps
```

The final k6 test script is located at:

```text
load-tests/sprint-5-load-test.js
```

Run the final load test with:

```bash
k6 run load-tests/sprint-5-load-test.js
```

The script sends requests to:

```text
http://caddy/requests
```

and uses 10 virtual users for 60 seconds. Each request expects a `202 Accepted` response.

The load test should be run from an environment where the Docker Compose service name `caddy` is reachable, such as the project development container. If running k6 directly on the host machine, use the host-accessible Caddy endpoint configured for the project instead.

The recorded results and full k6 output are committed in:

```text
results/sprint-5-load-test.md
```

## SLOs

The system's service-level objectives are documented in:

```text
docs/SLO.md
```

The final load test measured a p95 latency of **6.56 ms** for `POST /requests`, compared with the request-service target of **less than 300 ms**.

The final test also achieved **100% successful request submissions**, exceeding the **99.9% reliability target**.

## Documentation

Additional project documentation is available in the `docs/` directory:

- [`docs/PROJECT.md`](docs/PROJECT.md) — Project description and background.
- [`docs/SERVICES.md`](docs/SERVICES.md) — Service architecture and system diagram.
- [`docs/SLO.md`](docs/SLO.md) — Service-level objectives.

Sprint results are available in the `results/` directory:

- [`results/sprint-3-load-test.md`](results/sprint-3-load-test.md) — Sprint 3 load-test results.
- [`results/sprint-4-failure.md`](results/sprint-4-failure.md) — Sprint 4 failure and resilience results.
- [`results/sprint-5-load-test.md`](results/sprint-5-load-test.md) — Final Sprint 5 load-test results.

Load-test scripts are available in:

- [`load-tests/sprint-3-load-test.js`](load-tests/sprint-3-load-test.js)
- [`load-tests/sprint-5-load-test.js`](load-tests/sprint-5-load-test.js)

## Final Verification

The complete system can be started with a single command:

```bash
docker compose up --build
```

After startup, verify the containers with:

```bash
docker compose ps
```

Then verify:

- Caddy is accepting requests on port `8080`.
- Prometheus is available on port `9090`.
- Grafana is available on port `3002`.
- The Grafana dashboard loads with Request Rate, Error Rate, and P95 Latency panels.
- Prometheus reports the application targets as healthy.
- The custom services expose `/metrics`.
- Structured JSON logs are produced by the custom services.

The repository contains the final system, observability configuration, dashboard export, service architecture documentation, SLO definitions, load-test scripts, and final load-test evidence.
