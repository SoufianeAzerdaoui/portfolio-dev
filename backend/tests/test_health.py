import asyncio
import unittest

import httpx

from app.main import app


class HealthEndpointTest(unittest.TestCase):
    def test_health_endpoint(self) -> None:
        async def request_health() -> httpx.Response:
            transport = httpx.ASGITransport(app=app)

            async with httpx.AsyncClient(
                transport=transport,
                base_url="http://testserver",
            ) as client:
                return await client.get("/api/health")

        response = asyncio.run(request_health())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
