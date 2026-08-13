import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,
  duration: "60s",
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

export default function () {
  const payload = JSON.stringify({
    resident_id: `LOAD-TEST-${__VU}-${__ITER}`,
    location: "North Reading",
    urgency: "high",
    need: "load test",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = http.post("http://caddy/requests", payload, params);

  check(response, {
    "status is 202": (r) => r.status === 202,
  });

  sleep(1);
}
